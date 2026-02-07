import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User, Calendar, Heart, Settings, BookOpen, Eye, Plus, Bell, Shield, XCircle, ChevronDown, ChevronUp, Star, Edit, Trash2, EyeOff, Car, MapPin, Save, X, Mail, Phone, UserCircle, Route, MessageSquare, CheckCircle, Award } from 'lucide-react';
import type { Database } from '../lib/database.types';
import ConfirmModal from '../components/ConfirmModal';
import { 
  StoryRepository, 
  ReviewRepository, 
  ReservationRepository, 
  RouteRepository,
  useQuery, 
  useRepository,
  useMutation
} from '../lib/data-access';
import type { Row } from '../lib/data-access/base/types';

type Story = Database['public']['Tables']['stories']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'] & {
  partner_name?: string;
};
type UserProfile = Database['public']['Tables']['users']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  rental_vehicle?: {
    location?: string;
    vehicle?: {
      name?: string;
      manufacturer?: string;
      images?: string[];
    };
  };
};
type PartnerFavorite = Database['public']['Tables']['partner_favorites']['Row'] & {
  partner?: {
    name?: string;
    description?: string;
    address?: string;
    images?: any;
    type?: string;
  };
};

type VehicleFavorite = {
  id: string;
  user_id: string;
  vehicle_id: string;
  created_at: string;
  vehicle?: {
    name?: string;
    manufacturer?: string;
    type?: string;
    images?: any;
    price?: number;
    status?: string;
  };
};

type StoryFavorite = {
  id: string;
  user_id: string;
  story_id: string;
  created_at: string;
  story?: {
    title?: string;
    excerpt?: string;
    cover_image?: string;
    author_id?: string;
  };
};
type UserRoute = Database['public']['Tables']['routes']['Row'];

export default function MyPage() {
  const { user, profile, loading } = useAuth();
  
  // リポジトリインスタンスを作成
  const storyRepo = useRepository(StoryRepository);
  const reviewRepo = useRepository(ReviewRepository);
  const reservationRepo = useRepository(ReservationRepository);
  const routeRepo = useRepository(RouteRepository);

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

      // レンタル車両情報と機器・アクティビティ情報を取得
      const reservationsWithDetails = await Promise.all(
        result.data.map(async (reservation) => {
          const details: any = { ...reservation };

          // レンタル車両情報を取得
          if (reservation.rental_vehicle_id) {
            const { data: rentalVehicle } = await supabase
              .from('rental_vehicles')
              .select('location, vehicle:vehicles(name, manufacturer, images)')
              .eq('id', reservation.rental_vehicle_id)
              .maybeSingle();
            
            details.rental_vehicle = rentalVehicle;
          }

          return details as Reservation;
        })
      );

      return { success: true, data: reservationsWithDetails } as const;
    },
    { enabled: !!user?.id }
  );

  // 従来の状態管理（お気に入り、ルートなど）
  const [myPartnerFavorites, setMyPartnerFavorites] = useState<PartnerFavorite[]>([]);
  const [myVehicleFavorites, setMyVehicleFavorites] = useState<VehicleFavorite[]>([]);
  const [myStoryFavorites, setMyStoryFavorites] = useState<StoryFavorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteTab, setFavoriteTab] = useState<'partners' | 'vehicles' | 'stories'>('partners');
  const [myRoutes, setMyRoutes] = useState<UserRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  // ルート展開機能は将来実装予定

  const [activeTab, setActiveTab] = useState<'profile' | 'reservations' | 'favorites' | 'routes' | 'stories' | 'reviews' | 'settings'>('profile');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAccountSuspension, setShowAccountSuspension] = useState(false);

  const [userSettings, setUserSettings] = useState<UserProfile | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason] = useState('');
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [showDeleteRouteModal, setShowDeleteRouteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line: '',
    building: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationDetails, setReservationDetails] = useState<{
    equipment: any[];
    activities: any[];
  }>({ equipment: [], activities: [] });
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [reservationReviews, setReservationReviews] = useState<Record<string, boolean>>({});
  const [rankProgress, setRankProgress] = useState<{
    totalSpent: number;
    totalLikes: number;
    totalPosts: number;
    currentRank: string;
    nextRank: string | null;
    discountRate: number;
    nextRequirements: any;
  } | null>(null);

  useEffect(() => {
    if (user) {
      // useQueryで自動的にフェッチされるため、これらは不要
      // loadMyStories(); - 削除
      // loadMyReviews(); - 削除
      // loadMyReservations(); - 削除
      loadUserSettings();
      loadMyFavorites();
      loadMyRoutes();
      loadRankProgress();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone_number || '',
        bio: profile.bio || '',
        postal_code: profile.postal_code || '',
        prefecture: profile.prefecture || '',
        city: profile.city || '',
        address_line: profile.address_line || '',
        building: profile.building || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'reservations') {
      setActiveTab('reservations');
      if (urlParams.get('success') === 'true') {
        setShowSuccessBanner(true);
        window.history.replaceState({}, '', '/my-page?tab=reservations');
        setTimeout(() => {
          setShowSuccessBanner(false);
        }, 8000);
      }
    }
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadRankProgress = async () => {
    try {
      // ランク設定を取得
      const { data: settings } = await supabase
        .from('system_settings')
        .select('rank_settings')
        .limit(1)
        .maybeSingle();

      if (!settings || !(settings as any).rank_settings) return;

      const rankSettings = (settings as any).rank_settings;
      const currentRank = profile?.rank || 'Bronze';

      // 現在の累計値を取得
      const { data: totals } = await supabase.rpc('calculate_total_spent', {
        user_uuid: user!.id
      } as any);

      const { data: totalLikes } = await supabase.rpc('calculate_total_likes', {
        user_uuid: user!.id
      } as any);

      const { data: totalPosts } = await supabase.rpc('calculate_total_posts', {
        user_uuid: user!.id
      } as any);

      // 次のランクを判定
      const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      const currentRankIndex = rankOrder.indexOf(currentRank);
      const nextRank = currentRankIndex < rankOrder.length - 1 ? rankOrder[currentRankIndex + 1] : null;

      const discountRate = rankSettings.ranks[currentRank]?.discount_rate || 0;
      const nextRequirements = nextRank ? rankSettings.ranks[nextRank] : null;

      setRankProgress({
        totalSpent: totals || 0,
        totalLikes: totalLikes || 0,
        totalPosts: totalPosts || 0,
        currentRank,
        nextRank,
        discountRate,
        nextRequirements
      });
    } catch (error) {
      console.error('Error loading rank progress:', error);
    }
  };




  const loadMyFavorites = async () => {
    try {
      const [partnerRes, vehicleRes, storyRes] = await Promise.all([
        supabase
          .from('partner_favorites')
          .select(`
            *,
            partner:partners(
              name,
              description,
              address,
              images,
              type
            )
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('vehicle_favorites')
          .select(`
            *,
            vehicle:vehicles(
              name,
              manufacturer,
              type,
              images,
              price,
              status
            )
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('story_favorites')
          .select(`
            *,
            story:stories(
              title,
              excerpt,
              cover_image,
              author_id
            )
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
      ]);

      if (partnerRes.error) throw partnerRes.error;
      if (vehicleRes.error) throw vehicleRes.error;
      if (storyRes.error) throw storyRes.error;

      setMyPartnerFavorites(partnerRes.data || []);
      setMyVehicleFavorites(vehicleRes.data as VehicleFavorite[] || []);
      setMyStoryFavorites(storyRes.data as StoryFavorite[] || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadMyRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleToggleReviewPublish = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from('reviews') as any)
        .update({ is_published: !currentStatus } as any)
        .eq('id', reviewId);

      if (error) throw error;

      // useQueryで自動的に再フェッチされるため、手動更新は不要
      // setMyReviews((prev) =>
      //   prev.map((review) =>
      //     review.id === reviewId ? { ...review, is_published: !currentStatus } : review
      //   )
      // );

      alert(!currentStatus ? 'レビューを公開しました' : 'レビューを非公開にしました');
    } catch (error) {
      console.error('Error toggling review publish status:', error);
      alert('公開状態の変更に失敗しました');
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewToDelete);

      if (error) throw error;

      // useQueryで自動的に再フェッチされるため、手動更新は不要
      // setMyReviews((prev: Review[]) => prev.filter((review: Review) => review.id !== reviewToDelete));
      alert('レビューを削除しました');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('レビューの削除に失敗しました');
    } finally {
      setShowDeleteReviewModal(false);
      setReviewToDelete(null);
    }
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;

    try {
      const { error } = await supabase.from('routes').delete().eq('id', routeToDelete);

      if (error) throw error;
      setMyRoutes((prev) => prev.filter((route) => route.id !== routeToDelete));
      alert('ルートを削除しました');
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('ルートの削除に失敗しました');
    } finally {
      setShowDeleteRouteModal(false);
      setRouteToDelete(null);
    }
  };

  const toggleRoutePublish = async (routeId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from('routes') as any)
        .update({ is_public: !currentStatus } as any)
        .eq('id', routeId);

      if (error) throw error;

      setMyRoutes((prev) =>
        prev.map((route) =>
          route.id === routeId ? { ...route, is_public: !currentStatus } : route
        )
      );

      alert(!currentStatus ? 'ルートを公開しました' : 'ルートを非公開にしました');
    } catch (error) {
      console.error('Error toggling route publish status:', error);
      alert('公開状態の変更に失敗しました');
    }
  };

  const updateNotificationSetting = async (field: string, value: boolean) => {
    try {
      setSettingsLoading(true);
      const { error } = await (supabase.from('users') as any).update({ [field]: value })
        .eq('id', user!.id);

      if (error) throw error;
      setUserSettings(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      alert('設定の更新に失敗しました');
    } finally {
      setSettingsLoading(false);
    }
  };

  const updatePrivacySetting = async (field: string, value: boolean | string) => {
    try {
      setSettingsLoading(true);
      const { error } = await (supabase.from('users') as any).update({ [field]: value })
        .eq('id', user!.id);

      if (error) throw error;
      setUserSettings(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      alert('設定の更新に失敗しました');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSuspendAccount = async () => {
    try {
      setSettingsLoading(true);
      const { error } = await supabase.rpc('suspend_account', { reason: suspendReason || null } as any);

      if (error) throw error;
      alert('アカウントを一時停止しました。再度ログインすると、アカウントを再開できます。');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error suspending account:', error);
      alert('アカウントの一時停止に失敗しました');
    } finally {
      setSettingsLoading(false);
      setShowSuspendModal(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    setProfileSaving(true);
    try {
      const emailChanged = editForm.email !== profile.email;

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: editForm.email,
        });

        if (authError) throw authError;

        alert('メールアドレス変更の確認メールを送信しました。メールをご確認ください。');
      }

      const { error } = await (supabase.from('users') as any).update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone,
        bio: editForm.bio,
        postal_code: editForm.postal_code,
        prefecture: editForm.prefecture,
        city: editForm.city,
        address_line: editForm.address_line,
        building: editForm.building,
      } as any)
        .eq('id', user.id);

      if (error) throw error;

      alert(emailChanged ? 'プロフィールを更新しました。メールアドレスの変更は確認後に反映されます。' : 'プロフィールを更新しました');
      setShowProfileEdit(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'プロフィールの更新に失敗しました');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadReservationDetails = async (reservationId: string) => {
    try {
      const [equipmentRes, activitiesRes] = await Promise.all([
        supabase
          .from('reservation_equipment')
          .select(`
            *,
            equipment(name, category)
          `)
          .eq('reservation_id', reservationId),
        supabase
          .from('reservation_activities')
          .select(`
            *,
            activity:activities(name, duration)
          `)
          .eq('reservation_id', reservationId),
      ]);

      setReservationDetails({
        equipment: equipmentRes.data || [],
        activities: activitiesRes.data || [],
      });
    } catch (error) {
      console.error('Error loading reservation details:', error);
    }
  };

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
                <h3 className="text-xl font-bold text-green-900 mb-1">
                  予約が作成されました
                </h3>
                <p className="text-green-800 mb-2">
                  ご予約ありがとうございます。予約の詳細は下記の一覧からご確認いただけます。
                </p>
                <p className="text-sm text-green-700">
                  予約確認メールが登録されたメールアドレス宛に送信されます。
                </p>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="ml-4 text-green-600 hover:text-green-800 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

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

        {activeTab === 'profile' && (
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">プロフィール情報</h2>
                {!showProfileEdit && (
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-gray-600">{profile?.email}</p>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {profile?.rank}
                    </span>
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">自己紹介</h4>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {profile?.phone_number && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{profile.phone_number}</span>
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>
                )}
              </div>

              {(profile?.postal_code || profile?.prefecture || profile?.city || profile?.address_line) && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    住所
                  </h4>
                  <div className="text-gray-600">
                    {profile?.postal_code && <p>〒{profile.postal_code}</p>}
                    <p>
                      {profile?.prefecture}{profile?.city}{profile?.address_line}
                      {profile?.building && ` ${profile.building}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {rankProgress && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Award className="h-7 w-7 mr-2 text-yellow-600" />
                    会員ランク進捗
                  </h2>
                  <div className="flex items-center">
                    <Award
                      className={`h-8 w-8 mr-2 ${
                        rankProgress.currentRank === 'Platinum'
                          ? 'text-gray-400'
                          : rankProgress.currentRank === 'Gold'
                          ? 'text-yellow-500'
                          : rankProgress.currentRank === 'Silver'
                          ? 'text-gray-300'
                          : 'text-orange-600'
                      }`}
                    />
                    <span className="text-2xl font-bold text-gray-800">{rankProgress.currentRank}</span>
                  </div>
                </div>

                {rankProgress.discountRate > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-semibold">
                      現在の特典: レンタル料金が{rankProgress.discountRate}%割引になります
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">累計利用金額</span>
                      <span className="text-sm font-semibold text-gray-800">
                        ¥{rankProgress.totalSpent.toLocaleString()}
                        {rankProgress.nextRequirements && (
                          <span className="text-gray-500 ml-2">
                            / ¥{rankProgress.nextRequirements.min_amount.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                    {rankProgress.nextRequirements && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (rankProgress.totalSpent / rankProgress.nextRequirements.min_amount) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">いいね獲得数</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {rankProgress.totalLikes}
                        {rankProgress.nextRequirements && (
                          <span className="text-gray-500 ml-2">
                            / {rankProgress.nextRequirements.min_likes}
                          </span>
                        )}
                      </span>
                    </div>
                    {rankProgress.nextRequirements && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-pink-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (rankProgress.totalLikes / rankProgress.nextRequirements.min_likes) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">公開投稿数</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {rankProgress.totalPosts}
                        {rankProgress.nextRequirements && (
                          <span className="text-gray-500 ml-2">
                            / {rankProgress.nextRequirements.min_posts}
                          </span>
                        )}
                      </span>
                    </div>
                    {rankProgress.nextRequirements && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (rankProgress.totalPosts / rankProgress.nextRequirements.min_posts) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {rankProgress.nextRank && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">{rankProgress.nextRank}ランク</span>まであと少し！
                      いずれかの条件を達成すると自動的にランクアップします。
                    </p>
                  </div>
                )}

                {!rankProgress.nextRank && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-semibold">
                      最高ランクに到達しています！引き続きサービスをお楽しみください。
                    </p>
                  </div>
                )}
              </div>
            )}

            {showProfileEdit && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">プロフィール編集</h2>
                  </div>
                </div>

                <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    メールアドレスを変更すると、確認メールが送信されます
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="090-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    郵便番号
                  </label>
                  <input
                    type="text"
                    value={editForm.postal_code}
                    onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                    placeholder="123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      都道府県
                    </label>
                    <input
                      type="text"
                      value={editForm.prefecture}
                      onChange={(e) => setEditForm({ ...editForm, prefecture: e.target.value })}
                      placeholder="東京都"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      市区町村
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="渋谷区"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    番地
                  </label>
                  <input
                    type="text"
                    value={editForm.address_line}
                    onChange={(e) => setEditForm({ ...editForm, address_line: e.target.value })}
                    placeholder="1-2-3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    建物名・部屋番号（任意）
                  </label>
                  <input
                    type="text"
                    value={editForm.building}
                    onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                    placeholder="○○ビル 101号室"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    placeholder="あなたについて教えてください"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowProfileEdit(false);
                      setEditForm({
                        first_name: profile?.first_name || '',
                        last_name: profile?.last_name || '',
                        email: profile?.email || '',
                        phone: profile?.phone_number || '',
                        bio: profile?.bio || '',
                        postal_code: profile?.postal_code || '',
                        prefecture: profile?.prefecture || '',
                        city: profile?.city || '',
                        address_line: profile?.address_line || '',
                        building: profile?.building || '',
                      });
                    }}
                    disabled={profileSaving}
                    className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={profileSaving}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        保存
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">お気に入り</h2>

            <div className="bg-white rounded-xl shadow-lg mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setFavoriteTab('partners')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
                    favoriteTab === 'partners'
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'partners' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-sm">協力店</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    favoriteTab === 'partners' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {myPartnerFavorites.length}
                  </span>
                </button>
                <button
                  onClick={() => setFavoriteTab('vehicles')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
                    favoriteTab === 'vehicles'
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Car className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'vehicles' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-sm">車両</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    favoriteTab === 'vehicles' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {myVehicleFavorites.length}
                  </span>
                </button>
                <button
                  onClick={() => setFavoriteTab('stories')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
                    favoriteTab === 'stories'
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BookOpen className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'stories' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-sm">ストーリー</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    favoriteTab === 'stories' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {myStoryFavorites.length}
                  </span>
                </button>
              </div>
            </div>

            {favoritesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {favoriteTab === 'partners' && (
                  myPartnerFavorites.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">お気に入りの協力店がありません</p>
                      <Link
                        to="/partners"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        協力店を探す
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myPartnerFavorites.map((favorite) => {
                        const partner = favorite.partner;
                        const images = Array.isArray(partner?.images) ? partner.images : [];
                        return (
                          <Link
                            key={favorite.id}
                            to={`/partners/${favorite.partner_id}`}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                          >
                            {images.length > 0 ? (
                              <div
                                className="h-48 bg-cover bg-center"
                                style={{ backgroundImage: `url(${images[0]})` }}
                              />
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <MapPin className="h-20 w-20 text-white opacity-50" />
                              </div>
                            )}
                            <div className="p-6">
                              <div className="mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  {partner?.type === 'RVPark' ? 'RVパーク' :
                                   partner?.type === 'Restaurant' ? 'レストラン' :
                                   partner?.type === 'GasStation' ? 'ガソリンスタンド' :
                                   partner?.type === 'Tourist' ? '観光施設' : 'その他'}
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                                {partner?.name || '協力店'}
                              </h3>
                              {partner?.address && (
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {partner.address}
                                </div>
                              )}
                              {partner?.description && (
                                <p className="text-gray-600 text-sm line-clamp-2">{partner.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-3">
                                追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}

                {favoriteTab === 'vehicles' && (
                  myVehicleFavorites.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow">
                      <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">お気に入りの車両がありません</p>
                      <Link
                        to="/vehicles"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        車両を探す
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myVehicleFavorites.map((favorite) => {
                        const vehicle = favorite.vehicle;
                        const images = Array.isArray(vehicle?.images) ? vehicle.images : [];
                        return (
                          <Link
                            key={favorite.id}
                            to={`/vehicles/${favorite.vehicle_id}`}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                          >
                            {images.length > 0 ? (
                              <div
                                className="h-48 bg-cover bg-center"
                                style={{ backgroundImage: `url(${images[0]})` }}
                              />
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <Car className="h-20 w-20 text-white opacity-50" />
                              </div>
                            )}
                            <div className="p-6">
                              <div className="mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {vehicle?.type || '車両'}
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                                {vehicle?.name || '車両'}
                              </h3>
                              {vehicle?.manufacturer && (
                                <p className="text-gray-600 text-sm mb-2">{vehicle.manufacturer}</p>
                              )}
                              {vehicle?.price && (
                                <p className="text-lg font-bold text-blue-600 mb-2">
                                  ¥{Number(vehicle.price).toLocaleString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-3">
                                追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}

                {favoriteTab === 'stories' && (
                  myStoryFavorites.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">お気に入りのストーリーがありません</p>
                      <Link
                        to="/portal/stories"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        ストーリーを探す
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myStoryFavorites.map((favorite) => {
                        const story = favorite.story;
                        return (
                          <Link
                            key={favorite.id}
                            to={`/portal/stories/${favorite.story_id}`}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                          >
                            {story?.cover_image ? (
                              <div
                                className="h-48 bg-cover bg-center"
                                style={{ backgroundImage: `url(${story.cover_image})` }}
                              />
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <BookOpen className="h-20 w-20 text-white opacity-50" />
                              </div>
                            )}
                            <div className="p-6">
                              <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                                {story?.title || 'ストーリー'}
                              </h3>
                              {story?.excerpt && (
                                <p className="text-gray-600 text-sm line-clamp-3 mb-3">{story.excerpt}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-3">
                                追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">マイルート</h2>
              <Link
                to="/routes"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                新しいルートを作成
              </Link>
            </div>

            {routesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : myRoutes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow">
                <Route className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">まだルートがありません</p>
                <Link
                  to="/routes"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ルートを作成する
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{route.name}</h3>
                          {route.is_public ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              公開中
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              非公開
                            </span>
                          )}
                        </div>
                        {route.description && (
                          <p className="text-gray-600 mb-3">{route.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Route className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">出発地</p>
                          <p className="text-sm font-medium text-gray-800">{route.origin}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">目的地</p>
                          <p className="text-sm font-medium text-gray-800">{route.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>作成日: {new Date(route.created_at || '').toLocaleDateString('ja-JP')}</span>
                      </div>
                      {route.updated_at && route.updated_at !== route.created_at && (
                        <div className="flex items-center">
                          <Edit className="h-4 w-4 mr-1" />
                          <span>更新日: {new Date(route.updated_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Link
                        to={`/routes?load=${route.id}`}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        表示・編集
                      </Link>
                      <button
                        onClick={() => toggleRoutePublish(route.id, route.is_public || false)}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        {route.is_public ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {route.is_public ? '非公開にする' : '公開する'}
                      </button>
                      <button
                        onClick={() => {
                          setRouteToDelete(route.id);
                          setShowDeleteRouteModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">予約一覧</h2>
            {reservationsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
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
                    <div key={(reservation as any).id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            statusColors[reservation.status || 'Pending']
                          }`}>
                            {statusLabels[reservation.status || 'Pending']}
                          </span>
                          <span className={`text-sm font-semibold ${
                            paymentStatusColors[reservation.payment_status || 'Pending']
                          }`}>
                            {paymentStatusLabels[reservation.payment_status || 'Pending']}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-600">
                            予約日: {new Date(reservation.created_at || '').toLocaleDateString('ja-JP')}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedReservation(reservation);
                              loadReservationDetails((reservation as any).id);
                              setShowReservationDetail(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            詳細を見る
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {images.length > 0 ? (
                          <div
                            className="w-32 h-32 bg-cover bg-center rounded-lg flex-shrink-0"
                            style={{ backgroundImage: `url(${images[0]})` }}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car className="h-16 w-16 text-white" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {vehicle?.name || 'レンタル車両'}
                          </h3>
                          {vehicle?.manufacturer && (
                            <p className="text-gray-600 mb-2">{vehicle.manufacturer}</p>
                          )}
                          {reservation.rental_vehicle?.location && (
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <MapPin className="h-4 w-4 mr-1" />
                              {reservation.rental_vehicle.location}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">利用開始日</p>
                              <p className="font-semibold text-gray-800">
                                {new Date(reservation.start_date).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">返却日</p>
                              <p className="font-semibold text-gray-800">
                                {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">利用日数</p>
                              <p className="font-semibold text-gray-800">{reservation.days}日間</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">合計金額</p>
                          <p className="text-3xl font-bold text-blue-600">
                            ¥{Number(reservation.total).toLocaleString()}
                          </p>
                          {reservation.payment_method && (
                            <p className="text-sm text-gray-600 mt-2">
                              {reservation.payment_method === 'CreditCard' ? 'クレジットカード' : '現地払い'}
                            </p>
                          )}
                        </div>
                      </div>

                      {(reservation as any).status === 'Completed' && (
                        <div className="mt-4 pt-4 border-t">
                          {reservationReviews[(reservation as any).id] ? (
                            <div className="flex items-center justify-center py-2 text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span className="font-medium">レビュー投稿済み</span>
                            </div>
                          ) : (
                            <Link
                              to={`/vehicles/review?reservation=${(reservation as any).id}`}
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
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">通知設定</h3>
                </div>
                {showNotifications ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {showNotifications && (
                <div className="space-y-4 pl-13">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">メール通知</p>
                      <p className="text-sm text-gray-600">重要な更新をメールで受け取る</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.email_notifications ?? true}
                        onChange={(e) => updateNotificationSetting('email_notifications', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">ストーリー通知</p>
                      <p className="text-sm text-gray-600">新しいコメントやいいねを受け取る</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.story_notifications ?? true}
                        onChange={(e) => updateNotificationSetting('story_notifications', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">レンタル通知</p>
                      <p className="text-sm text-gray-600">予約の確認や更新を受け取る</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.rental_notifications ?? true}
                        onChange={(e) => updateNotificationSetting('rental_notifications', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-800">コメント通知</p>
                      <p className="text-sm text-gray-600">あなたへの返信を受け取る</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.comment_notifications ?? true}
                        onChange={(e) => updateNotificationSetting('comment_notifications', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <button
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">プライバシー設定</h3>
                </div>
                {showPrivacy ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {showPrivacy && (
                <div className="space-y-4 pl-13">
                  <div className="py-3 border-b">
                    <label className="font-medium text-gray-800 block mb-2">プロフィールの公開範囲</label>
                    <select
                      value={userSettings?.profile_visibility ?? 'public'}
                      onChange={(e) => updatePrivacySetting('profile_visibility', e.target.value)}
                      disabled={settingsLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="public">公開</option>
                      <option value="friends">フレンドのみ</option>
                      <option value="private">非公開</option>
                    </select>
                    <p className="text-sm text-gray-600 mt-1">
                      {userSettings?.profile_visibility === 'Public'
                        ? '誰でもプロフィールを閲覧できます'
                        : userSettings?.profile_visibility === 'Friends'
                        ? 'フレンドのみプロフィールを閲覧できます'
                        : 'プロフィールは非公開です'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">メールアドレスを表示</p>
                      <p className="text-sm text-gray-600">プロフィールにメールアドレスを表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.show_email ?? false}
                        onChange={(e) => updatePrivacySetting('show_email', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-800">電話番号を表示</p>
                      <p className="text-sm text-gray-600">プロフィールに電話番号を表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userSettings?.show_phone ?? false}
                        onChange={(e) => updatePrivacySetting('show_phone', e.target.checked)}
                        disabled={settingsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
              <button
                onClick={() => setShowAccountSuspension(!showAccountSuspension)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">アカウントの一時停止</h3>
                </div>
                {showAccountSuspension ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {showAccountSuspension && (
                <div className="pl-13">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800 font-medium mb-2">注意事項</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>アカウントを一時停止すると、プロフィールとコンテンツが他のユーザーに表示されなくなります</li>
                      <li>いつでも再度ログインして、アカウントを再開できます</li>
                      <li>一時停止中もデータは保持されます</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={settingsLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    アカウントを一時停止
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">自分の投稿</h2>
              <Link
                to="/portal/stories/new"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規投稿
              </Link>
            </div>

            {storiesLoading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (myStories?.length || 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">まだ投稿がありません</p>
              <Link
                to="/portal/stories/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初の投稿を作成
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(myStories || []).map((story) => (
                <Link
                  key={story.id}
                  to={`/portal/stories/${story.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {story.cover_image ? (
                    <div
                      className="h-48 bg-cover bg-center"
                      style={{ backgroundImage: `url(${story.cover_image})` }}
                    />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-white" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 flex-1">
                        {story.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          story.status === 'Published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {story.status === 'Published' ? '公開' : '下書き'}
                      </span>
                    </div>
                    {story.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{story.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{story.likes}</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{story.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">自分のレビュー</h2>
            </div>

            {reviewsLoading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (myReviews?.length || 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">まだレビューがありません</p>
              <Link
                to="/partners"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                協力店を探す
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(myReviews || []).map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            review.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {review.is_published ? '公開中' : '非公開'}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {review.title}
                        </h3>
                      )}
                      <p className="text-gray-600 mb-2 line-clamp-2">{review.content}</p>
                      {review.partner_name && (
                        <p className="text-sm text-gray-500">
                          投稿先: {review.partner_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        投稿日: {new Date(review.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link
                        to={`/reviews/${review.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="編集"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleToggleReviewPublish(review.id, review.is_published)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                        title={review.is_published ? '非公開にする' : '公開する'}
                      >
                        <EyeOff className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setReviewToDelete(review.id);
                          setShowDeleteReviewModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="削除"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteReviewModal}
        onClose={() => {
          setShowDeleteReviewModal(false);
          setReviewToDelete(null);
        }}
        onConfirm={handleDeleteReview}
        title="レビューを削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />

      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendAccount}
        title="アカウント停止の確認"
        message="本当にアカウントを停止しますか？この操作は取り消せません。"
        confirmText="停止する"
        cancelText="キャンセル"
        type="danger"
      />

      <ConfirmModal
        isOpen={showDeleteRouteModal}
        onClose={() => {
          setShowDeleteRouteModal(false);
          setRouteToDelete(null);
        }}
        onConfirm={handleDeleteRoute}
        title="ルートを削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />

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
                    {reservationDetails.equipment.map((item: any) => (
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
                    {reservationDetails.activities.map((item: any) => (
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
    </Layout>
  );
}
