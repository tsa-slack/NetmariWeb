import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReservationRepository, StoryRepository } from '../lib/data-access/repositories';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { useQuery } from '../lib/data-access';
import {
  BookOpen,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertCircle,
  Car,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { logger } from '../lib/logger';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardStats {
  pendingStories: number;
  pendingReviews: number;
  openQuestions: number;
  totalReports: number;
  activeRentals: number;
}

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
};

const reservationRepo = new ReservationRepository();
const storyRepo = new StoryRepository();

export default function StaffPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();

  // レンタカー予約スケジュール
  const [todayCheckout, setTodayCheckout] = useState<Reservation[]>([]);
  const [tomorrowCheckout, setTomorrowCheckout] = useState<Reservation[]>([]);
  const [todayReturn, setTodayReturn] = useState<Reservation[]>([]);
  const [rentalLoading, setRentalLoading] = useState(true);

  // 統計情報を取得
  const { data: stats } = useQuery<DashboardStats>(
    async () => {
      const result = await reservationRepo.getDashboardCounts();
      if (!result.success) throw result.error;

      return {
        success: true,
        data: {
          ...result.data,
          totalReports: 0,
        },
      };
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  // 最近の活動を取得
  const { data: recentItems } = useQuery<{ id: string; title: string; created_at: string | null; status: string | null; type: string }[]>(
    async () => {
      const result = await storyRepo.findAll();
      if (!result.success) throw result.error;

      const stories = (result.data || []).slice(0, 5);

      return {
        success: true,
        data: stories.map((story) => ({
          id: story.id,
          title: story.title,
          created_at: story.created_at,
          status: story.status,
          type: 'story' as const,
        })),
      };
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  // レンタカースケジュールを取得
  useEffect(() => {
    if (!user || (!isAdmin && !isStaff)) return;
    loadReservations();
  }, [user, isAdmin, isStaff]);

  const loadReservations = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const selectQuery = `
        *,
        user:users!reservations_user_id_fkey(first_name, last_name, email),
        rental_vehicle:rental_vehicles(
          id, location,
          vehicle:vehicles(name, manufacturer)
        ),
        rental_checklists(checklist_type, completed_at)
      `;

      const [checkoutRes, tomorrowRes, returnRes] = await Promise.all([
        supabase.from('reservations').select(selectQuery)
          .eq('start_date', todayStr).in('status', ['Confirmed', 'InProgress'])
          .order('created_at', { ascending: true }),
        supabase.from('reservations').select(selectQuery)
          .eq('start_date', tomorrowStr).eq('status', 'Confirmed')
          .order('created_at', { ascending: true }),
        supabase.from('reservations').select(selectQuery)
          .eq('end_date', todayStr).eq('status', 'InProgress')
          .order('created_at', { ascending: true }),
      ]);

      setTodayCheckout((checkoutRes.data as Reservation[]) || []);
      setTomorrowCheckout((tomorrowRes.data as Reservation[]) || []);
      setTodayReturn((returnRes.data as Reservation[]) || []);
    } catch (error) {
      logger.error('Error loading reservations:', error);
    } finally {
      setRentalLoading(false);
    }
  };

  const hasChecklistCompleted = (reservation: Reservation, type: string) => {
    return reservation.rental_checklists?.some(
      (c) => c.checklist_type === type && c.completed_at
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  const ReservationCard = ({
    reservation,
    type,
  }: {
    reservation: Reservation;
    type: 'checkout' | 'return';
  }) => {
    const vehicleName = reservation.rental_vehicle?.vehicle?.name || '不明な車両';
    const manufacturer = reservation.rental_vehicle?.vehicle?.manufacturer || '';
    const userName = reservation.user
      ? `${reservation.user.first_name} ${reservation.user.last_name}`
      : '不明';
    const location = reservation.rental_vehicle?.location || '';
    const handoverDone = hasChecklistCompleted(reservation, 'handover');
    const returnDone = hasChecklistCompleted(reservation, 'return');

    return (
      <Link
        to={type === 'checkout'
          ? `/staff/checkout/${reservation.id}`
          : `/staff/return/${reservation.id}`
        }
        className="block bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:shadow-md transition"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {manufacturer} {vehicleName}
            </h4>
            <p className="text-xs text-gray-600 truncate">{userName}</p>
          </div>
          <div className="flex gap-1 ml-2">
            {type === 'checkout' && (
              handoverDone ? (
                <span title="引き渡し完了">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                </span>
              ) : (
                <span title="引き渡し未完了">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                </span>
              )
            )}
            {type === 'return' && (
              returnDone ? (
                <span title="返却チェック完了">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                </span>
              ) : (
                <span title="返却チェック未完了">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                </span>
              )
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">{location}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜{' '}
          {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
        </p>
      </Link>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
          スタッフダッシュボード
        </h1>
        <p className="text-gray-600">レンタル管理とコンテンツモデレーション</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Car className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
            <span className="text-2xl lg:text-3xl font-bold">{stats?.activeRentals || 0}</span>
          </div>
          <p className="text-green-100 text-sm lg:text-base">貸出中</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
            <span className="text-2xl lg:text-3xl font-bold">{stats?.pendingStories || 0}</span>
          </div>
          <p className="text-pink-100 text-sm lg:text-base">承認待ちストーリー</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
            <span className="text-2xl lg:text-3xl font-bold">{stats?.pendingReviews || 0}</span>
          </div>
          <p className="text-yellow-100 text-sm lg:text-base">承認待ちレビュー</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
            <span className="text-2xl lg:text-3xl font-bold">{stats?.openQuestions || 0}</span>
          </div>
          <p className="text-blue-100 text-sm lg:text-base">未回答の質問</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
            <span className="text-2xl lg:text-3xl font-bold">{stats?.totalReports || 0}</span>
          </div>
          <p className="text-red-100 text-sm lg:text-base">報告された問題</p>
        </div>
      </div>

      {/* レンタカー管理スケジュール */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">
              本日の貸出
            </h2>
            {todayCheckout.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                {todayCheckout.length}
              </span>
            )}
          </div>
          {rentalLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ) : todayCheckout.length > 0 ? (
            <div className="space-y-3">
              {todayCheckout.map((r) => (
                <ReservationCard key={r.id} reservation={r} type="checkout" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">予定なし</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">
              翌日の貸出
            </h2>
            {tomorrowCheckout.length > 0 && (
              <span className="ml-2 bg-green-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                {tomorrowCheckout.length}
              </span>
            )}
          </div>
          {rentalLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ) : tomorrowCheckout.length > 0 ? (
            <div className="space-y-3">
              {tomorrowCheckout.map((r) => (
                <ReservationCard key={r.id} reservation={r} type="checkout" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">予定なし</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">
              本日の返却
            </h2>
            {todayReturn.length > 0 && (
              <span className="ml-2 bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                {todayReturn.length}
              </span>
            )}
          </div>
          {rentalLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ) : todayReturn.length > 0 ? (
            <div className="space-y-3">
              {todayReturn.map((r) => (
                <ReservationCard key={r.id} reservation={r} type="return" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">予定なし</p>
          )}
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">最近の活動</h2>
        {(recentItems || []).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            最近の活動はありません
          </p>
        ) : (
          <div className="space-y-3">
            {(recentItems || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ja-JP') : '-'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.status === 'Draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : item.status === 'Published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status === 'Draft'
                    ? '承認待ち'
                    : item.status === 'Published'
                    ? '公開済み'
                    : item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
