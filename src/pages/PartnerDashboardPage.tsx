import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/data-access';
import {
  Store,
  TrendingUp,
  Activity,
  Package,
  Calendar,
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import PartnerOverviewTab from '../components/partner/PartnerOverviewTab';
import PartnerActivitiesTab from '../components/partner/PartnerActivitiesTab';
import PartnerEquipmentTab from '../components/partner/PartnerEquipmentTab';
import PartnerReservationsTab from '../components/partner/PartnerReservationsTab';
import LoadingSpinner from '../components/LoadingSpinner';

type Partner = Database['public']['Tables']['partners']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];
type ActivityType = Database['public']['Tables']['activities']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  users?: { email: string; first_name: string | null; last_name: string | null } | null;
  rental_vehicles?: { vehicle_id: string | null } | null;
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
  const [activities, setActivities] = useState<ActivityType[]>([]);
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
        <LoadingSpinner />
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

  const tabs = [
    { key: 'overview' as const, label: '概要', icon: TrendingUp },
    { key: 'activities' as const, label: 'アクティビティ管理', icon: Activity },
    { key: 'equipment' as const, label: 'ギヤ管理', icon: Package },
    { key: 'reservations' as const, label: '予約状況', icon: Calendar },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
            パートナーダッシュボード
          </h1>
          <p className="text-gray-600">{partner.name}の管理画面</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <PartnerOverviewTab
            partner={partner}
            stats={stats}
            recentReviews={recentReviews}
          />
        )}

        {activeTab === 'activities' && (
          <PartnerActivitiesTab activities={activities} />
        )}

        {activeTab === 'equipment' && (
          <PartnerEquipmentTab equipment={equipment} />
        )}

        {activeTab === 'reservations' && (
          <PartnerReservationsTab reservations={reservations} />
        )}
      </div>
    </Layout>
  );
}
