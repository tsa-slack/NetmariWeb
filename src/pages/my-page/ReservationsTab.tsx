import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, MapPin, MessageSquare, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Reservation } from './types';
import { logger } from '../../lib/logger';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ReservationEquipmentItem {
  id: string;
  quantity: number;
  days?: number;
  price_per_day?: number;
  subtotal?: number;
  equipment?: { name: string; category?: string };
}

interface ReservationActivityItem {
  id: string;
  date: string;
  participants: number;
  price: number;
  activity?: { name: string; duration?: string };
}

interface ReservationsTabProps {
  myReservations: Reservation[] | undefined;
  reservationsLoading: boolean;
  reservationReviews: Record<string, boolean>;
}

export default function ReservationsTab({
  myReservations,
  reservationsLoading,
  reservationReviews,
}: ReservationsTabProps) {
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationDetails, setReservationDetails] = useState<{
    equipment: ReservationEquipmentItem[];
    activities: ReservationActivityItem[];
  }>({ equipment: [], activities: [] });

  const loadReservationDetails = async (reservationId: string) => {
    try {
      const [equipmentRes, activitiesRes] = await Promise.all([
        supabase
          .from('reservation_equipment')
          .select(`*, equipment(name, category)`)
          .eq('reservation_id', reservationId),
        supabase
          .from('reservation_activities')
          .select(`*, activity:activities(name, duration)`)
          .eq('reservation_id', reservationId),
      ]);
      setReservationDetails({
        equipment: (equipmentRes.data || []) as unknown as ReservationEquipmentItem[],
        activities: (activitiesRes.data || []) as unknown as ReservationActivityItem[],
      });
    } catch (error) {
      logger.error('Error loading reservation details:', error);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">予約一覧</h2>
        {reservationsLoading ? (
          <LoadingSpinner />
        ) : (myReservations?.length || 0) === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">予約がありません</p>
            <Link
              to="/rental"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              レンタルを予約する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {(myReservations || []).map((reservation) => {
              const vehicle = reservation.rental_vehicle?.vehicle;
              const images = (vehicle?.images as string[]) || [];
              const statusColors: Record<string, string> = {
                Pending: 'bg-yellow-100 text-yellow-800',
                Confirmed: 'bg-green-100 text-green-800',
                Completed: 'bg-gray-100 text-gray-800',
                Cancelled: 'bg-red-100 text-red-800',
              };
              const statusLabels: Record<string, string> = {
                Pending: '確認待ち',
                Confirmed: '確定',
                Completed: '完了',
                Cancelled: 'キャンセル',
              };
              const paymentStatusColors: Record<string, string> = {
                Pending: 'text-yellow-600',
                Completed: 'text-green-600',
                Failed: 'text-red-600',
              };
              const paymentStatusLabels: Record<string, string> = {
                Pending: '未払い',
                Completed: '支払済み',
                Failed: '失敗',
              };

              return (
                <div key={reservation.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                        statusColors[reservation.status || 'Pending']
                      }`}>
                        {statusLabels[reservation.status || 'Pending']}
                      </span>
                      <span className={`text-xs sm:text-sm font-semibold ${
                        paymentStatusColors[reservation.payment_status || 'Pending']
                      }`}>
                        {paymentStatusLabels[reservation.payment_status || 'Pending']}
                      </span>
                      <p className="text-xs text-gray-500">
                        予約日: {new Date(reservation.created_at || '').toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        loadReservationDetails(reservation.id);
                        setShowReservationDetail(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      詳細を見る
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {images.length > 0 ? (
                      <div
                        className="w-full sm:w-28 h-36 sm:h-28 bg-cover bg-center rounded-lg flex-shrink-0"
                        style={{ backgroundImage: `url(${images[0]})` }}
                      />
                    ) : (
                      <div className="w-full sm:w-28 h-36 sm:h-28 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="h-12 w-12 text-white" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 truncate">
                        {vehicle?.name || 'レンタル車両'}
                      </h3>
                      {vehicle?.manufacturer && (
                        <p className="text-sm text-gray-600 mb-1">{vehicle.manufacturer}</p>
                      )}
                      {reservation.rental_vehicle?.location && (
                        <div className="flex items-center text-xs text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{reservation.rental_vehicle.location}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500">開始: </span>
                          <span className="font-semibold text-gray-800">
                            {new Date(reservation.start_date).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">返却: </span>
                          <span className="font-semibold text-gray-800">
                            {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">{reservation.days}日間</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0">
                      <p className="text-xs text-gray-500">合計金額</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        ¥{Number(reservation.total).toLocaleString()}
                      </p>
                      {reservation.payment_method && (
                        <p className="text-xs text-gray-500 mt-1">
                          {reservation.payment_method === 'CreditCard' ? 'クレジットカード' : '現地払い'}
                        </p>
                      )}
                    </div>
                  </div>

                  {reservation.status === 'Completed' && (
                    <div className="mt-4 pt-4 border-t">
                      {reservationReviews[reservation.id] ? (
                        <div className="flex items-center justify-center py-2 text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">レビュー投稿済み</span>
                        </div>
                      ) : (
                        <Link
                          to={`/vehicles/review?reservation=${reservation.id}`}
                          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition shadow-md"
                        >
                          <MessageSquare className="h-5 w-5 mr-2" />
                          車両レビューを書く
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReservationDetail && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">予約詳細</h2>
              <button
                onClick={() => {
                  setShowReservationDetail(false);
                  setSelectedReservation(null);
                  setReservationDetails({ equipment: [], activities: [] });
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">予約情報</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">予約番号</span>
                    <span className="font-semibold text-gray-800">{selectedReservation.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">予約日時</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(selectedReservation.created_at || '').toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ステータス</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedReservation.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      selectedReservation.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                      selectedReservation.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedReservation.status === 'Confirmed' ? '確定' :
                       selectedReservation.status === 'Completed' ? '完了' :
                       selectedReservation.status === 'Cancelled' ? 'キャンセル' : '確認待ち'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">車両情報</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    {selectedReservation.rental_vehicle?.vehicle?.images &&
                     (selectedReservation.rental_vehicle.vehicle.images as string[])[0] ? (
                      <div
                        className="w-24 h-24 bg-cover bg-center rounded-lg flex-shrink-0"
                        style={{ backgroundImage: `url(${(selectedReservation.rental_vehicle.vehicle.images as string[])[0]})` }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800">
                        {selectedReservation.rental_vehicle?.vehicle?.name || 'レンタル車両'}
                      </h4>
                      {selectedReservation.rental_vehicle?.vehicle?.manufacturer && (
                        <p className="text-gray-600">{selectedReservation.rental_vehicle.vehicle.manufacturer}</p>
                      )}
                      {selectedReservation.rental_vehicle?.location && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {selectedReservation.rental_vehicle.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">利用開始日</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedReservation.start_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">返却日</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedReservation.end_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">利用日数</p>
                      <p className="font-semibold text-gray-800">{selectedReservation.days}日間</p>
                    </div>
                  </div>
                </div>
              </div>

              {reservationDetails.equipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">レンタル装備・ギア</h3>
                  <div className="space-y-2">
                    {reservationDetails.equipment.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.equipment?.name || '不明'}
                            {item.equipment?.category && (
                              <span className="ml-2 text-xs text-gray-500">({item.equipment.category})</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.quantity}個 × {item.days}日 × ¥{Number(item.price_per_day).toLocaleString()}/日
                          </p>
                        </div>
                        <p className="font-bold text-blue-600">¥{Number(item.subtotal).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reservationDetails.activities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">アクティビティ</h3>
                  <div className="space-y-2">
                    {reservationDetails.activities.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{item.activity?.name || '不明'}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(item.date).toLocaleDateString('ja-JP')} - {item.participants}名
                            {item.activity?.duration && ` (${item.activity.duration})`}
                          </p>
                        </div>
                        <p className="font-bold text-blue-600">¥{Number(item.price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">お支払い情報</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小計</span>
                    <span className="font-semibold text-gray-800">¥{Number(selectedReservation.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">税金</span>
                    <span className="font-semibold text-gray-800">¥{Number(selectedReservation.tax).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-800">合計金額</span>
                    <span className="text-2xl font-bold text-blue-600">¥{Number(selectedReservation.total).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-sm">
                    <span className="text-gray-600">支払い方法</span>
                    <span className="font-semibold text-gray-800">
                      {selectedReservation.payment_method === 'CreditCard' ? 'クレジットカード' : '現地払い'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">支払いステータス</span>
                    <span className={`font-semibold ${
                      selectedReservation.payment_status === 'Completed' ? 'text-green-600' :
                      selectedReservation.payment_status === 'Failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedReservation.payment_status === 'Completed' ? '支払済み' :
                       selectedReservation.payment_status === 'Failed' ? '失敗' : '未払い'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
