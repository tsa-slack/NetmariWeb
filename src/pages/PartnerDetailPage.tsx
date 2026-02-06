import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { MapPin, Star, Clock, Phone, Mail, Globe, Heart, Edit, Trash2, ImageIcon } from 'lucide-react';
import type { Database } from '../lib/database.types';
import ConfirmModal from '../components/ConfirmModal';

type Partner = Database['public']['Tables']['partners']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadPartner();
      loadReviews();
      if (user) {
        checkFavoriteStatus();
      }
    }
  }, [id, user]);

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

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('target_type', 'Partner')
        .eq('target_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_favorites')
        .select('id')
        .eq('partner_id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert('お気に入りに追加するにはログインが必要です');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('partner_favorites')
          .delete()
          .eq('partner_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('partner_favorites')
          .insert({
            partner_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('お気に入りの更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('協力店を削除しました');
      window.location.href = '/partners';
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('協力店の削除に失敗しました');
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

  if (!partner) {
    return <Navigate to="/partners" replace />;
  }

  const images = Array.isArray(partner.images) ? partner.images : [];
  const contact = typeof partner.contact === 'object' && partner.contact ? partner.contact as Record<string, any> : {};
  const facilities = typeof partner.facilities === 'object' && partner.facilities ? partner.facilities as Record<string, any> : {};
  const pricing = typeof partner.pricing === 'object' && partner.pricing ? partner.pricing as Record<string, any> : {};
  const openingHours = typeof partner.opening_hours === 'object' && partner.opening_hours ? partner.opening_hours as Record<string, any> : {};

  const isAdmin = profile?.role === 'Admin';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/partners" className="text-blue-600 hover:text-blue-700">
            ← 協力店一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {images.length > 0 ? (
            <div
              className="h-96 bg-cover bg-center"
              style={{ backgroundImage: `url(${images[0]})` }}
            />
          ) : (
            <div className="h-96 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <ImageIcon className="h-32 w-32 text-white opacity-50" />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{partner.name}</h1>
                {partner.type && (
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-4">
                    {partner.type === 'RVPark' ? 'RVパーク' :
                     partner.type === 'Restaurant' ? 'レストラン' :
                     partner.type === 'GasStation' ? 'ガソリンスタンド' :
                     partner.type === 'Tourist' ? '観光施設' : 'その他'}
                  </span>
                )}
                <div className="flex items-center mb-4">
                  <Star className="h-6 w-6 text-yellow-400 mr-2" />
                  <span className="text-2xl font-semibold text-gray-800">
                    {Math.round(partner.rating || 0)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    ({partner.review_count || 0}件のレビュー)
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-lg transition ${
                    isFavorite
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                {isAdmin && (
                  <>
                    <Link
                      to={`/admin/partners/${partner.id}/edit`}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit className="h-6 w-6" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {partner.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">概要</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {partner.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {partner.address && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    住所
                  </h3>
                  <p className="text-gray-700">{partner.address}</p>
                </div>
              )}

              {Object.keys(contact).length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">連絡先</h3>
                  <div className="space-y-2">
                    {contact.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-5 w-5 mr-2 text-blue-600" />
                        <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-5 w-5 mr-2 text-blue-600" />
                        <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center text-gray-700">
                        <Globe className="h-5 w-5 mr-2 text-blue-600" />
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          ウェブサイト
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {Object.keys(openingHours).length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    営業時間
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    {Object.entries(openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium">{day}:</span>
                        <span>{String(hours)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(facilities).length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">設備</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(facilities).map(([key, value]) => (
                      value && (
                        <span
                          key={key}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {key}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {Object.keys(pricing).length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">料金</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(pricing).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-700">{key}:</span>
                      <span className="font-semibold text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 1 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">ギャラリー</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.slice(1).map((image: any, index: number) => (
                    <div
                      key={index}
                      className="h-32 bg-cover bg-center rounded-lg"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">レビュー</h3>
                {user && (
                  <Link
                    to={`/partners/${id}/review`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    レビューを書く
                  </Link>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  まだレビューがありません。最初のレビューを書いてみませんか？
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-3 font-medium text-gray-800">
                              {review.author?.first_name} {review.author?.last_name}
                            </span>
                            <span className="ml-3 text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          {review.title && (
                            <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
                          )}
                          <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
                        </div>
                        {user && review.author_id === user.id && (
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              to={`/reviews/${review.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="編集"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="協力店を削除"
        message="本当にこの協力店を削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Layout>
  );
}
