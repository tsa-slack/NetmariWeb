import { MapPin, Phone, Mail, Building2 } from 'lucide-react';
import Layout from '../components/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">会社概要</h1>
            <p className="text-lg text-gray-600">
              キャンピングカーで新しい旅のスタイルを提供します
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                株式会社キャンピングカー・シェア秋田
              </h2>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    会社名
                  </h3>
                  <p className="text-lg text-gray-900">
                    株式会社キャンピングカー・シェア秋田
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    英文社名
                  </h3>
                  <p className="text-lg text-gray-900">
                    Camping Car Share Akita Inc.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    設立
                  </h3>
                  <p className="text-lg text-gray-900">2023年4月1日</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    資本金
                  </h3>
                  <p className="text-lg text-gray-900">3,000万円</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    代表者
                  </h3>
                  <p className="text-lg text-gray-900">代表取締役社長 佐藤 太郎</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    従業員数
                  </h3>
                  <p className="text-lg text-gray-900">25名</p>
                </div>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  事業内容
                </h3>
                <ul className="space-y-2 text-gray-900">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">●</span>
                    <span>キャンピングカーのレンタル・シェアリングサービス</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">●</span>
                    <span>キャンピングカーの販売及び整備</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">●</span>
                    <span>アウトドア用品のレンタル及び販売</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">●</span>
                    <span>キャンプ場の運営及びコンサルティング</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">●</span>
                    <span>観光ルートの企画及び情報提供</span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-8 space-y-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  所在地・連絡先
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">本社所在地</h4>
                      <p className="text-gray-700">
                        〒010-0001<br />
                        秋田県秋田市中通1丁目4-1 秋田駅前ビル8階
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">電話番号</h4>
                      <p className="text-gray-700">018-123-4567</p>
                      <p className="text-sm text-gray-500 mt-1">
                        受付時間：9:00〜18:00（年中無休）
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">メールアドレス</h4>
                      <p className="text-gray-700">info@camping-share-akita.co.jp</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  取引銀行
                </h3>
                <ul className="space-y-2 text-gray-900">
                  <li>秋田銀行 本店営業部</li>
                  <li>北都銀行 秋田支店</li>
                </ul>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  加盟団体
                </h3>
                <ul className="space-y-2 text-gray-900">
                  <li>一般社団法人 日本RV協会</li>
                  <li>秋田県観光連盟</li>
                  <li>秋田商工会議所</li>
                </ul>
              </div>

              <div className="border-t pt-8 bg-slate-50 -mx-8 px-8 py-6 -mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  企業理念
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  私たちは、キャンピングカーを通じて人々に自由な旅のスタイルを提供し、
                  日本の美しい自然と地域文化を体験する機会を創出します。
                  安全で快適なサービスを提供することで、お客様の思い出に残る旅をサポートし、
                  地域経済の活性化と持続可能な観光の発展に貢献します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
