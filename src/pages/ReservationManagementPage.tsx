import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { Calendar, User, Car, Package, TrendingUp, DollarSign, Clock, MapPin } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Reservation {
  id: string;
  user_id: string;
  rental_vehicle_id: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  rental_vehicle?: {
    price_per_day: number;
    location: string | null;
    vehicle?: {
      name: string;
      type: string | null;
    };
  };
  reservation_equipment?: Array<{
    id: string;
    quantity: number;
    days: number;
    price_per_day: number;
    subtotal: number;
    equipment?: {
      name: string;
      category: string | null;
    };
  }>;
  reservation_activities?: Array<{
    id: string;
    date: string;
    participants: number;
    price: number;
    activity?: {
      name: string;
      duration: string | null;
    };
  }>;
}

export default function ReservationManagementPage() {
  const { user, loading: authLoading, isAdmin, isStaff } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [updateStatusModal, setUpdateStatusModal] = useState<{
    id: string;
    currentStatus: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data, error } = await (supabase

        .from('reservations') as any)

        .select(`
          *,
          user:users(email, first_name, last_name),
          rental_vehicle:rental_vehicles(
            price_per_day,
            location,
            vehicle:vehicles(name, type)
          ),
          reservation_equipment(
            id,
            quantity,
            days,
            price_per_day,
            subtotal,
            equipment(name, category)
          ),
          reservation_activities(
            id,
            date,
            participants,
            price,
            activity:activities(name, duration)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateStatusModal) return;

    try {
      const { error } = await (supabase

        .from('reservations') as any)

        .update({ status: newStatus })
        .eq('id', updateStatusModal.id);

      if (error) throw error;

      setUpdateStatusModal(null);
      setNewStatus('');
      loadReservations();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending':
        return '保留中';
      case 'Confirmed':
        return '確定';
      case 'Completed':
        return '完了';
      case 'Cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const filteredReservations = filterStatus === 'All'
    ? reservations
    : reservations.filter(r => r.status === filterStatus);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Calendar className="h-10 w-10 mr-3 text-blue-600" />
            予約管理
          </h1>
          <p className="text-gray-600">車両レンタル予約の確認・管理</p>
        </div>

        <div className="mb-6 flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">フィルター:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">すべて</option>
            <option value="Pending">保留中</option>
            <option value="Confirmed">確定</option>
            <option value="Completed">完了</option>
            <option value="Cancelled">キャンセル</option>
          </select>
          <span className="text-sm text-gray-600 ml-4">
            {filteredReservations.length}件の予約
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              予約がありません
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'All'
                ? '現在予約がありません'
                : `${getStatusLabel(filterStatus)}の予約がありません`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          予約 #{reservation.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        予約日: {new Date(reservation.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    {(isAdmin || isStaff) && (
                      <button
                        onClick={() => {
                          setUpdateStatusModal({
                            id: reservation.id,
                            currentStatus: reservation.status,
                          });
                          setNewStatus(reservation.status);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        ステータス変更
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        ユーザー情報
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-700">
                          {reservation.user?.first_name && reservation.user?.last_name
                            ? `${reservation.user.last_name} ${reservation.user.first_name}`
                            : reservation.user?.email}
                        </p>
                        <p className="text-gray-600">{reservation.user?.email}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-green-600" />
                        レンタル期間
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-700">
                          {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                          {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-gray-600">{reservation.days}日間</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Car className="h-5 w-5 mr-2 text-orange-600" />
                      レンタル車両
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-800">
                        {reservation.rental_vehicle?.vehicle?.name || '不明'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        {reservation.rental_vehicle?.vehicle?.type && (
                          <span>{reservation.rental_vehicle.vehicle.type}</span>
                        )}
                        {reservation.rental_vehicle?.location && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {reservation.rental_vehicle.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ¥{reservation.rental_vehicle?.price_per_day.toLocaleString()}/日
                        </span>
                      </div>
                    </div>
                  </div>

                  {reservation.reservation_equipment &&
                    reservation.reservation_equipment.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Package className="h-5 w-5 mr-2 text-purple-600" />
                          レンタルギヤ ({reservation.reservation_equipment.length}点)
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {reservation.reservation_equipment.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-800">
                                  {item.equipment?.name || '不明'}
                                </span>
                                {item.equipment?.category && (
                                  <span className="ml-2 text-gray-500">
                                    ({item.equipment.category})
                                  </span>
                                )}
                                <span className="ml-2 text-gray-600">
                                  × {item.quantity} | {item.days}日間
                                </span>
                              </div>
                              <span className="text-gray-700 font-medium">
                                ¥{item.subtotal.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {reservation.reservation_activities &&
                    reservation.reservation_activities.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-pink-600" />
                          アクティビティ ({reservation.reservation_activities.length}件)
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {reservation.reservation_activities.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-800">
                                  {item.activity?.name || '不明'}
                                </span>
                                <span className="ml-2 text-gray-600">
                                  | {new Date(item.date).toLocaleDateString('ja-JP')} |{' '}
                                  {item.participants}名
                                </span>
                                {item.activity?.duration && (
                                  <span className="ml-2 text-gray-500">
                                    ({item.activity.duration})
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-700 font-medium">
                                ¥{item.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">小計</span>
                      <span className="text-gray-800">
                        ¥{reservation.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">税</span>
                      <span className="text-gray-800">¥{reservation.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span className="text-gray-800">合計</span>
                      <span className="text-blue-600">
                        ¥{reservation.total.toLocaleString()}
                      </span>
                    </div>
                    {reservation.payment_method && (
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-gray-600">決済方法</span>
                        <span className="text-gray-800">{reservation.payment_method}</span>
                      </div>
                    )}
                    {reservation.payment_status && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">決済状況</span>
                        <span className="text-gray-800">{reservation.payment_status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={updateStatusModal !== null}
        onClose={() => {
          setUpdateStatusModal(null);
          setNewStatus('');
        }}
        onConfirm={handleUpdateStatus}
        title="予約ステータスを変更"
        message="このキャンセルを承認してもよろしいですか？"
      />
    </AdminLayout>
  );
}
