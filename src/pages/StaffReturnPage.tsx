import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  Send,
  Car,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  user?: { first_name: string; last_name: string; email: string; phone_number?: string };
  rental_vehicle?: {
    id: string;
    location: string;
    vehicle?: {
      name: string;
      manufacturer: string;
      type: string;
    };
  };
};

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

const RETURN_ITEMS: ChecklistItem[] = [
  { id: 'exterior_condition', label: '外装の状態確認', checked: false },
  { id: 'new_damage_check', label: '新規傷・凹みチェック', checked: false },
  { id: 'interior_condition', label: '内装の状態確認', checked: false },
  { id: 'cleanliness', label: '車内清掃状態確認', checked: false },
  { id: 'fuel_level', label: '燃料返却レベル確認', checked: false },
  { id: 'equipment_return', label: '付属品返却確認', checked: false },
  { id: 'key_return', label: '鍵の返却確認', checked: false },
  { id: 'document_return', label: '書類の返却確認', checked: false },
  { id: 'mileage_record', label: '走行距離記録', checked: false },
  { id: 'toll_etc_check', label: 'ETC・有料道路使用確認', checked: false },
  { id: 'violation_check', label: '違反・事故なし確認', checked: false },
  { id: 'customer_feedback', label: 'お客様フィードバック', checked: false },
];

export default function StaffReturnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isStaff, isAdmin } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnItems, setReturnItems] = useState<ChecklistItem[]>(RETURN_ITEMS);
  const [returnNotes, setReturnNotes] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [hasDamage, setHasDamage] = useState(false);
  const [mileage, setMileage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && (isStaff || isAdmin) && id) {
      loadReservation();
    }
  }, [user, isStaff, isAdmin, id]);

  const loadReservation = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          user:users!reservations_user_id_fkey(first_name, last_name, email, phone_number),
          rental_vehicle:rental_vehicles(
            id,
            location,
            vehicle:vehicles(name, manufacturer, type)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        alert('予約が見つかりません');
        navigate('/staff');
        return;
      }

      setReservation(data);

      const { data: checklists } = await supabase
        .from('rental_checklists')
        .select('*')
        .eq('reservation_id', id);

      if (checklists) {
        const returnChecklist = checklists.find((c) => c.checklist_type === 'return');

        if (returnChecklist) {
          const checklistData = returnChecklist.checklist_data as any;
          if (checklistData.items) {
            setReturnItems(checklistData.items);
          }
          if (checklistData.notes) {
            setReturnNotes(checklistData.notes);
          }
          if (checklistData.damageNotes) {
            setDamageNotes(checklistData.damageNotes);
          }
          if (checklistData.hasDamage !== undefined) {
            setHasDamage(checklistData.hasDamage);
          }
          if (checklistData.mileage) {
            setMileage(checklistData.mileage);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      alert('予約の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleReturnItem = (itemId: string) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const saveChecklist = async (complete: boolean = false) => {
    if (!id || !user) return;

    setSaving(true);
    try {
      const checklistData = {
        items: returnItems,
        notes: returnNotes,
        damageNotes,
        hasDamage,
        mileage,
      };

      const { data: existingChecklist } = await supabase
        .from('rental_checklists')
        .select('id')
        .eq('reservation_id', id)
        .eq('checklist_type', 'return')
        .maybeSingle();

      if (existingChecklist) {
        const updateData: any = {
          checklist_data: checklistData,
          notes: returnNotes,
        };

        if (complete) {
          updateData.completed_by = user.id;
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('rental_checklists')
          .update(updateData)
          .eq('id', existingChecklist.id);

        if (error) throw error;
      } else {
        const insertData: any = {
          reservation_id: id,
          checklist_type: 'return',
          checklist_data: checklistData,
          notes: returnNotes,
        };

        if (complete) {
          insertData.completed_by = user.id;
          insertData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('rental_checklists')
          .insert(insertData);

        if (error) throw error;
      }

      if (complete) {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'Completed' })
          .eq('id', id);

        if (updateError) throw updateError;

        const { error: vehicleError } = await supabase
          .from('rental_vehicles')
          .update({ status: 'Available' })
          .eq('id', reservation?.rental_vehicle_id);

        if (vehicleError) throw vehicleError;

        alert('返却処理が完了しました');
        navigate('/staff');
      } else {
        alert('チェックリストを保存しました');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (!isStaff && !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">予約が見つかりません</p>
      </div>
    );
  }

  const vehicleName = reservation.rental_vehicle?.vehicle?.name || '不明な車両';
  const manufacturer = reservation.rental_vehicle?.vehicle?.manufacturer || '';
  const vehicleType = reservation.rental_vehicle?.vehicle?.type || '';
  const userName = reservation.user
    ? `${reservation.user.last_name} ${reservation.user.first_name}`
    : '不明';
  const userEmail = reservation.user?.email || '';
  const userPhone = reservation.user?.phone_number || '';
  const location = reservation.rental_vehicle?.location || '';

  const returnProgress = returnItems.filter((item) => item.checked).length;
  const returnTotal = returnItems.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/staff')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            戻る
          </button>

          <div className="space-y-3">
            <div className="flex items-start">
              <Car className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900">{manufacturer} {vehicleName}</p>
                <p className="text-sm text-gray-600">{vehicleType}</p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
                {userPhone && <p className="text-sm text-gray-600">{userPhone}</p>}
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900">
                  {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                  {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                </p>
                <p className="text-sm text-gray-600">{reservation.days}日間</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900">{location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            返却チェック
          </h3>
          <p className="text-sm text-blue-800">
            完了: {returnProgress}/{returnTotal}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-4">車両返却確認</h3>
          <div className="space-y-3">
            {returnItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleReturnItem(item.id)}
                className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
              >
                {item.checked ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                )}
                <span
                  className={`flex-1 ${
                    item.checked ? 'text-gray-700' : 'text-gray-900'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            走行距離（km）
          </label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="返却時の走行距離を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center text-sm font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              損傷・問題あり
            </label>
            <button
              onClick={() => setHasDamage(!hasDamage)}
              className={`px-4 py-2 rounded-lg transition ${
                hasDamage
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {hasDamage ? 'あり' : 'なし'}
            </button>
          </div>
          {hasDamage && (
            <textarea
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="損傷や問題の詳細を記入してください"
              rows={4}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            メモ・備考
          </label>
          <textarea
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="特記事項があれば記入してください"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => saveChecklist(false)}
            disabled={saving}
            className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            保存
          </button>
          <button
            onClick={() => saveChecklist(true)}
            disabled={saving || returnProgress < returnTotal || !mileage}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="h-5 w-5 mr-2" />
            返却完了
          </button>
        </div>
      </div>
    </div>
  );
}
