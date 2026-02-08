import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ページ遷移時にスクロール位置をリセットするコンポーネント
 * App.tsx の Router 直下に配置する
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
