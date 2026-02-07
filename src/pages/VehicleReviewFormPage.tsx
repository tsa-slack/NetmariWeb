import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Star, Car, ArrowLeft, Send } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  rental_vehicle?: {
    vehicle?: {
      id: string;
      name: string;
      manufacturer?: string;
      images?: string[];
    };
  };
};

export default function VehicleReviewFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingReview, setExistingReview] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!reservationId) {
      alert('予約IDが指定されていません');
      navigate('/my-page?tab=reservations');
      return;
    }

    loadReservation();
  }, [user, reservationId]);

  const loadReservation = async () => {
    try {
      const { data: reservationData, error: reservationError } = await (supabase

        .from('reservations') as any)

        .select(`
          *,
          rental_vehicle:rental_vehicles(
            vehicle:vehicles(
              id,
              name,
              manufacturer,
              images
            )
          )
        `)
        .eq('id', reservationId!)
        .eq('user_id', user!.id)
        .eq('status', 'Completed')
        .maybeSingle();

      if (reservationError) throw reservationError;

      if (!reservationData) {
        alert('完了した予約が見つかりません');
        navigate('/my-page?tab=reservations');
        return;
      }

      setReservation(reservationData);

      const { data: existingReviewData } = await (supabase


        .from('reviews') as any)


        .select('id')
        .eq('reservation_id', reservationId!)
        .maybeSingle();

      if (existingReviewData) {
        setExistingReview(true);
        alert('この予約に対するレビューは既に投稿済みです');
        navigate('/my-page?tab=reservations');
        return;
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      alert('予約情報の読み込みに失敗しました');
      navigate('/my-page?tab=reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservation?.rental_vehicle?.vehicle?.id) {
      alert('車両情報が見つかりません');
      return;
    }

    if (!content.trim()) {
      alert('レビュー内容を入力してください');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await (supabase

        .from('reviews') as any)

        .insert({
        target_type: 'Vehicle',
        target_id: reservation.rental_vehicle.vehicle.id,
        reservation_id: reservationId,
        author_id: user!.id,
        rating,
        title: title.trim() || null,
        content: content.trim(),
      });

      if (error) throw error;

      alert('レビューを投稿しました');
      navigate(`/vehicles/${reservation.rental_vehicle.vehicle.id}`);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message || 'レビューの投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!reservation || existingReview) {
    return null;
  }

  const vehicle = reservation.rental_vehicle?.vehicle;
  const images = (vehicle?.images as string[]) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to="/my-page?tab=reservations"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            予約一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">車両レビューを投稿</h1>

          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">レンタルした車両</h2>
            <div className="flex items-center gap-4">
              {images.length > 0 ? (
                <div
                  className="w-24 h-24 bg-cover bg-center rounded-lg flex-shrink-0"
                  style={{ backgroundImage: `url(${images[0]})` }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="h-12 w-12 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {vehicle?.name || 'レンタル車両'}
                </h3>
                {vehicle?.manufacturer && (
                  <p className="text-gray-600">{vehicle.manufacturer}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  利用期間: {new Date(reservation.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                  {new Date(reservation.end_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                評価 <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        value <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-4 text-lg font-semibold text-gray-800">
                  {rating === 5
                    ? '最高！'
                    : rating === 4
                    ? '良い'
                    : rating === 3
                    ? '普通'
                    : rating === 2
                    ? 'イマイチ'
                    : '悪い'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル（任意）
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 家族旅行に最適な車両でした"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                placeholder="車両の使い心地、快適性、装備、運転のしやすさなど、詳しく教えてください"
                rows={8}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                最低50文字以上でご記入ください（現在: {content.length}文字）
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>レビューガイドライン：</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>実際の利用体験に基づいた内容をご記入ください</li>
                <li>他のユーザーの参考になる具体的な情報を含めてください</li>
                <li>誹謗中傷や不適切な表現は避けてください</li>
                <li>投稿後のレビューは編集・削除できます</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/my-page?tab=reservations')}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || content.length < 50}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    投稿中...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    レビューを投稿
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
