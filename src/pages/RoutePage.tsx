import { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Users,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Save,
} from 'lucide-react';

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
import RouteStopsEditor, { LocalStop, routeStopToLocal } from '../components/route/RouteStopsEditor';
import NearbySpots from '../components/route/NearbySpots';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

type TabId = 'public' | 'register' | 'myroutes';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  requiresAuth?: boolean;
}

// ルート登録のステップ
type RegisterStep = 1 | 2 | 3;

export default function RoutePage() {
  const { user } = useAuth();
  const routeRepo = useRepository(RouteRepository);
  const [activeTab, setActiveTab] = useState<TabId>('public');
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
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
  const [localStops, setLocalStops] = useState<LocalStop[]>([]);
  const [loadedRoute, setLoadedRoute] = useState<Route | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  // 座標管理
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);

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
      setRegisterStep(1);
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      setMessage('出発地と目的地を入力してください');
      setRegisterStep(1);
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
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
      };

      let savedRouteId: string;

      if (loadedRoute) {
        const result = await routeRepo.update(loadedRoute.id, routeData);
        if (!result.success) {
          logger.error('Route update error:', result.error);
          throw result.error;
        }
        savedRouteId = loadedRoute.id;
      } else {
        const result = await routeRepo.create({
          user_id: user.id,
          ...routeData,
        });
        if (!result.success) {
          logger.error('Route error:', result.error);
          throw result.error;
        }
        savedRouteId = result.data.id;
      }

      await saveStops(savedRouteId);

      setMessage(`ルートを${loadedRoute ? '更新' : '保存'}しました ${isPublic ? '（公開）' : '（非公開）'}`);
      resetForm();
      loadMyRoutes();
      loadPublicRoutes();
      setActiveTab('myroutes');
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

  const saveStops = async (routeId: string) => {
    if (loadedRoute) {
      for (const stop of routeStops) {
        const delResult = await routeRepo.deleteStop(stop.id);
        if (!delResult.success) {
          logger.error('Failed to delete stop:', delResult.error);
        }
      }
    }
    for (let i = 0; i < localStops.length; i++) {
      const stop = localStops[i];
      const result = await routeRepo.addStop({
        route_id: routeId,
        stop_order: i + 1,
        name: stop.name || null,
        address: stop.address || null,
        latitude: stop.latitude,
        longitude: stop.longitude,
        notes: stop.notes || null,
        partner_id: stop.partner_id || null,
      });
      if (!result.success) {
        logger.error(`Failed to save stop ${i + 1}:`, result.error);
        throw new Error(`経由地「${stop.name}」の保存に失敗しました`);
      }
    }
  };

  const resetForm = () => {
    setRouteName('');
    setRouteDescription('');
    setOrigin('');
    setDestination('');
    setIsPublic(false);
    setLoadedRoute(null);
    setRouteStops([]);
    setLocalStops([]);
    setOriginLat(null);
    setOriginLng(null);
    setDestLat(null);
    setDestLng(null);
    setRegisterStep(1);
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
      const stopsResult = await routeRepo.findStopsByRoute(routeId);
      const stops = stopsResult.success ? (stopsResult.data as unknown as RouteStop[]) : [];

      setRouteName(route.name);
      setRouteDescription(route.description || '');
      setOrigin(route.origin || '');
      setDestination(route.destination || '');
      setIsPublic(route.is_public || false);
      setOriginLat(route.origin_lat || null);
      setOriginLng(route.origin_lng || null);
      setDestLat(route.dest_lat || null);
      setDestLng(route.dest_lng || null);
      setLoadedRoute(route);
      setRouteStops(stops);
      setLocalStops(stops.map((s, i) => routeStopToLocal(s, i)));
      setShowMyRoutes(false);

      window.history.replaceState({}, '', '/routes');
      setActiveTab('register');
      setRegisterStep(3); // マップ確認ステップ

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

  const handleOriginCoords = useCallback((lat: number, lng: number) => {
    setOriginLat(lat);
    setOriginLng(lng);
  }, []);

  const handleDestCoords = useCallback((lat: number, lng: number) => {
    setDestLat(lat);
    setDestLng(lng);
  }, []);

  const handleAddStop = useCallback((stop: Omit<LocalStop, 'stop_order'>) => {
    setLocalStops((prev) => [
      ...prev,
      { ...stop, stop_order: prev.length + 1, isNew: true },
    ]);
  }, []);

  const handleRemoveStop = useCallback((index: number) => {
    setLocalStops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMoveStop = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0) return;
    setLocalStops((prev) => {
      if (toIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((s, i) => ({ ...s, stop_order: i + 1 }));
    });
  }, []);

  const handleAddFromNearby = useCallback(
    (spot: {
      name: string;
      address: string;
      latitude: number | null;
      longitude: number | null;
      notes: string;
      partner_id?: string | null;
    }) => {
      setLocalStops((prev) => [
        ...prev,
        { ...spot, stop_order: prev.length + 1, isNew: true },
      ]);
      setMessage(`「${spot.name}」を経由地に追加しました`);
      setTimeout(() => setMessage(''), 3000);
    },
    []
  );

  const mapRouteStops: RouteStop[] = localStops.map((s, i) => ({
    id: s.id || `local-${i}`,
    route_id: loadedRoute?.id || '',
    partner_id: s.partner_id || null,
    stop_order: i + 1,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    notes: s.notes,
  }));

  // ステップ1の完了チェック
  const isStep1Valid = routeName.trim() && origin.trim() && destination.trim();

  // タブ定義
  const tabs: Tab[] = [
    {
      id: 'public',
      label: 'みんなのルート',
      icon: <Users className="h-4 w-4" />,
      badge: publicRoutes.length > 0 ? publicRoutes.length : undefined,
    },
    {
      id: 'register',
      label: 'ルート登録',
      icon: <PlusCircle className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      id: 'myroutes',
      label: '登録済みルート',
      icon: <FolderOpen className="h-4 w-4" />,
      badge: myRoutes.length > 0 ? myRoutes.length : undefined,
      requiresAuth: true,
    },
  ];

  // ステップインジケーター
  const stepLabels = [
    { step: 1, label: 'ルート設定' },
    { step: 2, label: '経由地・スポット' },
    { step: 3, label: '確認・保存' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">寄り道ルート</h1>
          <p className="text-base md:text-lg text-gray-600">
            車中泊の目的地へ向かう道中で楽しめるスポットを発見・共有しよう
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center text-sm">
            {message}
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs
              .filter((tab) => !tab.requiresAuth || user)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 md:px-6 py-3.5 text-sm font-medium
                    whitespace-nowrap transition-all duration-200 relative flex-1
                    ${activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`
                      ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
          </div>

          {/* タブコンテンツ */}
          <div className="p-4 md:p-6">

            {/* ===== みんなのルートタブ ===== */}
            {activeTab === 'public' && (
              <div>
                {publicRoutes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-1">公開ルートはまだありません</p>
                    <p className="text-sm">ルートを登録して公開すると、ここに表示されます</p>
                  </div>
                ) : (
                  <RouteList
                    myRoutes={[]}
                    publicRoutes={publicRoutes}
                    showMyRoutes={false}
                    onToggleMyRoutes={() => {}}
                    showPublicRoutes={showPublicRoutes}
                    onTogglePublicRoutes={() => setShowPublicRoutes(!showPublicRoutes)}
                    isLoggedIn={!!user}
                    onLoadRoute={(routeId) => loadRoute(routeId)}
                    onTogglePublic={toggleRoutePublic}
                    onDeleteRoute={(routeId) => {
                      setRouteToDelete(routeId);
                      setShowDeleteModal(true);
                    }}
                  />
                )}
              </div>
            )}

            {/* ===== ルート登録タブ ===== */}
            {activeTab === 'register' && user && (
              <div>
                {/* ステップインジケーター */}
                <div className="flex items-center justify-center mb-6">
                  {stepLabels.map(({ step, label }, i) => (
                    <div key={step} className="flex items-center">
                      <button
                        onClick={() => {
                          if (step === 1 || (step === 2 && isStep1Valid) || (step === 3 && isStep1Valid)) {
                            setRegisterStep(step as RegisterStep);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition
                          ${registerStep === step
                            ? 'bg-blue-600 text-white shadow-sm'
                            : registerStep > step
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400'
                          }
                        `}
                      >
                        <span className={`
                          w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                          ${registerStep === step
                            ? 'bg-white text-blue-600'
                            : registerStep > step
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-white'
                          }
                        `}>
                          {registerStep > step ? '✓' : step}
                        </span>
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                      {i < stepLabels.length - 1 && (
                        <ChevronRight className="h-4 w-4 mx-1 text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>

                {/* ===== Step 1: ルート設定 ===== */}
                {registerStep === 1 && (
                  <div className="max-w-2xl mx-auto">
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
                      onOriginCoords={handleOriginCoords}
                      onDestCoords={handleDestCoords}
                    />

                    {/* 次へボタン */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setRegisterStep(2)}
                        disabled={!isStep1Valid}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition font-medium text-sm"
                      >
                        経由地・スポット追加へ
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ===== Step 2: 経由地・スポット ===== */}
                {registerStep === 2 && (
                  <div className="space-y-6">
                    <RouteStopsEditor
                      stops={localStops}
                      onStopsChange={setLocalStops}
                      onAddStop={handleAddStop}
                      onRemoveStop={handleRemoveStop}
                      onMoveStop={handleMoveStop}
                      disabled={!user}
                    />

                    <NearbySpots
                      originLat={originLat}
                      originLng={originLng}
                      destLat={destLat}
                      destLng={destLng}
                      onAddToRoute={handleAddFromNearby}
                    />

                    {/* ナビゲーションボタン */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => setRegisterStep(1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        ルート設定に戻る
                      </button>
                      <button
                        onClick={() => setRegisterStep(3)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                      >
                        確認・保存へ
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ===== Step 3: 確認・保存 ===== */}
                {registerStep === 3 && (
                  <div className="space-y-6">
                    {/* マップ表示 */}
                    {((originLat && originLng) || (destLat && destLng) || localStops.length > 0) && (
                      <RouteMapSection
                        routeStops={mapRouteStops}
                        origin={
                          originLat && originLng
                            ? { name: origin, latitude: originLat, longitude: originLng }
                            : null
                        }
                        destination={
                          destLat && destLng
                            ? { name: destination, latitude: destLat, longitude: destLng }
                            : null
                        }
                      />
                    )}

                    {/* ルートサマリー */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">{routeName}</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="inline-block w-2 h-2 mt-1.5 bg-green-500 rounded-full flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">出発地</p>
                            <p className="text-sm font-medium text-gray-800">{origin || '未設定'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="inline-block w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">目的地</p>
                            <p className="text-sm font-medium text-gray-800">{destination || '未設定'}</p>
                          </div>
                        </div>
                      </div>

                      {routeDescription && (
                        <p className="text-sm text-gray-600 mb-3">{routeDescription}</p>
                      )}

                      {localStops.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">
                            経由地（{localStops.length}件）
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {localStops.map((stop, i) => (
                              <span
                                key={stop.id || i}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                              >
                                <span className="w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                                  {i + 1}
                                </span>
                                {stop.name || stop.address || `経由地${i + 1}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        {isPublic ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">公開</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">非公開</span>
                        )}
                      </div>
                    </div>

                    {/* ナビゲーション + 保存ボタン */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <button
                        onClick={() => setRegisterStep(2)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        経由地の編集に戻る
                      </button>
                      <button
                        onClick={saveRoute}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold text-sm shadow-md"
                      >
                        <Save className="h-5 w-5" />
                        {saving ? '保存中...' : loadedRoute ? 'ルートを更新' : 'ルートを保存'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ログインしていない場合のルート登録タブ */}
            {activeTab === 'register' && !user && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 text-center border border-blue-200">
                <PlusCircle className="h-12 w-12 mx-auto mb-4 text-blue-400" />
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

            {/* ===== 登録済みルートタブ ===== */}
            {activeTab === 'myroutes' && user && (
              <div>
                {myRoutes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-1">登録済みルートはまだありません</p>
                    <p className="text-sm mb-4">「ルート登録」タブから新しいルートを作成できます</p>
                    <button
                      onClick={() => { setActiveTab('register'); setRegisterStep(1); resetForm(); }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      ルートを登録する
                    </button>
                  </div>
                ) : (
                  <RouteList
                    myRoutes={myRoutes}
                    publicRoutes={[]}
                    showMyRoutes={showMyRoutes}
                    onToggleMyRoutes={() => setShowMyRoutes(!showMyRoutes)}
                    showPublicRoutes={false}
                    onTogglePublicRoutes={() => {}}
                    isLoggedIn={!!user}
                    onLoadRoute={(routeId) => loadRoute(routeId)}
                    onTogglePublic={toggleRoutePublic}
                    onDeleteRoute={(routeId) => {
                      setRouteToDelete(routeId);
                      setShowDeleteModal(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>
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
