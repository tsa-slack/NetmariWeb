import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { Star, Eye, EyeOff, Trash2, Filter, Search, Calendar } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Review {
  id: string;
  target_type: string;
  target_id: string;
  rating: number;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  author: {
    full_name: string;
    email: string;
  };
}

export default function ReviewManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadReviews();
    }
  }, [user, isAdmin, isStaff, filter]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          target_type,
          target_id,
          rating,
          title,
          content,
          is_published,
          created_at,
          author:users!reviews_author_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'published') {
        query = query.eq('is_published', true);
      } else if (filter === 'unpublished') {
        query = query.eq('is_published', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const togglePublish = async (review: Review) => {
    try {
      const { error } = await (supabase

        .from('reviews') as any)

        .update({ is_published: !review.is_published })
        .eq('id', review.id);

      if (error) throw error;
      loadReviews();
    } catch (error) {
      console.error('Error toggling review:', error);
      alert('公開状態の変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', selectedReview.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedReview(null);
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('レビューの削除に失敗しました');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      review.title?.toLowerCase().includes(searchLower) ||
      review.content.toLowerCase().includes(searchLower) ||
      review.author.full_name.toLowerCase().includes(searchLower) ||
      review.author.email.toLowerCase().includes(searchLower)
    );
  });

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
            <Star className="h-10 w-10 mr-3 text-yellow-600" />
            レビュー管理
          </h1>
          <p className="text-gray-600">ユーザーレビューの公開・非公開管理</p>
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
                <option value="published">公開中</option>
                <option value="unpublished">非公開</option>
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
                placeholder="タイトル、内容、投稿者で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingReviews ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              レビューがありません
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? '検索条件に一致するレビューが見つかりません'
                : 'まだレビューが投稿されていません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredReviews.length}件のレビュー
            </div>

            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl shadow-lg p-6 ${
                  !review.is_published ? 'border-l-4 border-yellow-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          review.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
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

                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {review.content}
                    </p>

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">
                        {review.author.full_name}
                      </span>
                      <span className="text-gray-400 mr-2">•</span>
                      <span className="text-gray-500">{review.author.email}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(review.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-500">{review.target_type}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => togglePublish(review)}
                      className={`px-4 py-2 rounded-lg transition flex items-center text-sm ${
                        review.is_published
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {review.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          非公開
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          公開
                        </>
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedReview(review);
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
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedReview(null);
        }}
        onConfirm={handleDelete}
        title="レビューを削除"
        message={`このレビューを削除してもよろしいですか？この操作は取り消せません。`}
      />
    </AdminLayout>
  );
}
