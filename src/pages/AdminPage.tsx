import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Users,
  Car,
  MapPin,
  BookOpen,
  Calendar,
  Plus,
  Settings,
  MessageSquare,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UserRepository,
  PartnerRepository,
  ReservationRepository,
  StoryRepository,
  EventRepository,
  useQuery,
  useRepository,
} from '../lib/data-access';

export default function AdminPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();

  // リポジトリインスタンスを作成
  const userRepo = useRepository(UserRepository);
  const partnerRepo = useRepository(PartnerRepository);
  const reservationRepo = useRepository(ReservationRepository);
  const storyRepo = useRepository(StoryRepository);
  const eventRepo = useRepository(EventRepository);

  // 統計情報を取得
  const { data: totalUsers } = useQuery<number>(
    async () => userRepo.count(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const { data: totalPartners } = useQuery<number>(
    async () => partnerRepo.count(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const { data: totalReservations } = useQuery<number>(
    async () => reservationRepo.count(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const { data: totalStories } = useQuery<number>(
    async () => storyRepo.count(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const { data: totalEvents } = useQuery<number>(
    async () => eventRepo.count(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

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

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">
            システムの概要と統計情報
          </p>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{totalUsers || 0}</span>
              </div>
              <p className="text-blue-100">総ユーザー数</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{totalPartners || 0}</span>
              </div>
              <p className="text-green-100">協力店舗数</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Car className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{totalReservations || 0}</span>
              </div>
              <p className="text-orange-100">総予約数</p>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{totalStories || 0}</span>
              </div>
              <p className="text-teal-100">投稿された体験記</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{totalEvents || 0}</span>
              </div>
              <p className="text-purple-100">イベント数</p>
            </div>
          </div>
        )}

        {/* クイックアクション */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/portal/events/new"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 group"
            >
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">イベント作成</p>
                <p className="text-sm text-gray-500">新しいイベントを登録</p>
              </div>
            </Link>
            <Link
              to="/admin/vehicles/new"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 group"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">車両登録</p>
                <p className="text-sm text-gray-500">新しいレンタル車両を追加</p>
              </div>
            </Link>
            <Link
              to="/admin/contacts"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 group"
            >
              <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200 transition">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">お問い合わせ</p>
                <p className="text-sm text-gray-500">お問い合わせを確認</p>
              </div>
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 group"
            >
              <div className="p-3 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-200 transition">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">システム設定</p>
                <p className="text-sm text-gray-500">各種設定を変更</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
