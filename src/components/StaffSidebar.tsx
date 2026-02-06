import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type EquipmentPreparation = {
  id: string;
  equipment_id: string;
  equipment_name: string;
  quantity: number;
  prepared: boolean;
  prepared_at: string | null;
};

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  user?: { first_name: string; last_name: string; email: string };
  rental_vehicle?: {
    id: string;
    location: string;
    vehicle?: {
      name: string;
      manufacturer: string;
    };
  };
  rental_checklists?: Array<{
    checklist_type: string;
    completed_at: string | null;
  }>;
  equipment_preparations?: EquipmentPreparation[];
  options?: {
    equipment?: Array<{ id: string; name: string; quantity: number }>;
  };
};

export default function StaffSidebar() {
  const [todayCheckout, setTodayCheckout] = useState<Reservation[]>([]);
  const [tomorrowCheckout, setTomorrowCheckout] = useState<Reservation[]>([]);
  const [todayReturn, setTodayReturn] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: todayCheckoutData } = await supabase
        .from('reservations')
        .select(`
          *,
          user:users!reservations_user_id_fkey(first_name, last_name, email),
          rental_vehicle:rental_vehicles(
            id,
            location,
            vehicle:vehicles(name, manufacturer)
          ),
          rental_checklists(checklist_type, completed_at),
          equipment_preparations(id, equipment_id, equipment_name, quantity, prepared, prepared_at)
        `)
        .eq('start_date', todayStr)
        .in('status', ['Confirmed', 'InProgress'])
        .order('created_at', { ascending: true });

      const { data: tomorrowCheckoutData } = await supabase
        .from('reservations')
        .select(`
          *,
          user:users!reservations_user_id_fkey(first_name, last_name, email),
          rental_vehicle:rental_vehicles(
            id,
            location,
            vehicle:vehicles(name, manufacturer)
          ),
          rental_checklists(checklist_type, completed_at),
          equipment_preparations(id, equipment_id, equipment_name, quantity, prepared, prepared_at)
        `)
        .eq('start_date', tomorrowStr)
        .eq('status', 'Confirmed')
        .order('created_at', { ascending: true });

      const { data: todayReturnData } = await supabase
        .from('reservations')
        .select(`
          *,
          user:users!reservations_user_id_fkey(first_name, last_name, email),
          rental_vehicle:rental_vehicles(
            id,
            location,
            vehicle:vehicles(name, manufacturer)
          ),
          rental_checklists(checklist_type, completed_at),
          equipment_preparations(id, equipment_id, equipment_name, quantity, prepared, prepared_at)
        `)
        .eq('end_date', todayStr)
        .eq('status', 'InProgress')
        .order('created_at', { ascending: true });

      setTodayCheckout(todayCheckoutData || []);
      setTomorrowCheckout(tomorrowCheckoutData || []);
      setTodayReturn(todayReturnData || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPreRentalCheck = (reservation: Reservation) => {
    return reservation.rental_checklists?.some(
      (c) => c.checklist_type === 'pre_rental' && c.completed_at
    );
  };

  const hasHandoverCheck = (reservation: Reservation) => {
    return reservation.rental_checklists?.some(
      (c) => c.checklist_type === 'handover' && c.completed_at
    );
  };

  const hasReturnCheck = (reservation: Reservation) => {
    return reservation.rental_checklists?.some(
      (c) => c.checklist_type === 'return' && c.completed_at
    );
  };

  const handleEquipmentToggle = async (prepId: string, currentPrepared: boolean) => {
    try {
      const { error } = await supabase
        .from('equipment_preparations')
        .update({
          prepared: !currentPrepared,
          prepared_at: !currentPrepared ? new Date().toISOString() : null
        })
        .eq('id', prepId);

      if (error) throw error;

      await loadReservations();
    } catch (error) {
      console.error('Error updating equipment preparation:', error);
    }
  };

  const ReservationCard = ({
    reservation,
    type,
    section
  }: {
    reservation: Reservation;
    type: 'checkout' | 'return';
    section?: 'today' | 'tomorrow';
  }) => {
    const vehicleName = reservation.rental_vehicle?.vehicle?.name || '不明な車両';
    const manufacturer = reservation.rental_vehicle?.vehicle?.manufacturer || '';
    const userName = reservation.user
      ? `${reservation.user.first_name} ${reservation.user.last_name}`
      : '不明';
    const location = reservation.rental_vehicle?.location || '';

    const preRentalDone = hasPreRentalCheck(reservation);
    const handoverDone = hasHandoverCheck(reservation);
    const returnDone = hasReturnCheck(reservation);

    const equipmentPreps = reservation.equipment_preparations || [];
    const allEquipmentPrepared = equipmentPreps.length > 0 && equipmentPreps.every(e => e.prepared);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Link
          to={type === 'checkout'
            ? `/staff/checkout/${reservation.id}`
            : `/staff/return/${reservation.id}`
          }
          className="block p-4 hover:bg-gray-50 transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {manufacturer} {vehicleName}
              </h4>
              <p className="text-xs text-gray-600 truncate">{userName}</p>
            </div>
            {type === 'checkout' && section === 'tomorrow' && (
              <div className="flex gap-1 ml-2">
                {preRentalDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" title="貸出前チェック完了" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" title="貸出前チェック未完了" />
                )}
                {equipmentPreps.length > 0 && (
                  allEquipmentPrepared ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" title="装備品積込完了" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" title="装備品準備中" />
                  )
                )}
              </div>
            )}
            {type === 'checkout' && section === 'today' && (
              <div className="flex gap-1 ml-2">
                {handoverDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" title="引き渡し完了" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" title="引き渡し未完了" />
                )}
              </div>
            )}
            {type === 'return' && (
              <div className="flex gap-1 ml-2">
                {returnDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" title="返却チェック完了" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" title="返却チェック未完了" />
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">{location}</p>
          {type === 'checkout' && section === 'today' && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜
              {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
            </p>
          )}
        </Link>

        {type === 'checkout' && section === 'tomorrow' && equipmentPreps.length > 0 && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">装備品チェックリスト:</p>
            {equipmentPreps.map((prep) => (
              <label
                key={prep.id}
                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={prep.prepared}
                  onChange={() => handleEquipmentToggle(prep.id, prep.prepared)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className={prep.prepared ? 'line-through text-gray-500' : ''}>
                  {prep.equipment_name} × {prep.quantity}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-bold text-gray-900 text-sm">
              本日の貸出
              {todayCheckout.length > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {todayCheckout.length}
                </span>
              )}
            </h3>
          </div>
          {todayCheckout.length > 0 ? (
            <div className="space-y-2">
              {todayCheckout.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  type="checkout"
                  section="today"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">
              予定なし
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-bold text-gray-900 text-sm">
              翌日の貸出
              {tomorrowCheckout.length > 0 && (
                <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {tomorrowCheckout.length}
                </span>
              )}
            </h3>
          </div>
          {tomorrowCheckout.length > 0 ? (
            <div className="space-y-2">
              {tomorrowCheckout.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  type="checkout"
                  section="tomorrow"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">
              予定なし
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-3">
            <TrendingDown className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-bold text-gray-900 text-sm">
              本日の返却
              {todayReturn.length > 0 && (
                <span className="ml-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {todayReturn.length}
                </span>
              )}
            </h3>
          </div>
          {todayReturn.length > 0 ? (
            <div className="space-y-2">
              {todayReturn.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  type="return"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">
              予定なし
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
