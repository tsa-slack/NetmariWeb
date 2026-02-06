import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Bell, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Announcement = Database['public']['Tables']['announcements']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAnnouncements();
  }, [filter]);

  const loadAnnouncements = async () => {
    try {
      let query = supabase
        .from('announcements')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('priority', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <AlertCircle className="h-5 w-5" />;
      case 'High':
        return <AlertTriangle className="h-5 w-5" />;
      case 'Normal':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Normal':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">お知らせ</h1>
          <p className="text-gray-600">重要なお知らせや更新情報をチェックしよう</p>
        </div>

        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('Urgent')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'Urgent'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            緊急
          </button>
          <button
            onClick={() => setFilter('High')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'High'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            重要
          </button>
          <button
            onClick={() => setFilter('Normal')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'Normal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            通常
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">お知らせはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getPriorityColor(
                  announcement.priority || 'Normal'
                )}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        announcement.priority === 'Urgent'
                          ? 'bg-red-100 text-red-700'
                          : announcement.priority === 'High'
                          ? 'bg-orange-100 text-orange-700'
                          : announcement.priority === 'Normal'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {getPriorityIcon(announcement.priority || 'Normal')}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-800">
                        {announcement.title}
                      </h3>
                      {announcement.category && (
                        <span className="inline-block mt-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {announcement.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{new Date(announcement.published_at || '').toLocaleDateString('ja-JP')}</p>
                    {announcement.author && (
                      <p className="text-xs">
                        投稿者: {announcement.author.first_name}{' '}
                        {announcement.author.last_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
