import { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { logger } from '../lib/logger';
import { useRepository, RouteRepository } from '../lib/data-access';
import RouteForm from '../components/route/RouteForm';
import RouteMapSection from '../components/route/RouteMapSection';
import RouteList from '../components/route/RouteList';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

export default function RoutePage() {
  const { user } = useAuth();
  const routeRepo = useRepository(RouteRepository);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [myRoutes, setMyRoutes] = useState<Route[]>([]);
  const [publicRoutes, setPublicRoutes] = useState<Route[]>([]);
  const [showMyRoutes, setShowMyRoutes] = useState(true);
  const [showPublicRoutes, setShowPublicRoutes] = useState(true);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [loadedRoute, setLoadedRoute] = useState<Route | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPublicRoutes();
    if (user) {
      loadMyRoutes();
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadRouteId = params.get('load');
    if (loadRouteId && user) {
      loadRoute(loadRouteId);
    }
  }, [user]);

  const loadMyRoutes = async () => {
    if (!user) return;

    try {
      const result = await routeRepo.findByUser(user.id);
      if (!result.success) throw result.error;
      setMyRoutes(result.data);
    } catch (error) {
      logger.error('Error loading routes:', error);
    }
  };

  const loadPublicRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          users!inner(first_name, last_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicRoutes(data || []);
    } catch (error) {
      logger.error('Error loading public routes:', error);
    }
  };

  const saveRoute = async () => {
    if (!user) {
      setMessage('ルートを保存するにはログインが必要です');
      return;
    }

    if (!routeName.trim()) {
      setMessage('ルート名を入力してください');
      return;
    }

    if (!origin.trim() || !destination.trim()) {
      setMessage('出発地と目的地を入力してください');
      return;
    }

    setSaving(true);
    try {
      const routeData = {
        name: routeName,
        origin,
        destination,
        description: routeDescription || `${origin}から${destination}までのルート`,
        is_public: isPublic,
      };

      if (loadedRoute) {
        // 既存ルートの更新
        const result = await routeRepo.update(loadedRoute.id, routeData);
        if (!result.success) {
          logger.error('Route update error:', result.error);
          throw result.error;
        }
        setMessage(`ルートを更新しました ${isPublic ? '（公開）' : '（非公開）'}`);
      } else {
        // 新規ルートの作成
        const result = await routeRepo.create({
          user_id: user.id,
          ...routeData,
        });
        if (!result.success) {
          logger.error('Route error:', result.error);
          throw result.error;
        }
        setMessage(`ルートを保存しました ${isPublic ? '（公開）' : '（非公開）'}`);
      }

      setRouteName('');
      setRouteDescription('');
      setOrigin('');
      setDestination('');
      setIsPublic(false);
      setShowMap(false);
      setLoadedRoute(null);
      setRouteStops([]);
      loadMyRoutes();
      loadPublicRoutes();
      setTimeout(() => setMessage(''), 5000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error saving route:', error);
      setMessage(`ルートの保存に失敗しました: ${error.message || '不明なエラー'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const loadRoute = async (routeId: string) => {
    try {
      const routeResult = await routeRepo.findById(routeId);
      if (!routeResult.success) throw routeResult.error;
      if (!routeResult.data) {
        setMessage('ルートが見つかりませんでした');
        return;
      }

      const route = routeResult.data;

      const { data: stopsData, error: stopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order', { ascending: true });
        
      const stops = (stopsData || []) as unknown as RouteStop[];

      if (stopsError) {
        logger.error('Error loading stops:', stopsError);
      }

      setRouteName(route.name);
      setRouteDescription(route.description || '');
      setOrigin(route.origin || '');
      setDestination(route.destination || '');
      setIsPublic(route.is_public || false);
      setLoadedRoute(route);
      setRouteStops(stops || []);
      setShowMyRoutes(false);
      setShowMap(true);

      window.history.replaceState({}, '', '/routes');

      setMessage('ルートを読み込みました');
      setTimeout(() => setMessage(''), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error loading route:', error);
      setMessage(`ルートの読み込みに失敗しました: ${error.message || '不明なエラー'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;

    try {
      const result = await routeRepo.delete(routeToDelete);
      if (!result.success) throw result.error;
      setMessage('ルートを削除しました');
      loadMyRoutes();
      loadPublicRoutes();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      logger.error('Error deleting route:', error);
      setMessage('ルートの削除に失敗しました');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setShowDeleteModal(false);
      setRouteToDelete(null);
    }
  };

  const toggleRoutePublic = async (routeId: string, currentIsPublic: boolean) => {
    try {
      const result = await routeRepo.update(routeId, { is_public: !currentIsPublic });
      if (!result.success) throw result.error;
      setMessage(`ルートを${!currentIsPublic ? '公開' : '非公開'}にしました`);
      loadMyRoutes();
      loadPublicRoutes();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      logger.error('Error toggling route visibility:', error);
      setMessage('公開設定の変更に失敗しました');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">寄り道ルート</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-2">
            お気に入りのルートを保存して、他のユーザーと共有しよう
          </p>
          <p className="text-sm text-gray-500">
            公開設定により、おすすめルートをコミュニティで共有できます
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
            {message}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {user ? (
            <RouteForm
              routeName={routeName}
              onRouteNameChange={setRouteName}
              routeDescription={routeDescription}
              onRouteDescriptionChange={setRouteDescription}
              origin={origin}
              onOriginChange={setOrigin}
              destination={destination}
              onDestinationChange={setDestination}
              isPublic={isPublic}
              onIsPublicChange={setIsPublic}
              onSave={saveRoute}
              saving={saving}
              isLoggedIn={!!user}
            />
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 text-center border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                自分だけのルートを作成しよう
              </h3>
              <p className="text-gray-600 mb-6">
                ログインすると、寄り道ルートの作成・保存・共有ができます
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/login?redirect=/routes"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  ログイン
                </a>
                <a
                  href="/register"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition font-semibold border border-blue-200"
                >
                  無料会員登録
                </a>
              </div>
            </div>
          )}

          {showMap && loadedRoute && (
            <RouteMapSection routeStops={routeStops} />
          )}

          <RouteList
            myRoutes={myRoutes}
            publicRoutes={publicRoutes}
            showMyRoutes={showMyRoutes}
            onToggleMyRoutes={() => setShowMyRoutes(!showMyRoutes)}
            showPublicRoutes={showPublicRoutes}
            onTogglePublicRoutes={() => setShowPublicRoutes(!showPublicRoutes)}
            isLoggedIn={!!user}
            onLoadRoute={loadRoute}
            onTogglePublic={toggleRoutePublic}
            onDeleteRoute={(routeId) => {
              setRouteToDelete(routeId);
              setShowDeleteModal(true);
            }}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRouteToDelete(null);
        }}
        onConfirm={handleDeleteRoute}
        title="ルートを削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Layout>
  );
}
