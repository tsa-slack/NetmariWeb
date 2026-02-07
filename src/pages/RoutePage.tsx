import { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import RouteMap from '../components/RouteMap';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Navigation,
  Save,
  Map,
  Eye,
  EyeOff,
  Globe,
  Lock,
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { logger } from '../lib/logger';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

export default function RoutePage() {
  const { user } = useAuth();
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
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRoutes(data || []);
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
      const { error: routeError } = await (supabase
        .from('routes'))
        .insert({
          user_id: user.id,
          name: routeName,
          origin,
          destination,
          description: routeDescription || `${origin}から${destination}までのルート`,
          is_public: isPublic,
        });

      if (routeError) {
        logger.error('Route error:', routeError);
        throw routeError;
      }

      setMessage(`ルートを保存しました ${isPublic ? '（公開）' : '（非公開）'}`);
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
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .maybeSingle();

      if (routeError) throw routeError;
      if (!routeData) {
        setMessage('ルートが見つかりませんでした');
        return;
      }

      const route = routeData as unknown as Route;

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
      setOrigin(route.origin);
      setDestination(route.destination);
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
      const { error } = await supabase.from('routes').delete().eq('id', routeToDelete);

      if (error) throw error;
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
      const { error } = await (supabase
        .from('routes'))
        .update({ is_public: !currentIsPublic })
        .eq('id', routeId);

      if (error) throw error;
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">寄り道ルート</h1>
          <p className="text-xl text-gray-600 mb-2">
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Map className="h-6 w-6 mr-2 text-blue-600" />
                ルート設定
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ルート名
                  </label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 東京から箱根への旅"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex items-center">
                      {isPublic ? (
                        <Globe className="h-5 w-5 text-blue-600 mr-3" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-600 mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-800">
                          {isPublic ? '公開ルート' : '非公開ルート'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isPublic
                            ? '他のユーザーがこのルートを閲覧できます'
                            : '自分だけがこのルートを閲覧できます'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Navigation className="inline h-4 w-4 mr-1" />
                    出発地
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 東京都渋谷区"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    目的地
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 神奈川県箱根町"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ルートの説明（任意）
                  </label>
                  <textarea
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 温泉と美術館を巡る旅"
                    rows={3}
                  />
                </div>
              </div>

              {user && (
                <button
                  onClick={saveRoute}
                  disabled={saving}
                  className="mt-6 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? '保存中...' : 'ルートを保存'}
                </button>
              )}

              {!user && (
                <p className="mt-6 text-center text-sm text-gray-600">
                  ルートを保存するにはログインが必要です
                </p>
              )}
            </div>

            {showMap && loadedRoute && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Map className="h-6 w-6 mr-2 text-blue-600" />
                  ルートマップ
                </h2>
                <RouteMap
                  stops={routeStops.map((stop) => ({
                    name: stop.name || '',
                    address: stop.address || '',
                    latitude: stop.latitude ? Number(stop.latitude) : null,
                    longitude: stop.longitude ? Number(stop.longitude) : null,
                    notes: stop.notes || undefined,
                  }))}
                />
                {routeStops.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      このルートにはスポットが登録されていません。地図を表示するには、スポットを追加してください。
                    </p>
                  </div>
                )}
              </div>
            )}

            {user && myRoutes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                  onClick={() => setShowMyRoutes(!showMyRoutes)}
                  className="w-full flex items-center justify-between text-xl font-bold text-gray-800 mb-4"
                >
                  <span className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    マイルート ({myRoutes.length})
                  </span>
                  <span className="text-2xl">{showMyRoutes ? '−' : '+'}</span>
                </button>

                {showMyRoutes && (
                  <div className="space-y-3">
                    {myRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800">
                                {route.name}
                              </h4>
                              {route.is_public ? (
                                <span className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  <Globe className="h-3 w-3 mr-1" />
                                  公開
                                </span>
                              ) : (
                                <span className="flex items-center text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                  <Lock className="h-3 w-3 mr-1" />
                                  非公開
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {route.origin} → {route.destination}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadRoute(route.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            読込
                          </button>
                          <button
                            onClick={() => toggleRoutePublic(route.id, route.is_public)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition flex items-center"
                          >
                            {route.is_public ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                非公開
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                公開
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRouteToDelete(route.id);
                              setShowDeleteModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {publicRoutes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                  onClick={() => setShowPublicRoutes(!showPublicRoutes)}
                  className="w-full flex items-center justify-between text-xl font-bold text-gray-800 mb-4"
                >
                  <span className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-blue-600" />
                    みんなのルート ({publicRoutes.length})
                  </span>
                  <span className="text-2xl">{showPublicRoutes ? '−' : '+'}</span>
                </button>

                {showPublicRoutes && (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {publicRoutes.map((route: any) => (
                      <div
                        key={route.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">
                              {route.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1">
                              {route.origin} → {route.destination}
                            </p>
                            {route.users && (
                              <p className="text-xs text-gray-500">
                                作成者: {route.users.first_name || ''} {route.users.last_name || ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => loadRoute(route.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          このルートを見る
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
