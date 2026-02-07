import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

import Layout from '../components/Layout';
import { Car, Calendar, Star, MessageCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { VehicleRepository, ReviewRepository, useQuery, useRepository } from '../lib/data-access';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'] & {
  author?: {
    first_name: string;
    last_name: string;
  };
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  // リポジトリインスタンスを作成
  const vehicleRepo = useRepository(VehicleRepository);
  const reviewRepo = useRepository(ReviewRepository);

  // 車両情報を取得
  const { data: vehicle, loading, error } = useQuery<Vehicle | null>(
    async () => vehicleRepo.findById(id!),
    { enabled: !!id }
  );

  // レビューを取得
  const { data: reviews } = useQuery<Review[]>(
    async () => reviewRepo.findByTargetWithAuthor('Vehicle', id!),
    { enabled: !!id }
  );

  // 平均評価を計算
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <Link
              to="/vehicles"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-block"
            >
              車両一覧に戻る
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!vehicle) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">車両が見つかりません</p>
            <Link
              to="/vehicles"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              車両一覧に戻る
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const specs = vehicle.specs as Record<string, any> || {};
  const features = vehicle.features as Record<string, any> || {};
  const images = vehicle.images as string[] || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/vehicles" className="text-blue-600 hover:text-blue-700">
            ← 車両一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8">
              {images.length > 0 ? (
                <div className="aspect-video bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${images[0]})` }} />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center rounded-lg">
                  <Car className="h-32 w-32 text-white opacity-50" />
                </div>
              )}

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {images.slice(1, 5).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-cover bg-center rounded-lg cursor-pointer hover:opacity-75 transition"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{vehicle.name}</h1>
                {vehicle.manufacturer && (
                  <p className="text-xl text-gray-600 mb-4">{vehicle.manufacturer}</p>
                )}
                {vehicle.year && (
                  <p className="text-gray-600 mb-4">年式: {vehicle.year}年</p>
                )}

                {(reviews?.length || 0) > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(averageRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {averageRating.toFixed(1)} ({reviews?.length || 0}件のレビュー)
                    </span>
                  </div>
                )}

                <span
                  className={`inline-block px-3 py-1 text-sm rounded-full ${
                    vehicle.status === 'Available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {vehicle.status === 'Available' ? '在庫あり' : vehicle.status}
                </span>
              </div>

              {vehicle.price && (
                <div className="mb-6">
                  <div className="text-4xl font-bold text-blue-600">
                    ¥{vehicle.price.toLocaleString()}
                  </div>
                </div>
              )}

              {vehicle.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">概要</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {vehicle.description}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <Link
                  to="/rental"
                  className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
                >
                  <Calendar className="h-6 w-6 mr-2" />
                  レンタル予約
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t">
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.keys(specs).length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">仕様</h2>
                    <div className="space-y-3">
                      {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">{key}</span>
                          <span className="font-medium text-gray-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(features).length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">特徴・装備</h2>
                    <div className="space-y-2">
                      {Object.entries(features).map(([key, value]) => (
                        <div key={key} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-800">{key}</p>
                            <p className="text-gray-600">{String(value)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <MessageCircle className="h-6 w-6 mr-2" />
                  レビュー ({reviews?.length || 0})
                </h2>
              </div>

              {(reviews?.length || 0) === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">まだレビューがありません</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(reviews || []).map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium text-gray-800">
                              {review.author?.first_name} {review.author?.last_name}
                            </span>
                          </div>
                          {review.title && (
                            <h3 className="font-semibold text-gray-800 mb-2">{review.title}</h3>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {review.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
