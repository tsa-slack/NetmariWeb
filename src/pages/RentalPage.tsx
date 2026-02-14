import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, ArrowRight, AlertCircle, Car, MapPin, Users, Shield, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemSettingsRepository, useQuery } from '../lib/data-access';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface RentalVehiclePreview {
  id: string;
  price_per_day: number;
  vehicle: {
    id: string;
    name: string;
    type: string | null;
    year: number | null;
    manufacturer: string | null;
    images: unknown;
    specs: unknown;
  } | null;
}

export default function RentalPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { settings } = useSystemSettings();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // リポジトリインスタンスを作成
  const settingsRepo = new SystemSettingsRepository();

  // レンタル有効状態を取得
  const { data: rentalEnabledValue, loading: checkingSettings } = useQuery<string | null>(
    async () => settingsRepo.findByKey('rental_enabled'),
    { enabled: true }
  );

  const rentalEnabled = rentalEnabledValue === 'true';

  // レンタル車両プレビュー（ゲスト用）
  const { data: previewVehicles } = useQuery<RentalVehiclePreview[]>(
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
      return { success: true, data: data || [] };
    },
    { enabled: !user && rentalEnabled }
  );

  if (loading || checkingSettings) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!rentalEnabled) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              レンタル機能は現在利用できません
            </h1>
            <p className="text-gray-600 mb-8">
              申し訳ございませんが、レンタル機能は一時的にご利用いただけません。
              <br />
              詳しくはお問い合わせください。
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                トップページへ
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                お問い合わせ
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 未ログイン：ゲスト向け紹介コンテンツ
  if (!user) {
    const minPrice = previewVehicles && previewVehicles.length > 0
      ? Math.min(...previewVehicles.map(v => v.price_per_day))
      : null;

    return (
      <Layout>
        {/* ヒーローセクション */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 text-white overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {settings.rental_intro_title || '車中泊レンタルの魅力'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              {settings.rental_intro_description || 'キャンピングカーでの車中泊は自由な旅の始まり。好きな場所で、好きな時間に、特別な体験を。'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                無料会員登録してレンタルする
              </Link>
              <Link
                to="/login?redirect=/rental"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                ログインしてレンタルする
              </Link>
            </div>
          </div>
        </section>

        {/* 車中泊の魅力 */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">キャンピングカー車中泊の魅力</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">自由な旅</h3>
                <p className="text-gray-600">
                  宿泊先に縛られず、気の向くまま自由に移動。絶景スポットを独り占めできます
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">快適な装備</h3>
                <p className="text-gray-600">
                  ベッド・キッチン・電源完備。アウトドアでも快適に過ごせる充実の装備
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">家族で楽しめる</h3>
                <p className="text-gray-600">
                  家族やグループで移動するホテル。子供も大人もワクワクする旅の体験を
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* レンタル可能車両プレビュー */}
        {previewVehicles && previewVehicles.length > 0 && (
          <section className="py-16 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">レンタル可能な車両</h2>
              <p className="text-center text-gray-600 mb-12">
                様々なタイプのキャンピングカーをご用意しています
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {previewVehicles.map((rv) => {
                  const vehicle = rv.vehicle;
                  if (!vehicle) return null;
                  const images = vehicle.images as string[] | null;
                  const specs = vehicle.specs as Record<string, unknown> | null;
                  const capacity = specs?.capacity;
                  return (
                    <div
                      key={rv.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
                    >
                      {images && images.length > 0 ? (
                        <div className="h-44 overflow-hidden">
                          <img
                            src={images[0]}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
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
                        <p className="text-lg font-bold text-blue-600">
                          ¥{rv.price_per_day.toLocaleString()}<span className="text-sm font-normal text-gray-500">/日</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 参考料金表 */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">参考料金</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">利用期間</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">参考料金（税込）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-800">1泊2日</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">
                      {minPrice ? `¥${(minPrice * 2).toLocaleString()}〜` : '料金はお問い合わせください'}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-800">2泊3日</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">
                      {minPrice ? `¥${(minPrice * 3).toLocaleString()}〜` : '料金はお問い合わせください'}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-800">1週間</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">
                      {minPrice ? `¥${(minPrice * 7).toLocaleString()}〜` : '料金はお問い合わせください'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                ※ 参考料金です。車両やオプションにより異なります。
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              キャンピングカーで自由な旅を始めよう
            </h2>
            <p className="text-xl mb-8 opacity-90">
              今すぐ無料会員登録して、レンタル予約を始めましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                無料会員登録
              </Link>
              <Link
                to="/login?redirect=/rental"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                ログイン
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // ログイン済み：既存の日付選択フォーム
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('利用開始日と返却日を選択してください');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError('返却日は利用開始日より後の日付を選択してください');
      return;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    navigate(`/rental/vehicles?start=${startDate}&end=${endDate}&days=${days}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">レンタル予約</h1>
          <p className="text-lg md:text-xl text-gray-600">
            利用期間を選択してください
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  利用開始日
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    className="date-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  返却日
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    className="date-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {startDate && endDate && new Date(startDate) < new Date(endDate) && (() => {
              const days = Math.ceil(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const maxDays = settings.max_rental_days || 14;
              return (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                      利用期間: {days}日間
                    </p>
                  </div>
                  {days > maxDays && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-800 font-semibold">
                          レンタル可能な連続日数（{maxDays}日間）を超えています
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          {maxDays}日間を超える長期レンタルをご希望の場合は、事前にお問い合わせください。
                          別途ご相談の上、対応させていただきます。
                        </p>
                        <Link
                          to="/contact"
                          className="inline-block mt-2 text-sm text-yellow-800 underline hover:text-yellow-900 font-medium"
                        >
                          お問い合わせはこちら →
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              利用可能な車両を検索
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ご利用の流れ</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">利用期間の選択</p>
                  <p className="text-sm text-gray-600">利用開始日と返却日を選択します</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">車両の選択</p>
                  <p className="text-sm text-gray-600">利用可能な車両から選択します</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">ギア・装備の選択</p>
                  <p className="text-sm text-gray-600">必要な装備を追加できます（任意）</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">アクティビティの選択</p>
                  <p className="text-sm text-gray-600">体験したいアクティビティを選択できます（任意）</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  5
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">予約の確定</p>
                  <p className="text-sm text-gray-600">内容を確認して予約を完了します</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
