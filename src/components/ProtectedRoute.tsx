import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'sonner';

type UserRole = 'Admin' | 'Staff' | 'Partners' | 'Members';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** 許可するロール。省略時はログイン必須のみ（ロール制限なし） */
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // ロード中はスピナー表示
  if (loading) {
    return <LoadingSpinner />;
  }

  // 未ログイン → ログインページにリダイレクト（元のURLを保持）
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // ロール制限がある場合のチェック
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role as UserRole | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      toast.error('このページへのアクセス権限がありません');
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
