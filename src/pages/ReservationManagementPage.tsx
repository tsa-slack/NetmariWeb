import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Calendar, User, Car, Package, TrendingUp, DollarSign, Clock, MapPin, LayoutGrid, List } from 'lucide-react';
import { useQuery, useRepository, ReservationRepository } from '../lib/data-access';
import type { CalendarData } from '../lib/data-access';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';
import ReservationCalendarMatrix from '../components/reservation/ReservationCalendarMatrix';

type ViewMode = 'calendar' | 'list';

export default function ReservationManagementPage() {
  const { user, loading: authLoading, isAdmin, isStaff } = useAuth();
  const reservationRepo = useRepository(ReservationRepository);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [updateStatusModal, setUpdateStatusModal] = useState<{
    id: string;
    currentStatus: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  // カレンダー用日付範囲（前後2ヶ月分余裕を持って取得）
  const calendarRange = (() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  })();

  // リスト用: 予約一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservations, loading: listLoading, refetch: refetchList } = useQuery<any[]>(
    async () => {
      return reservationRepo.findAllWithDetails();
    },
    { enabled: viewMode === 'list' }
  );

  // カレンダー用: 車両+予約データを取得
  const { data: calendarData, loading: calendarLoading, refetch: refetchCalendar } = useQuery<CalendarData>(
    async () => {
      return reservationRepo.findForCalendar(calendarRange.start, calendarRange.end);
    },
    { enabled: viewMode === 'calendar' }
  );

  const refetchAll = useCallback(() => {
    if (viewMode === 'calendar') refetchCalendar();
    else refetchList();
  }, [viewMode, refetchCalendar, refetchList]);

  // リスト用: ステータス更新
  const handleUpdateStatus = async () => {
    if (!updateStatusModal) return;
    try {
      const result = await reservationRepo.updateStatus(updateStatusModal.id, newStatus);
      if (!result.success) throw result.error;
      setUpdateStatusModal(null);
      setNewStatus('');
      refetchAll();
    } catch (error) {
      handleError(error, 'ステータスの更新に失敗しました');
    }
  };

  // カレンダー用: ステータス更新
  const handleCalendarStatusUpdate = async (id: string, status: string) => {
    try {
      const result = await reservationRepo.updateStatus(id, status);
      if (!result.success) throw result.error;
      refetchCalendar();
    } catch (error) {
      handleError(error, 'ステータスの更新に失敗しました');
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
      case 'InProgress':
        return 'bg-indigo-100 text-indigo-800';
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
      case 'InProgress':
        return '貸出中';
      default:
        return status;
    }
  };

  const filteredReservations = filterStatus === 'All'
    ? (reservations || [])
    : (reservations || []).filter(r => r.status === filterStatus);

  if (authLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Calendar className="h-10 w-10 mr-3 text-blue-600" />
            予約管理
          </h1>
          <p className="text-gray-600">車両レンタル予約の確認・管理</p>
        </div>

        {/* ビュー切替 */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              カレンダー
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
              リスト
            </button>
          </div>

          {/* リストビューのフィルター */}
          {viewMode === 'list' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">フィルター:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">すべて</option>
                <option value="Pending">保留中</option>
                <option value="Confirmed">確定</option>
                <option value="InProgress">貸出中</option>
                <option value="Completed">完了</option>
                <option value="Cancelled">キャンセル</option>
              </select>
              <span className="text-sm text-gray-600 ml-4">
                {filteredReservations.length}件の予約
              </span>
            </div>
          )}
        </div>

        {/* カレンダービュー */}
        {viewMode === 'calendar' && (
          calendarLoading ? (
            <LoadingSpinner size="sm" fullPage={false} />
          ) : calendarData ? (
            <ReservationCalendarMatrix
              reservations={calendarData.reservations}
              vehicles={calendarData.vehicles}
              onUpdateStatus={handleCalendarStatusUpdate}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                データの読み込みに失敗しました
              </h3>
              <button
                onClick={refetchCalendar}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                再読み込み
              </button>
            </div>
          )
        )}

        {/* リストビュー */}
        {viewMode === 'list' && (
          listLoading ? (
            <LoadingSpinner size="sm" fullPage={false} />
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
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {reservation.reservation_equipment.map((item: any) => (
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
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {reservation.reservation_activities.map((item: any) => (
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
          )
        )}
      </div>

      {/* リストビュー用ステータス変更モーダル */}
      {updateStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setUpdateStatusModal(null);
                setNewStatus('');
              }}
            />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">予約ステータスを変更</h3>
              <p className="text-sm text-gray-600 mb-2">
                現在のステータス:{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(updateStatusModal.currentStatus)}`}>
                  {getStatusLabel(updateStatusModal.currentStatus)}
                </span>
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいステータス
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                >
                  <option value="Pending">保留中</option>
                  <option value="Confirmed">確定</option>
                  <option value="InProgress">貸出中</option>
                  <option value="Completed">完了</option>
                  <option value="Cancelled">キャンセル</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setUpdateStatusModal(null);
                    setNewStatus('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  戻る
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={newStatus === updateStatusModal.currentStatus}
                  className={`px-4 py-2 rounded-lg text-white transition ${
                    newStatus === updateStatusModal.currentStatus
                      ? 'bg-gray-400 cursor-not-allowed'
                      : newStatus === 'Cancelled'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  ステータスを更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
