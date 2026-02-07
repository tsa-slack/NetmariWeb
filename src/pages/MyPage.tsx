import { useState, useEffect, lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import {
  User, Calendar, Heart, BookOpen, Star, Settings, Route,
  CheckCircle, X,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/data-access/hooks/useQuery';
import { useRepository } from '../lib/data-access/hooks/useRepository';
import { StoryRepository } from '../lib/data-access/repositories/StoryRepository';
import { ReviewRepository } from '../lib/data-access/repositories/ReviewRepository';
import { ReservationRepository } from '../lib/data-access/repositories/ReservationRepository';
import type { Row } from '../lib/data-access/base/types';
import type {
  Review, Reservation, PartnerFavorite, VehicleFavorite, StoryFavorite,
  UserRoute, UserProfile, RankProgress,
} from './my-page/types';

interface RankSettingsJson {
  ranks: Record<string, {
    min_amount?: number;
    min_likes?: number;
    min_posts?: number;
    discount_rate?: number;
  }>;
}

// コンポーネントレベルのコード分割 - タブ切替時にオンデマンドで読み込み
const ProfileTab = lazy(() => import('./my-page/ProfileTab'));
const FavoritesTab = lazy(() => import('./my-page/FavoritesTab'));
const RoutesTab = lazy(() => import('./my-page/RoutesTab'));
const ReservationsTab = lazy(() => import('./my-page/ReservationsTab'));
const StoriesTab = lazy(() => import('./my-page/StoriesTab'));
const ReviewsTab = lazy(() => import('./my-page/ReviewsTab'));
const SettingsTab = lazy(() => import('./my-page/SettingsTab'));

export default function MyPage() {
  const { user, profile, loading } = useAuth();

  // リポジトリインスタンスを作成
  const storyRepo = useRepository(StoryRepository);
  const reviewRepo = useRepository(ReviewRepository);
  const reservationRepo = useRepository(ReservationRepository);

  // ストーリーデータを取得
  const { data: myStories, loading: storiesLoading } = useQuery<Row<'stories'>[]>(
    async () => {
      if (!user?.id) return { success: true, data: [] } as const;
      return storyRepo.findByUser(user.id);
    },
    { enabled: !!user?.id }
  );

  // レビューデータを取得（パートナー名付き）
  const { data: myReviews, loading: reviewsLoading } = useQuery<Review[]>(
    async () => {
      if (!user?.id) return { success: true, data: [] } as const;

      const result = await reviewRepo.findByUser(user.id);
      if (!result.success) return result;

      // パートナー名を取得
      const reviewsWithPartner = await Promise.all(
        result.data.map(async (review) => {
          if (review.target_type === 'Partner' && review.target_id) {
            const { data: partner } = await supabase
              .from('partners')
              .select('name')
              .eq('id', review.target_id)
              .maybeSingle();
            return {
              ...review,
              partner_name: partner?.name,
            } as Review;
          }
          return review as Review;
        })
      );

      return { success: true, data: reviewsWithPartner } as const;
    },
    { enabled: !!user?.id }
  );

  // 予約データを取得
  const { data: myReservations, loading: reservationsLoading } = useQuery<Reservation[]>(
    async () => {
      if (!user?.id) return { success: true, data: [] } as const;

      const result = await reservationRepo.findByUser(user.id);
      if (!result.success) return result;

      const reservationsWithDetails = await Promise.all(
        result.data.map(async (reservation) => {
          const details: Partial<Reservation> & typeof reservation = { ...reservation };
          if (reservation.rental_vehicle_id) {
            const { data: rentalVehicle } = await supabase
              .from('rental_vehicles')
              .select('location, vehicle:vehicles(name, manufacturer, images)')
              .eq('id', reservation.rental_vehicle_id)
              .maybeSingle();
            details.rental_vehicle = rentalVehicle ?? undefined;
          }
          return details as Reservation;
        })
      );

      return { success: true, data: reservationsWithDetails } as const;
    },
    { enabled: !!user?.id }
  );

  // お気に入りデータ
  const [myPartnerFavorites, setMyPartnerFavorites] = useState<PartnerFavorite[]>([]);
  const [myVehicleFavorites, setMyVehicleFavorites] = useState<VehicleFavorite[]>([]);
  const [myStoryFavorites, setMyStoryFavorites] = useState<StoryFavorite[]>([]);
  const [myRoutes, setMyRoutes] = useState<UserRoute[]>([]);

  // タブ & UI state
  const [activeTab, setActiveTab] = useState<'profile' | 'reservations' | 'favorites' | 'routes' | 'stories' | 'reviews' | 'settings'>('profile');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reservationReviews, _setReservationReviews] = useState<Record<string, boolean>>({});

  // ユーザー設定
  const [userSettings, setUserSettings] = useState<UserProfile | null>(null);

  // ランク進捗
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);

  // ユーザー設定を取得
  const { loading: settingsLoading } = useQuery<UserProfile | null>(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      setUserSettings(data);
      return { success: true, data };
    },
    { enabled: !!user?.id }
  );

  // ランク進捗を取得
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading: _rankLoading } = useQuery<RankSettingsJson | null>(
    async () => {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('rank_settings')
        .limit(1)
        .maybeSingle();

      if (!settings || !settings.rank_settings) return { success: true, data: null };

      const rankSettings = settings.rank_settings as RankSettingsJson;
      const currentRank = profile?.rank || 'Bronze';

      const { data: totals } = await supabase.rpc('calculate_total_spent', { user_uuid: user!.id });
      const { data: totalLikes } = await supabase.rpc('calculate_total_likes', { user_uuid: user!.id });
      const { data: totalPosts } = await supabase.rpc('calculate_total_posts', { user_uuid: user!.id });

      const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      const currentRankIndex = rankOrder.indexOf(currentRank);
      const nextRank = currentRankIndex < rankOrder.length - 1 ? rankOrder[currentRankIndex + 1] : null;
      const discountRate = rankSettings.ranks[currentRank]?.discount_rate || 0;
      const nextRankSettings = nextRank ? rankSettings.ranks[nextRank] : null;
      const nextRequirements = nextRankSettings ? {
        min_amount: nextRankSettings.min_amount ?? 0,
        min_likes: nextRankSettings.min_likes ?? 0,
        min_posts: nextRankSettings.min_posts ?? 0,
      } : null;

      setRankProgress({ totalSpent: totals || 0, totalLikes: totalLikes || 0, totalPosts: totalPosts || 0, currentRank, nextRank, discountRate, nextRequirements });

      return { success: true, data: rankSettings };
    },
    { enabled: !!user?.id }
  );

  // お気に入りデータを取得
  const { loading: favoritesLoading } = useQuery<null>(
    async () => {
      const [partnerRes, vehicleRes, storyRes] = await Promise.all([
        supabase.from('partner_favorites').select(`*, partner:partners(name, description, address, images, type)`).eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('vehicle_favorites').select(`*, vehicle:vehicles(name, manufacturer, type, images, price, status)`).eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('story_favorites').select(`*, story:stories(title, excerpt, cover_image, author_id)`).eq('user_id', user!.id).order('created_at', { ascending: false }),
      ]);

      if (partnerRes.error) throw partnerRes.error;
      if (vehicleRes.error) throw vehicleRes.error;
      if (storyRes.error) throw storyRes.error;

      setMyPartnerFavorites(partnerRes.data || []);
      setMyVehicleFavorites(vehicleRes.data as VehicleFavorite[] || []);
      setMyStoryFavorites(storyRes.data as StoryFavorite[] || []);
      return { success: true, data: null };
    },
    { enabled: !!user?.id }
  );

  // ルートデータを取得
  const { loading: routesLoading } = useQuery<UserRoute[]>(
    async () => {
      const { data, error } = await supabase.from('routes').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      setMyRoutes(data || []);
      return { success: true, data: data || [] };
    },
    { enabled: !!user?.id }
  );

  // URL tab parameter handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'reservations') {
      setActiveTab('reservations');
      if (urlParams.get('success') === 'true') {
        setShowSuccessBanner(true);
        window.history.replaceState({}, '', '/my-page?tab=reservations');
        setTimeout(() => setShowSuccessBanner(false), 8000);
      }
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const totalFavorites = myPartnerFavorites.length + myVehicleFavorites.length + myStoryFavorites.length;

  const tabs = [
    { id: 'profile' as const, label: 'プロフィール', icon: User },
    { id: 'reservations' as const, label: '予約', icon: Calendar, count: myReservations?.length || 0 },
    { id: 'favorites' as const, label: 'お気に入り', icon: Heart, count: totalFavorites },
    { id: 'routes' as const, label: 'マイルート', icon: Route, count: myRoutes.length },
    { id: 'stories' as const, label: '自分の投稿', icon: BookOpen, count: myStories?.length || 0 },
    { id: 'reviews' as const, label: '自分のレビュー', icon: Star, count: myReviews?.length || 0 },
    { id: 'settings' as const, label: '設定', icon: Settings },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">マイページ</h1>
          <p className="text-gray-600">ようこそ、{profile?.first_name}さん</p>
        </div>

        {showSuccessBanner && (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-green-900 mb-1">予約が作成されました</h3>
                <p className="text-green-800 mb-2">ご予約ありがとうございます。予約の詳細は下記の一覧からご確認いただけます。</p>
                <p className="text-sm text-green-700">予約確認メールが登録されたメールアドレス宛に送信されます。</p>
              </div>
              <button onClick={() => setShowSuccessBanner(false)} className="ml-4 text-green-600 hover:text-green-800 transition">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-6 py-4 text-center font-semibold transition border-b-4 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-sm">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <Suspense fallback={<div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
          {activeTab === 'profile' && <ProfileTab rankProgress={rankProgress} />}
          {activeTab === 'favorites' && (
            <FavoritesTab
              myPartnerFavorites={myPartnerFavorites}
              myVehicleFavorites={myVehicleFavorites}
              myStoryFavorites={myStoryFavorites}
              favoritesLoading={favoritesLoading}
            />
          )}
          {activeTab === 'routes' && (
            <RoutesTab myRoutes={myRoutes} setMyRoutes={setMyRoutes} routesLoading={routesLoading} />
          )}
          {activeTab === 'reservations' && (
            <ReservationsTab
              myReservations={myReservations ?? undefined}
              reservationsLoading={reservationsLoading}
              reservationReviews={reservationReviews}
            />
          )}
          {activeTab === 'stories' && <StoriesTab myStories={myStories ?? undefined} storiesLoading={storiesLoading} />}
          {activeTab === 'reviews' && <ReviewsTab myReviews={myReviews ?? undefined} reviewsLoading={reviewsLoading} />}
          {activeTab === 'settings' && (
            <SettingsTab userSettings={userSettings} setUserSettings={setUserSettings} settingsLoading={settingsLoading} />
          )}
        </Suspense>
      </div>
    </Layout>
  );
}
