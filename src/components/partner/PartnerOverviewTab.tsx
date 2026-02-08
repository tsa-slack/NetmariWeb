import { Link } from 'react-router-dom';
import {
  Store,
  Star,
  MessageSquare,
  TrendingUp,
  Edit,
  Eye,
  Heart,
  MapPin,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Partner = Database['public']['Tables']['partners']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];

interface Stats {
  totalReviews: number;
  averageRating: number;
  totalFavorites: number;
  monthlyViews: number;
}

interface PartnerOverviewTabProps {
  partner: Partner;
  stats: Stats;
  recentReviews: Review[];
}

export default function PartnerOverviewTab({
  partner,
  stats,
  recentReviews,
}: PartnerOverviewTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.averageRating}</span>
          </div>
          <p className="text-blue-100">平均評価</p>
          <p className="text-blue-200 text-sm">{stats.totalReviews}件のレビュー</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Heart className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalFavorites}</span>
          </div>
          <p className="text-pink-100">お気に入り登録数</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Eye className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.monthlyViews}</span>
          </div>
          <p className="text-green-100">今月の閲覧数</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">+12%</span>
          </div>
          <p className="text-purple-100">先月比</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Store className="h-5 w-5 mr-2 text-blue-600" />
              店舗情報
            </h2>
            <Link
              to={`/admin/partners/${partner.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="h-4 w-4 mr-1" />
              編集
            </Link>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">店舗名</p>
              <p className="font-semibold text-gray-800">{partner.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">カテゴリー</p>
              <p className="font-semibold text-gray-800">
                {partner.type === 'RVPark'
                  ? 'RVパーク'
                  : partner.type === 'Restaurant'
                  ? 'レストラン'
                  : partner.type === 'GasStation'
                  ? 'ガソリンスタンド'
                  : partner.type === 'Tourist'
                  ? '観光施設'
                  : 'その他'}
              </p>
            </div>
            {partner.address && (
              <div>
                <p className="text-sm text-gray-500">住所</p>
                <p className="font-semibold text-gray-800 flex items-start">
                  <MapPin className="h-4 w-4 mr-1 mt-1 text-gray-400" />
                  {partner.address}
                </p>
              </div>
            )}
          </div>
          <Link
            to={`/partners/${partner.id}`}
            className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Eye className="h-4 w-4 mr-2" />
            公開ページを見る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-600" />
            評価サマリー
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">総レビュー数</span>
              <span className="font-bold text-gray-800">{stats.totalReviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">平均評価</span>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                <span className="font-bold text-gray-800">{stats.averageRating}</span>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500 mb-2">評価分布</p>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <span className="text-sm text-gray-600 w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                      <div
                        className="h-2 bg-yellow-500 rounded-full"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">0</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          最新のレビュー
        </h2>
        {recentReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            まだレビューがありません
          </p>
        ) : (
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (review.rating ?? 0)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString('ja-JP') : '-'}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {review.title}
                  </h4>
                )}
                <p className="text-gray-600 text-sm">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
