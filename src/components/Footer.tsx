import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function Footer() {
  const { settings } = useSystemSettings();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Car className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">Netomari</span>
            </div>
            <p className="text-sm">
              どこでも、寝泊まりを。車中泊に特化したキャンピングカーコミュニティサービス
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/vehicles" className="hover:text-white transition">
                  車両情報
                </Link>
              </li>
              {settings.rental_enabled && (
                <li>
                  <Link to="/rental" className="hover:text-white transition">
                    レンタル
                  </Link>
                </li>
              )}
              <li>
                <Link to="/partners" className="hover:text-white transition">
                  協力店
                </Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-white transition">
                  寄り道ルート
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">コミュニティ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/portal" className="hover:text-white transition">
                  ポータル
                </Link>
              </li>
              <li>
                <Link to="/portal/stories" className="hover:text-white transition">
                  体験記
                </Link>
              </li>
              <li>
                <Link to="/portal/events" className="hover:text-white transition">
                  イベント
                </Link>
              </li>
              <li>
                <Link to="/portal/qa" className="hover:text-white transition">
                  Q&A
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">会社情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  会社概要
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2026 Netomari. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
