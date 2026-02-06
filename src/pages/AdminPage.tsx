import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  Users,
  Car,
  MapPin,
  BookOpen,
} from 'lucide-react';

export default function AdminPage() {
  const { user, profile, loading, isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPartners: 0,
    totalReservations: 0,
    totalStories: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadStats();
    }
  }, [user, isAdmin, isStaff]);

  const loadStats = async () => {
    try {
      const [usersRes, partnersRes, reservationsRes, storiesRes, reviewsRes] =
        await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('partners').select('id', { count: 'exact', head: true }),
          supabase.from('reservations').select('id', { count: 'exact', head: true }),
          supabase.from('stories').select('id', { count: 'exact', head: true }),
          supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', false),
        ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalPartners: partnersRes.count || 0,
        totalReservations: reservationsRes.count || 0,
        totalStories: storiesRes.count || 0,
        pendingReviews: reviewsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
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
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
              <p className="text-blue-100">総ユーザー数</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.totalPartners}</span>
              </div>
              <p className="text-green-100">協力店舗数</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Car className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.totalReservations}</span>
              </div>
              <p className="text-orange-100">総予約数</p>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.totalStories}</span>
              </div>
              <p className="text-teal-100">投稿された体験記</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
