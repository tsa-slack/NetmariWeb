import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  BookOpen,
  Eye,
  Archive,
  Trash2,
  Filter,
  Search,
  Calendar,
  MapPin,
  Edit,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  location: string;
  status: string;
  likes: number;
  views: number;
  published_at: string;
  created_at: string;
  author: {
    full_name: string;
    email: string;
  };
}

export default function StoryManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Published' | 'Draft' | 'Archived'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadStories();
    }
  }, [user, isAdmin, isStaff, filter]);

  const loadStories = async () => {
    try {
      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          excerpt,
          content,
          cover_image,
          location,
          status,
          likes,
          views,
          published_at,
          created_at,
          author:users!stories_author_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const updateStatus = async (storyId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'Published' && !stories.find((s) => s.id === storyId)?.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await (supabase


        .from('stories') as any)


        .update(updates)
        .eq('id', storyId);

      if (error) throw error;
      loadStories();
    } catch (error) {
      console.error('Error updating story:', error);
      alert('ステータスの変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedStory) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', selectedStory.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedStory(null);
      loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('体験記の削除に失敗しました');
    }
  };

  const filteredStories = stories.filter((story) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      story.title.toLowerCase().includes(searchLower) ||
      story.excerpt?.toLowerCase().includes(searchLower) ||
      story.author.full_name.toLowerCase().includes(searchLower) ||
      story.location?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Published':
        return '公開中';
      case 'Draft':
        return '下書き';
      case 'Archived':
        return 'アーカイブ';
      default:
        return status;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <BookOpen className="h-10 w-10 mr-3 text-blue-600" />
            投稿管理（体験記）
          </h1>
          <p className="text-gray-600">ユーザー投稿体験記の公開・管理</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                フィルター
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="Published">公開中</option>
                <option value="Draft">下書き</option>
                <option value="Archived">アーカイブ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="タイトル、投稿者、場所で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingStories ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              体験記がありません
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? '検索条件に一致する体験記が見つかりません'
                : 'まだ体験記が投稿されていません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredStories.length}件の体験記
            </div>

            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex gap-6">
                  {story.cover_image && (
                    <div className="flex-shrink-0">
                      <img
                        src={story.cover_image}
                        alt={story.title}
                        className="w-40 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              story.status
                            )}`}
                          >
                            {getStatusLabel(story.status)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {story.title}
                        </h3>

                        {story.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {story.excerpt}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{story.author.full_name}</span>
                          {story.location && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {story.location}
                              </span>
                            </>
                          )}
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {story.views}回閲覧
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(story.created_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link
                        to={`/stories/${story.id}`}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        詳細を見る
                      </Link>

                      {story.status === 'Draft' && (
                        <button
                          onClick={() => updateStatus(story.id, 'Published')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          公開する
                        </button>
                      )}

                      {story.status === 'Published' && (
                        <>
                          <button
                            onClick={() => updateStatus(story.id, 'Draft')}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition flex items-center text-sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            下書きに戻す
                          </button>
                          <button
                            onClick={() => updateStatus(story.id, 'Archived')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center text-sm"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            アーカイブ
                          </button>
                        </>
                      )}

                      {story.status === 'Archived' && (
                        <button
                          onClick={() => updateStatus(story.id, 'Published')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          公開する
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedStory(story);
                            setDeleteModalOpen(true);
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center text-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedStory(null);
        }}
        onConfirm={handleDelete}
        title="体験記を削除"
        message={`「${selectedStory?.title}」を削除してもよろしいですか？この操作は取り消せません。`}
      />
    </AdminLayout>
  );
}
