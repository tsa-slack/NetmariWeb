import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Car, MapPin, Users, Calendar, Star, Heart, Shield, ArrowRight, Tag, ChevronDown, HelpCircle } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/data-access';

interface PickupVehicle {
  id: string;
  name: string;
  type: string | null;
  year: number | null;
  manufacturer: string | null;
  images: unknown;
  specs: unknown;
  price_per_day: number;
  rental_vehicle_id: string;
}

interface PublishedReview {
  id: string;
  title: string | null;
  content: string | null;
  rating: number | null;
  created_at: string | null;
  author: { first_name: string | null; last_name: string | null } | null;
}

export default function HomePage() {
  const { settings } = useSystemSettings();
  const { user } = useAuth();

  // ピックアップ車両を取得 (レンタル車両から最新4台)
  const { data: pickupVehicles } = useQuery<PickupVehicle[]>(
    async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select(`
          id,
          price_per_day,
          vehicle:vehicles(id, name, type, year, manufacturer, images, specs)
        `)
        .eq('status', 'Available')
        .limit(4);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data || []).map((rv: any) => ({
        id: rv.vehicle?.id || rv.id,
        name: rv.vehicle?.name || '',
        type: rv.vehicle?.type || null,
        year: rv.vehicle?.year || null,
        manufacturer: rv.vehicle?.manufacturer || null,
        images: rv.vehicle?.images || null,
        specs: rv.vehicle?.specs || null,
        price_per_day: rv.price_per_day,
        rental_vehicle_id: rv.id,
      }));

      return { success: true, data: mapped };
    },
    { enabled: settings.rental_enabled }
  );

  // 利用者の声（公開レビュー、高評価を3件）
  const { data: reviews } = useQuery<PublishedReview[]>(
    async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          content,
          rating,
          created_at,
          author:users!reviews_author_id_fkey(first_name, last_name)
        `)
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return { success: true, data: data || [] };
    },
    { enabled: true }
  );

  // FAQ項目を取得
  const faqItems: { question: string; answer: string }[] = (() => {
    try {
      const raw = settings.faq_items;
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  })();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <Layout>
      {/* ヒーローセクション */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {settings.hero_image_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.hero_image_url})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 opacity-90" />
        )}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            {settings.hero_title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            {settings.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings.rental_enabled && (
              <Link
                to="/rental"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                レンタルを探す
              </Link>
            )}
            {!user && (
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition transform hover:scale-105 border border-white/30"
              >
                無料会員登録
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* サービスの特徴 */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
            Netomariの特徴
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            車中泊をもっと楽しく、もっと安心に。コミュニティでつながるメリットをご紹介します。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">豊富な車両ラインナップ</h3>
              <p className="text-gray-600">
                バンコン・キャブコン・軽キャンなど、様々なタイプのキャンピングカーから、あなたにぴったりの1台が見つかります
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <MapPin className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">寄り道ルート</h3>
              <p className="text-gray-600">
                目的地までの経路上にある協力店やおすすめスポットを簡単に発見・共有できます
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">コミュニティ</h3>
              <p className="text-gray-600">
                車中泊愛好家と繋がり、体験記やレビューを共有。仲間と一緒に旅を楽しめます
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">安心サポート</h3>
              <p className="text-gray-600">
                協力店ネットワークによるサポート体制。旅先でも安心のバックアップ
              </p>
            </div>

            {settings.rental_enabled && (
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">簡単予約</h3>
                <p className="text-gray-600">
                  オンラインで簡単にレンタル予約。ギアやアクティビティも一緒に予約できます
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">ランク特典</h3>
              <p className="text-gray-600">
                利用するほどランクアップ。会員特典や割引でお得に車中泊を楽しめます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ピックアップ車両 */}
      {settings.rental_enabled && pickupVehicles && pickupVehicles.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
              ピックアップ車両
            </h2>
            <p className="text-center text-gray-600 mb-12">
              人気のレンタル車両をご紹介
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pickupVehicles.map((vehicle) => {
                const images = vehicle.images as string[] | null;
                const specs = vehicle.specs as Record<string, unknown> | null;
                const capacity = specs?.capacity;
                return (
                  <Link
                    key={vehicle.rental_vehicle_id}
                    to="/rental"
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-gray-100"
                  >
                    {images && images.length > 0 ? (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={images[0]}
                          alt={vehicle.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Car className="h-16 w-16 text-white" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{vehicle.name}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {vehicle.type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="h-3 w-3 mr-0.5" />
                            {vehicle.type}
                          </span>
                        )}
                        {capacity ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Users className="h-3 w-3 mr-0.5" />
                            {String(capacity)}人
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-blue-600">
                          ¥{vehicle.price_per_day.toLocaleString()}<span className="text-sm font-normal text-gray-500">/日</span>
                        </p>
                        <ArrowRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link
                to="/vehicles"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                すべてのキャンピングカーを見る
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 利用者の声 */}
      {reviews && reviews.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
              利用者の声
            </h2>
            <p className="text-center text-gray-600 mb-12">
              実際にサービスをご利用いただいたお客様の声をご紹介
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex items-center mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < (review.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h3 className="font-semibold text-gray-800 mb-2">{review.title}</h3>
                  )}
                  {review.content && (
                    <p className="text-gray-600 mb-4 line-clamp-4">{review.content}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>
                      {review.author
                        ? `${String(review.author.last_name || '')}${String(review.author.first_name || '')}`
                        : '匿名ユーザー'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* はじめかた */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
            はじめかた
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">会員登録</h3>
              <p className="text-gray-600">
                無料で簡単に会員登録。メールアドレスとパスワードだけで始められます
              </p>
            </div>

            {settings.rental_enabled ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">車両を選ぶ</h3>
                  <p className="text-gray-600">
                    豊富なラインナップから、旅行スタイルに合った車両を選択します
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">予約・出発</h3>
                  <p className="text-gray-600">
                    オンラインで予約完了。準備が整ったら、自由な車中泊の旅へ出発
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">情報を探す</h3>
                  <p className="text-gray-600">
                    協力店やおすすめスポット、ルート情報を検索して旅の計画を立てます
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">体験を共有</h3>
                  <p className="text-gray-600">
                    旅の体験記を投稿したり、コミュニティで情報交換を楽しみましょう
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800 flex items-center justify-center">
              <HelpCircle className="h-9 w-9 mr-3 text-blue-600" />
              よくあるご質問
            </h2>
            <p className="text-center text-gray-600 mb-10">お客様からよくいただくご質問にお答えします</p>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-semibold text-gray-800 pr-4">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!user && (
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              今すぐNetomariを始めよう
            </h2>
            <p className="text-xl mb-8">
              無料会員登録で、すべての機能をご利用いただけます
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
            >
              無料会員登録
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}
