import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Car, MapPin, Users, Calendar, Compass } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function HomePage() {
  const { settings } = useSystemSettings();

  return (
    <Layout>
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 opacity-90" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            どこでも、寝泊まりを。
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            車中泊に特化したキャンピングカーコミュニティサービス
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
            <Link
              to="/register"
              className="px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition transform hover:scale-105"
            >
              無料会員登録
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
            Netomariの特徴
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">豊富な車両</h3>
              <p className="text-gray-600">
                様々なタイプのキャンピングカーから、あなたにぴったりの1台を見つけられます
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">寄り道ルート</h3>
              <p className="text-gray-600">
                目的地までの経路上にある協力店やおすすめスポットを簡単に発見できます
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">コミュニティ</h3>
              <p className="text-gray-600">
                車中泊愛好家と繋がり、体験記やレビューを共有できます
              </p>
            </div>

            {settings.rental_enabled ? (
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">簡単予約</h3>
                <p className="text-gray-600">
                  オンラインで簡単にレンタル予約。スムーズな車中泊体験を実現します
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Compass className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">ルート探索</h3>
                <p className="text-gray-600">
                  出発地から目的地まで、最適なルートを簡単に検索・保存できます
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
    </Layout>
  );
}
