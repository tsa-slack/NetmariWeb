import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Review = Database['public']['Tables']['reviews']['Row'];

export default function ReviewEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (id && user) {
      loadReview();
    }
  }, [id, user]);

  const loadReview = async () => {
    try {
      const { data, error } = await (supabase

        .from('reviews') as any)

        .select('*')
        .eq('id', id!)
        .eq('author_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setReview(data);
        setRating(data.rating);
        setTitle(data.title || '');
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error loading review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      alert('評価を選択してください');
      return;
    }

    if (!content.trim()) {
      alert('レビュー内容を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      const { error } = await (supabase


        .from('reviews') as any)


        .update({
          rating,
          title: title.trim() || null,
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!);

      if (error) throw error;

      const { data: reviews } = await (supabase


        .from('reviews') as any)


        .select('rating')
        .eq('target_type', review!.target_type)
        .eq('target_id', review!.target_id)
        .eq('is_published', true);

      if (reviews) {
        const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

        if (review!.target_type === 'Partner') {
          await (supabase

            .from('partners') as any)

            .update({
              rating: avgRating,
              review_count: reviews.length,
            })
            .eq('id', review!.target_id);
        }
      }

      alert('レビューを更新しました');
      navigate('/my');
    } catch (error) {
      console.error('Error updating review:', error);
      alert('レビューの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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

  if (!review) {
    return <Navigate to="/my" replace />;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/my" className="text-blue-600 hover:text-blue-700">
            ← マイページに戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">レビューを編集</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                評価 <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-3 text-lg font-semibold text-gray-700">
                    {rating}.0
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル（任意）
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：とても快適でした"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                レビュー内容 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="あなたの体験をシェアしてください"
                rows={8}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">{content.length}文字</p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={submitting || !rating || !content.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '更新中...' : '更新する'}
              </button>
              <Link
                to="/my"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="レビューを更新しますか？"
        message="この内容でレビューを更新してもよろしいですか？"
      />
    </Layout>
  );
}
