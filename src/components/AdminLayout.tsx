import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  BookOpen,
  Star,
  Mail,
  TrendingUp,
  Settings,
  Menu,
  X,
  Calendar,
  Package,
  ShoppingCart,
  Tag,
  MessageCircle,
  FileText,
  Newspaper,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  staffVisible?: boolean; // スタッフにも表示するか
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 現在のパスからスタッフモードかどうか判定
  const isStaffMode = location.pathname.startsWith('/staff');
  const basePath = isStaffMode ? '/staff' : '/admin';

  const navItems: NavItem[] = [
    {
      path: `${basePath}`,
      label: 'ダッシュボード',
      icon: <LayoutDashboard className="h-5 w-5" />,
      staffVisible: true,
    },
    {
      path: `${basePath}/reservations`,
      label: '予約管理',
      icon: <Calendar className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/users`,
      label: 'ユーザー管理',
      icon: <Users className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/vehicles`,
      label: 'レンタル車両',
      icon: <Car className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/sale-vehicles`,
      label: '販売車両',
      icon: <ShoppingCart className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/equipment`,
      label: 'ギヤ管理',
      icon: <Package className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/partners`,
      label: '協力店管理',
      icon: <MapPin className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/activities`,
      label: 'アクティビティ管理',
      icon: <TrendingUp className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/stories`,
      label: '投稿管理',
      icon: <BookOpen className="h-5 w-5" />,
      staffVisible: true,
    },
    {
      path: `${basePath}/reviews`,
      label: 'レビュー管理',
      icon: <Star className="h-5 w-5" />,
      staffVisible: true,
    },
    {
      path: `${basePath}/questions`,
      label: '質問管理',
      icon: <MessageCircle className="h-5 w-5" />,
      staffVisible: true,
    },
    {
      path: `${basePath}/contacts`,
      label: 'お問い合わせ',
      icon: <Mail className="h-5 w-5" />,
      staffVisible: true,
    },
    {
      path: `${basePath}/categories`,
      label: 'カテゴリー管理',
      icon: <Tag className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/content`,
      label: 'コンテンツ管理',
      icon: <FileText className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/news`,
      label: 'ニュース管理',
      icon: <Newspaper className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      path: `${basePath}/settings`,
      label: 'システム設定',
      icon: <Settings className="h-5 w-5" />,
      adminOnly: true,
    },
  ];

  // ロールに応じてフィルタ:
  // Admin: すべて表示
  // Staff (admin画面): adminOnly以外を表示
  // Staff (staff画面): staffVisible のみ表示
  const filteredNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (isStaffMode) return item.staffVisible === true;
    return !item.adminOnly;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Header />

      <div className="flex flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-lg text-gray-700 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 mt-16"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {isStaffMode ? 'スタッフ管理' : '管理画面'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isAdmin ? '管理者' : 'スタッフ'}
              </p>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== basePath && location.pathname.startsWith(item.path + '/'));
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto p-4 sm:p-6 lg:p-8 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
