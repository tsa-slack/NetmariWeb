import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { Car, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';

export default function Header() {
  const { user, profile, signOut, isAdmin, isStaff, isPartner } = useAuth();
  const { settings } = useSystemSettings();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // ページ遷移時にモバイルメニューを自動的に閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* モバイル: ハンバーガー（左端） */}
            <button
              className="md:hidden mr-3"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Netomari
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/vehicles" className="text-gray-700 hover:text-blue-600 transition">
              車両情報
            </Link>
            {settings.rental_enabled && (
              <Link to="/rental" className="text-gray-700 hover:text-blue-600 transition">
                レンタル
              </Link>
            )}
            <Link to="/partners" className="text-gray-700 hover:text-blue-600 transition">
              パートナー
            </Link>
            <Link to="/routes" className="text-gray-700 hover:text-blue-600 transition">
              寄り道ルート
            </Link>
            <Link to="/portal" className="text-gray-700 hover:text-blue-600 transition">
              コミュニティ
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/mypage"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <User className="h-5 w-5" />
                  <span>{profile?.first_name || 'マイページ'}</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <Settings className="h-5 w-5" />
                    <span>管理画面</span>
                  </Link>
                )}
                {isStaff && !isAdmin && (
                  <Link
                    to="/staff"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <Settings className="h-5 w-5" />
                    <span>スタッフ</span>
                  </Link>
                )}
                {isPartner && !isAdmin && !isStaff && (
                  <Link
                    to="/partner/dashboard"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <Settings className="h-5 w-5" />
                    <span>協力店管理</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span>ログアウト</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  ログイン
                </Link>
                {settings.user_registration_enabled && (
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    新規登録
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* モバイル: ログインボタン（右端） */}
          {!user && (
            <div className="md:hidden">
              <Link
                to="/login"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ログイン
              </Link>
            </div>
          )}
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
            <Link
              to="/vehicles"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              販売車両
            </Link>
            {settings.rental_enabled && (
              <Link
                to="/rental"
                className="block py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                レンタル
              </Link>
            )}
            <Link
              to="/partners"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              協力店
            </Link>
            <Link
              to="/routes"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              寄り道ルート
            </Link>
            <Link
              to="/portal"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              コミュニティ
            </Link>
            {user ? (
              <>
                <Link
                  to="/mypage"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  マイページ
                </Link>
                {(isAdmin || isStaff) && (
                  <Link
                    to="/admin"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    管理画面
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block py-2 text-red-600 hover:text-red-700 w-full text-left"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ログイン
                </Link>
                {settings.user_registration_enabled && (
                  <Link
                    to="/register"
                    className="block py-2 text-blue-600 hover:text-blue-700 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    新規登録
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
