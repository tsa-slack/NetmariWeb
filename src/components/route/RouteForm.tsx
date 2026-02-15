import { useCallback } from 'react';
import {
  Globe,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import PlaceAutocomplete from '../PlaceAutocomplete';

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
  onSave?: () => void;
  saving?: boolean;
  isLoggedIn: boolean;
  onOriginCoords?: (lat: number, lng: number) => void;
  onDestCoords?: (lat: number, lng: number) => void;
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
  isLoggedIn,
  onOriginCoords,
  onDestCoords,
}: RouteFormProps) {
  const handleOriginSelect = useCallback(
    (place: { name: string; address: string; latitude: number; longitude: number }) => {
      onOriginChange(place.address || place.name);
      onOriginCoords?.(place.latitude, place.longitude);
    },
    [onOriginChange, onOriginCoords]
  );

  const handleDestSelect = useCallback(
    (place: { name: string; address: string; latitude: number; longitude: number }) => {
      onDestinationChange(place.address || place.name);
      onDestCoords?.(place.latitude, place.longitude);
    },
    [onDestinationChange, onDestCoords]
  );

  return (
    <div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ルート名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => onRouteNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例: 東京から箱根への旅"
            required
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <Globe className="h-4 w-4 text-blue-600" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {isPublic ? 'みんなに公開' : '非公開（自分だけ）'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onIsPublicChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer peer-checked:bg-blue-600 transition-all">
              <div
                className={`absolute top-[2px] ${isPublic ? 'left-[22px]' : 'left-[2px]'} bg-white w-5 h-5 rounded-full transition-all shadow-sm`}
              />
            </div>
          </label>
        </div>

        <div>
          <PlaceAutocomplete
            label="出発地"
            placeholder="例: 東京駅、渋谷駅など"
            defaultValue={origin}
            onPlaceSelect={handleOriginSelect}
            onTextChange={onOriginChange}
            id="route-origin"
          />
        </div>

        <div>
          <PlaceAutocomplete
            label="目的地"
            placeholder="例: 箱根湯本駅、富士山など"
            defaultValue={destination}
            onPlaceSelect={handleDestSelect}
            onTextChange={onDestinationChange}
            id="route-destination"
          />
        </div>

        {/* プライバシー注意書き */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-0.5">個人情報にご注意ください</p>
            <p>出発地・目的地には個人宅の住所を入力しないでください。駅名・施設名・地域名などをご利用ください。公開ルートでは他のユーザーにも表示されます。</p>
          </div>
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

      {!isLoggedIn && (
        <p className="mt-6 text-center text-sm text-gray-600">
          ルートを保存するにはログインが必要です
        </p>
      )}
    </div>
  );
}
