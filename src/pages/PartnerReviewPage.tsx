import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Partner = Database['public']['Tables']['partners']['Row'];

export default function PartnerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (id) {
      loadPartner();
    }
  }, [id]);

  const loadPartner = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPartner(data);
    } catch (error) {
      console.error('Error loading partner:', error);
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

      const { error } = await supabase.from('reviews').insert({
        target_type: 'Partner',
        target_id: id,
        author_id: user!.id,
        rating,
        title: title.trim() || null,
        content: content.trim(),
      });

      if (error) throw error;

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_type', 'Partner')
        .eq('target_id', id);

      if (reviews) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('partners')
          .update({
            rating: avgRating,
            review_count: reviews.length,
          })
          .eq('id', id);
      }

      alert('レビューを投稿しました');
      navigate(`/partners/${id}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('レビューの投稿に失敗しました');
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

  if (!partner) {
    return <Navigate to="/partners" replace />;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to={`/partners/${id}`} className="text-blue-600 hover:text-blue-700">
            ← {partner.name}に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">レビューを書く</h1>
          <p className="text-gray-600 mb-8">{partner.name}</p>

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
                {submitting ? '投稿中...' : 'レビューを投稿'}
              </button>
              <Link
                to={`/partners/${id}`}
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
        title="レビューを投稿しますか？"
        message="この内容でレビューを投稿してもよろしいですか？"
      />
    </Layout>
  );
}
