import {
  Map,
  MapPin,
  Navigation,
  Save,
  Globe,
  Lock,
} from 'lucide-react';

interface RouteFormProps {
  routeName: string;
  onRouteNameChange: (value: string) => void;
  routeDescription: string;
  onRouteDescriptionChange: (value: string) => void;
  origin: string;
  onOriginChange: (value: string) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  isLoggedIn: boolean;
}

export default function RouteForm({
  routeName,
  onRouteNameChange,
  routeDescription,
  onRouteDescriptionChange,
  origin,
  onOriginChange,
  destination,
  onDestinationChange,
  isPublic,
  onIsPublicChange,
  onSave,
  saving,
  isLoggedIn,
}: RouteFormProps) {
  return (
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
            onChange={(e) => onRouteNameChange(e.target.value)}
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
              onChange={(e) => onIsPublicChange(e.target.checked)}
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
            onChange={(e) => onOriginChange(e.target.value)}
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
            onChange={(e) => onDestinationChange(e.target.value)}
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
            onChange={(e) => onRouteDescriptionChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例: 温泉と美術館を巡る旅"
            rows={3}
          />
        </div>
      </div>

      {isLoggedIn && (
        <button
          onClick={onSave}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? '保存中...' : 'ルートを保存'}
        </button>
      )}

      {!isLoggedIn && (
        <p className="mt-6 text-center text-sm text-gray-600">
          ルートを保存するにはログインが必要です
        </p>
      )}
    </div>
  );
}
