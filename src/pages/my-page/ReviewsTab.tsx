import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Edit, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/ConfirmModal';
import type { Review } from './types';
import { logger } from '../../lib/logger';

interface ReviewsTabProps {
  myReviews: Review[] | undefined;
  reviewsLoading: boolean;
}

export default function ReviewsTab({ myReviews, reviewsLoading }: ReviewsTabProps) {
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const handleToggleReviewPublish = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('reviews')
        .update({ is_published: !currentStatus })
        .eq('id', reviewId);
      if (error) throw error;
      toast.success(!currentStatus ? 'レビューを公開しました' : 'レビューを非公開にしました');
    } catch (error) {
      logger.error('Error toggling review publish status:', error);
      toast.error('公開状態の変更に失敗しました');
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewToDelete);
      if (error) throw error;
      toast.success('レビューを削除しました');
    } catch (error) {
      logger.error('Error deleting review:', error);
      toast.error('レビューの削除に失敗しました');
    } finally {
      setShowDeleteReviewModal(false);
      setReviewToDelete(null);
    }
  };

  return (
    <>
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
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        review.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {review.is_published ? '公開中' : '非公開'}
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{review.title}</h3>
                    )}
                    <p className="text-gray-600 mb-2 line-clamp-2">{review.content}</p>
                    {review.partner_name && (
                      <p className="text-sm text-gray-500">投稿先: {review.partner_name}</p>
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
                      onClick={() => { setReviewToDelete(review.id); setShowDeleteReviewModal(true); }}
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
      <ConfirmModal
        isOpen={showDeleteReviewModal}
        onClose={() => { setShowDeleteReviewModal(false); setReviewToDelete(null); }}
        onConfirm={handleDeleteReview}
        title="レビューを削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </>
  );
}
