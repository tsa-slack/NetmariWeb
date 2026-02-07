import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useQuery } from '../lib/data-access';
import {
  Store,
  Star,
  MessageSquare,
  TrendingUp,
  Edit,
  Eye,
  Heart,
  MapPin,
  Calendar,
  Activity,
  Package,
  Plus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type Partner = Database['public']['Tables']['partners']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  users?: { email: string; first_name: string; last_name: string } | null;
  rental_vehicles?: { vehicle_id: string } | null;
};

export default function PartnerDashboardPage() {
  const { user, loading, isPartner } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    totalFavorites: 0,
    monthlyViews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'equipment' | 'reservations'>('overview');

  // パートナーデータを一括取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const { data: _dashboardData } = useQuery<any>(
    async () => {
      if (!user) return { success: true, data: null };

      const { data: partnerData, error: partnerError } = await (supabase
        .from('partners'))
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (partnerError) throw partnerError;
      if (!partnerData) return { success: true, data: null };

      // 並列でデータ取得
      const [reviewsRes, favoritesRes, recentReviewsRes, activitiesRes, equipmentRes, reservationsRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('rating')
          .eq('target_type', 'Partner')
          .eq('target_id', partnerData.id),
        supabase
          .from('partner_favorites')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', partnerData.id),
        (supabase.from('reviews'))
          .select('*')
          .eq('target_type', 'Partner')
          .eq('target_id', partnerData.id)
          .order('created_at', { ascending: false })
          .limit(5),
        (supabase.from('activities'))
          .select('*')
          .order('created_at', { ascending: false }),
        (supabase.from('equipment'))
          .select('*')
          .order('name', { ascending: true }),
        (supabase.from('reservations'))
          .select(`
            *,
            users:user_id (
              email,
              first_name,
              last_name
            ),
            rental_vehicles:rental_vehicle_id (
              vehicle_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const reviews = reviewsRes.data || [];
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
          : 0;

      setPartner(partnerData);
      setStats({
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalFavorites: favoritesRes.count || 0,
        monthlyViews: 0,
      });
      setRecentReviews(recentReviewsRes.data || []);
      setActivities(activitiesRes.data || []);
      setEquipment(equipmentRes.data || []);
      setReservations(reservationsRes.data || []);

      return { success: true, data: partnerData };
    },
    { enabled: !!(user && isPartner) }
  );

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user || !isPartner) {
    return <Navigate to="/" replace />;
  }

  if (!partner) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Store className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              協力店プロフィールが見つかりません
            </h2>
            <p className="text-gray-600 mb-6">
              パートナーアカウントに協力店情報が紐づけられていません。管理者にお問い合わせください。
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            パートナーダッシュボード
          </h1>
          <p className="text-gray-600">{partner.name}の管理画面</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                概要
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <Activity className="h-5 w-5 mr-2" />
                アクティビティ管理
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <Package className="h-5 w-5 mr-2" />
                ギヤ管理
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`${
                  activeTab === 'reservations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <Calendar className="h-5 w-5 mr-2" />
                予約状況
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.averageRating}</span>
            </div>
            <p className="text-blue-100">平均評価</p>
            <p className="text-blue-200 text-sm">{stats.totalReviews}件のレビュー</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalFavorites}</span>
            </div>
            <p className="text-pink-100">お気に入り登録数</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.monthlyViews}</span>
            </div>
            <p className="text-green-100">今月の閲覧数</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">+12%</span>
            </div>
            <p className="text-purple-100">先月比</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Store className="h-5 w-5 mr-2 text-blue-600" />
                店舗情報
              </h2>
              <Link
                to={`/admin/partners/${partner.id}/edit`}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="h-4 w-4 mr-1" />
                編集
              </Link>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">店舗名</p>
                <p className="font-semibold text-gray-800">{partner.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">カテゴリー</p>
                <p className="font-semibold text-gray-800">
                  {partner.type === 'RVPark'
                    ? 'RVパーク'
                    : partner.type === 'Restaurant'
                    ? 'レストラン'
                    : partner.type === 'GasStation'
                    ? 'ガソリンスタンド'
                    : partner.type === 'Tourist'
                    ? '観光施設'
                    : 'その他'}
                </p>
              </div>
              {partner.address && (
                <div>
                  <p className="text-sm text-gray-500">住所</p>
                  <p className="font-semibold text-gray-800 flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-1 text-gray-400" />
                    {partner.address}
                  </p>
                </div>
              )}
            </div>
            <Link
              to={`/partners/${partner.id}`}
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Eye className="h-4 w-4 mr-2" />
              公開ページを見る
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              評価サマリー
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">総レビュー数</span>
                <span className="font-bold text-gray-800">{stats.totalReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">平均評価</span>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                  <span className="font-bold text-gray-800">{stats.averageRating}</span>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500 mb-2">評価分布</p>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <span className="text-sm text-gray-600 w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                        <div
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">0</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            最新のレビュー
          </h2>
          {recentReviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだレビューがありません
            </p>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-gray-600 text-sm">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">アクティビティ管理</h2>
              <Link
                to="/admin/activities/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                新規アクティビティ
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  アクティビティがありません
                </h3>
                <p className="text-gray-600 mb-6">
                  新しいアクティビティを追加して、ユーザーに体験を提供しましょう
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                  >
                    {activity.images && Array.isArray(activity.images) && activity.images.length > 0 ? (
                      <img
                        src={activity.images[0] as string}
                        alt={activity.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Activity className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {activity.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {activity.duration || '未設定'}
                        </div>
                        <div className="text-blue-600 font-bold">
                          ¥{activity.price?.toLocaleString() || '0'}
                        </div>
                      </div>
                      {activity.max_participants && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          最大 {activity.max_participants}名
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            activity.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {activity.status === 'Active' ? '公開中' : '非公開'}
                        </span>
                        <Link
                          to={`/admin/activities/${activity.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          編集
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">ギヤ管理</h2>
              <Link
                to="/admin/equipment/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                新規ギヤ
              </Link>
            </div>

            {equipment.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  ギヤがありません
                </h3>
                <p className="text-gray-600 mb-6">
                  新しいギヤを追加して、レンタルサービスを提供しましょう
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        カテゴリー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        在庫
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        料金/日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.available_quantity} / {item.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ¥{item.price_per_day?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'Available'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Maintenance'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status === 'Available'
                              ? '利用可能'
                              : item.status === 'Maintenance'
                              ? 'メンテナンス中'
                              : '利用不可'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/admin/equipment/${item.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">予約状況</h2>
            </div>

            {reservations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  予約がありません
                </h3>
                <p className="text-gray-600">現在進行中の予約はありません</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予約番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        期間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予約日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {reservation.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reservation.users
                              ? `${reservation.users.last_name || ''} ${
                                  reservation.users.first_name || ''
                                }`.trim() || reservation.users.email
                              : '不明'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(reservation.start_date).toLocaleDateString('ja-JP')} -{' '}
                            {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                          </div>
                          <div className="text-xs text-gray-500">{reservation.days}日間</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ¥{reservation.total?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${
                              reservation.status === 'Confirmed'
                                ? 'bg-green-100 text-green-800'
                                : reservation.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : reservation.status === 'Completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {reservation.status === 'Confirmed' && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {reservation.status === 'Pending' && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {reservation.status === 'Cancelled' && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {reservation.status === 'Confirmed'
                              ? '確定'
                              : reservation.status === 'Pending'
                              ? '保留中'
                              : reservation.status === 'Completed'
                              ? '完了'
                              : 'キャンセル'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(reservation.created_at).toLocaleDateString('ja-JP')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
