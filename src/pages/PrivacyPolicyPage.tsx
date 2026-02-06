import Layout from '../components/Layout';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">プライバシーポリシー</h1>
            </div>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 個人情報の収集</h2>
                <p className="leading-relaxed">
                  当社は、以下の個人情報を収集します：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>氏名（姓・名）</li>
                  <li>メールアドレス</li>
                  <li>電話番号</li>
                  <li>住所（郵便番号、都道府県、市区町村、番地、建物名・部屋番号）</li>
                  <li>パスワード（暗号化して保存）</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 個人情報の利用目的</h2>
                <p className="leading-relaxed">
                  収集した個人情報は、以下の目的で利用します：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>サービスの提供・運営のため</li>
                  <li>ユーザーからのお問い合わせへの対応のため</li>
                  <li>キャンピングカーのレンタル予約・配送のため</li>
                  <li>利用規約違反の対応のため</li>
                  <li>サービスの改善・新機能の開発のため</li>
                  <li>重要なお知らせや連絡事項の通知のため</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">3. 個人情報の第三者提供</h2>
                <p className="leading-relaxed">
                  当社は、以下の場合を除き、個人情報を第三者に提供しません：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>ユーザーの同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">4. 個人情報の安全管理</h2>
                <p className="leading-relaxed">
                  当社は、個人情報の漏洩、滅失、毀損を防止するため、適切な安全管理措置を講じます。個人情報は暗号化して保存され、アクセス制御により保護されています。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Cookie（クッキー）の使用</h2>
                <p className="leading-relaxed">
                  当サービスでは、ユーザーの利便性向上のためCookieを使用しています。Cookieの使用を望まない場合は、ブラウザの設定で無効にすることができますが、一部のサービスが正常に機能しない可能性があります。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">6. 個人情報の開示・訂正・削除</h2>
                <p className="leading-relaxed">
                  ユーザーは、自身の個人情報の開示、訂正、削除を請求することができます。マイページから情報の確認・変更が可能です。アカウントの削除をご希望の場合は、お問い合わせください。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">7. プライバシーポリシーの変更</h2>
                <p className="leading-relaxed">
                  当社は、法令の変更やサービスの変更に伴い、本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">8. お問い合わせ</h2>
                <p className="leading-relaxed">
                  本プライバシーポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
                </p>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">制定日: 2026年2月4日</p>
                <p className="text-sm text-gray-600">最終更新日: 2026年2月4日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
