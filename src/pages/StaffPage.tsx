import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StaffSidebar from '../components/StaffSidebar';
import {
  BookOpen,
  MessageSquare,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Car,
  Menu,
  X,
} from 'lucide-react';

export default function StaffPage() {
  const { user, profile, loading, isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState({
    pendingStories: 0,
    pendingReviews: 0,
    openQuestions: 0,
    totalReports: 0,
    activeRentals: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadStats();
      loadRecentItems();
    }
  }, [user, isAdmin, isStaff]);

  const loadStats = async () => {
    try {
      const [storiesRes, reviewsRes, questionsRes, rentalsRes] = await Promise.all([
        supabase
          .from('stories')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Draft'),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', false),
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Open'),
        supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'InProgress'),
      ]);

      setStats({
        pendingStories: storiesRes.count || 0,
        pendingReviews: reviewsRes.count || 0,
        openQuestions: questionsRes.count || 0,
        totalReports: 0,
        activeRentals: rentalsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentItems = async () => {
    try {
      const { data: stories } = await supabase
        .from('stories')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentItems(
        (stories || []).map((story) => ({
          ...story,
          type: 'story',
        }))
      );
    } catch (error) {
      console.error('Error loading recent items:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-lg font-bold text-gray-900">スタッフダッシュボード</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex h-screen">
        <div
          className={`fixed lg:relative inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
        >
          <StaffSidebar />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 hidden lg:block">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                スタッフダッシュボード
              </h1>
              <p className="text-gray-600">レンタル管理とコンテンツモデレーション</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Car className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
                  <span className="text-2xl lg:text-3xl font-bold">{stats.activeRentals}</span>
                </div>
                <p className="text-green-100 text-sm lg:text-base">貸出中</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
                  <span className="text-2xl lg:text-3xl font-bold">{stats.pendingStories}</span>
                </div>
                <p className="text-pink-100 text-sm lg:text-base">承認待ちストーリー</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Star className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
                  <span className="text-2xl lg:text-3xl font-bold">{stats.pendingReviews}</span>
                </div>
                <p className="text-yellow-100 text-sm lg:text-base">承認待ちレビュー</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
                  <span className="text-2xl lg:text-3xl font-bold">{stats.openQuestions}</span>
                </div>
                <p className="text-blue-100 text-sm lg:text-base">未回答の質問</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-6 lg:h-8 w-6 lg:w-8 opacity-80" />
                  <span className="text-2xl lg:text-3xl font-bold">{stats.totalReports}</span>
                </div>
                <p className="text-red-100 text-sm lg:text-base">報告された問題</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-pink-600" />
              ストーリーモデレーション
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              投稿された体験記の確認と承認
            </p>
            <Link
              to="/stories"
              className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
            >
              <Eye className="h-4 w-4 mr-2" />
              ストーリーを確認
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              レビューモデレーション
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              ユーザーレビューの確認と承認
            </p>
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <CheckCircle className="h-4 w-4 mr-2" />
                承認
              </button>
              <button className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                <XCircle className="h-4 w-4 mr-2" />
                拒否
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              質問管理
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              コミュニティQ&Aの管理
            </p>
            <Link
              to="/questions"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Eye className="h-4 w-4 mr-2" />
              質問を確認
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              報告された問題
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              ユーザーからの報告の確認
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <Eye className="h-4 w-4 mr-2" />
              報告を確認
            </button>
          </div>

          <Link
            to="/staff/contacts"
            className="bg-white rounded-xl shadow-lg p-6 block hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              お問い合わせ管理
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              ユーザーからのお問い合わせ対応
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Eye className="h-4 w-4 mr-2" />
              お問い合わせを確認
            </span>
          </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">最近の活動</h2>
              {recentItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  最近の活動はありません
                </p>
              ) : (
                <div className="space-y-3">
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('ja-JP')}
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
          </div>
        </div>
      </div>
    </div>
  );
}
