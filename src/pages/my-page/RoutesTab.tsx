import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Plus, Eye, EyeOff, Edit, Trash2, Route } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/ConfirmModal';
import type { UserRoute } from './types';
import { logger } from '../../lib/logger';

interface RoutesTabProps {
  myRoutes: UserRoute[];
  setMyRoutes: React.Dispatch<React.SetStateAction<UserRoute[]>>;
  routesLoading: boolean;
}

export default function RoutesTab({ myRoutes, setMyRoutes, routesLoading }: RoutesTabProps) {
  const [showDeleteRouteModal, setShowDeleteRouteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const toggleRoutePublish = async (routeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('routes')
        .update({ is_public: !currentStatus })
        .eq('id', routeId);
      if (error) throw error;
      setMyRoutes((prev) =>
        prev.map((route) => route.id === routeId ? { ...route, is_public: !currentStatus } : route)
      );
      toast.success(!currentStatus ? 'ルートを公開しました' : 'ルートを非公開にしました');
    } catch (error) {
      logger.error('Error toggling route publish status:', error);
      toast.error('公開状態の変更に失敗しました');
    }
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;
    try {
      const { error } = await supabase.from('routes').delete().eq('id', routeToDelete);
      if (error) throw error;
      setMyRoutes((prev) => prev.filter((route) => route.id !== routeToDelete));
      toast.success('ルートを削除しました');
    } catch (error) {
      logger.error('Error deleting route:', error);
      toast.error('ルートの削除に失敗しました');
    } finally {
      setShowDeleteRouteModal(false);
      setRouteToDelete(null);
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">マイルート</h2>
          <Link
            to="/routes"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4 mr-2" />
            新しいルートを作成
          </Link>
        </div>

        {routesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : myRoutes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow">
            <Route className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">まだルートがありません</p>
            <Link
              to="/routes"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ルートを作成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{route.name}</h3>
                      {route.is_public ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">公開中</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">非公開</span>
                      )}
                    </div>
                    {route.description && <p className="text-gray-600 mb-3">{route.description}</p>}
                  </div>
                  <div className="ml-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Route className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">出発地</p>
                      <p className="text-sm font-medium text-gray-800">{route.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">目的地</p>
                      <p className="text-sm font-medium text-gray-800">{route.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>作成日: {new Date(route.created_at || '').toLocaleDateString('ja-JP')}</span>
                  </div>
                  {route.updated_at && route.updated_at !== route.created_at && (
                    <div className="flex items-center">
                      <Edit className="h-4 w-4 mr-1" />
                      <span>更新日: {new Date(route.updated_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Link
                    to={`/routes?load=${route.id}`}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    表示・編集
                  </Link>
                  <button
                    onClick={() => toggleRoutePublish(route.id, route.is_public || false)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    {route.is_public ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {route.is_public ? '非公開にする' : '公開する'}
                  </button>
                  <button
                    onClick={() => { setRouteToDelete(route.id); setShowDeleteRouteModal(true); }}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showDeleteRouteModal}
        onClose={() => { setShowDeleteRouteModal(false); setRouteToDelete(null); }}
        onConfirm={handleDeleteRoute}
        title="ルートを削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </>
  );
}
