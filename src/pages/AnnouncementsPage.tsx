import { useState, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Bell, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnnouncementRepository, useQuery, useRepository } from '../lib/data-access';

import type { Row } from '../lib/data-access/base/types';
import { logger } from '../lib/logger';
import LoadingSpinner from '../components/LoadingSpinner';

type Announcement = Row<'announcements'> & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

export default function AnnouncementsPage() {
  const { loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  // リポジトリインスタンスを作成
  const announcementRepo = useRepository(AnnouncementRepository);

  // お知らせ一覧を取得（公開済み・著者情報付き）
  const { data: announcementsData, loading, error, refetch } = useQuery<Announcement[]>(
    async () => {
      return announcementRepo.findPublishedWithAuthor();
    },
    {
      onError: (err: Error) => {
        logger.error('Error loading announcements:', err);
      },
    }
  );

  // フィルタリングされたお知らせ
  const filteredAnnouncements = useMemo(() => {
    if (!announcementsData) return [];
    
    if (filter === 'all') {
      return announcementsData;
    }
    
    return announcementsData.filter(announcement => announcement.priority === filter);
  }, [announcementsData, filter]);

  if (authLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              再試行
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return <AlertCircle className="h-5 w-5" />;
      case 'Medium':
        return <Info className="h-5 w-5" />;
      case 'Low':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Low':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">お知らせ</h1>
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
            onClick={() => setFilter('High')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'High'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            重要
          </button>
          <button
            onClick={() => setFilter('Medium')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'Medium'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            通常
          </button>
          <button
            onClick={() => setFilter('Low')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'Low'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            情報
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">お知らせはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement: Announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getPriorityColor(
                  announcement.priority || 'Medium'
                )}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        announcement.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : announcement.priority === 'Medium'
                          ? 'bg-orange-100 text-orange-700'
                          : announcement.priority === 'Low'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {getPriorityIcon(announcement.priority || 'Medium')}
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
                    <p>{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('ja-JP') : '-'}</p>
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
