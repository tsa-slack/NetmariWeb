import {
  Eye,
  EyeOff,
  Globe,
  Lock,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Route = Database['public']['Tables']['routes']['Row'];

interface RouteListProps {
  myRoutes: Route[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicRoutes: any[];
  showMyRoutes: boolean;
  onToggleMyRoutes: () => void;
  showPublicRoutes: boolean;
  onTogglePublicRoutes: () => void;
  isLoggedIn: boolean;
  onLoadRoute: (routeId: string) => void;
  onTogglePublic: (routeId: string, currentIsPublic: boolean) => void;
  onDeleteRoute: (routeId: string) => void;
}

export default function RouteList({
  myRoutes,
  publicRoutes,
  showMyRoutes,
  onToggleMyRoutes,
  showPublicRoutes,
  onTogglePublicRoutes,
  isLoggedIn,
  onLoadRoute,
  onTogglePublic,
  onDeleteRoute,
}: RouteListProps) {
  return (
    <>
      {isLoggedIn && myRoutes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={onToggleMyRoutes}
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onLoadRoute(route.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      読込
                    </button>
                    <button
                      onClick={() => onTogglePublic(route.id, route.is_public ?? false)}
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
                      onClick={() => onDeleteRoute(route.id)}
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
            onClick={onTogglePublicRoutes}
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
                    onClick={() => onLoadRoute(route.id)}
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
    </>
  );
}
