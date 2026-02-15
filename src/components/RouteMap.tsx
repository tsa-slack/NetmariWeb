import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PointMarker {
  name: string;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  notes?: string;
}

interface RouteMapProps {
  stops: PointMarker[];
  origin?: { name: string; latitude: number | null; longitude: number | null } | null;
  destination?: { name: string; latitude: number | null; longitude: number | null } | null;
  nearbySpots?: Array<{
    name: string;
    latitude: number | null;
    longitude: number | null;
    type: 'partner' | 'event';
    distance_km?: number;
  }>;
}

const createNumberIcon = (number: number, color: string = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createLabelIcon = (label: string, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        padding: 4px 10px;
        border-radius: 16px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
  });
};

const createSmallIcon = (emoji: string, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

/**
 * マップの表示範囲を自動調整するコンポーネント
 * 全マーカーが収まるように fitBounds を使用
 */
function MapController({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    // 初回マウント後にサイズを再計算
    const timer = setTimeout(() => {
      map.invalidateSize();

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 14,
        });
      }
    }, 150);

    // ウィンドウリサイズ時にも再計算
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, points]);

  return null;
}

export default function RouteMap({
  stops,
  origin,
  destination,
  nearbySpots = [],
}: RouteMapProps) {
  const defaultCenter: [number, number] = [36.2048, 138.2529];

  const validStops = stops.filter(
    (stop) => stop.latitude !== null && stop.longitude !== null
  );

  // 全ポイント（出発地・目的地・経由地）の座標を集約
  const allPoints: Array<[number, number]> = [];

  if (origin?.latitude && origin?.longitude) {
    allPoints.push([origin.latitude, origin.longitude]);
  }

  validStops.forEach((stop) => {
    allPoints.push([stop.latitude!, stop.longitude!]);
  });

  if (destination?.latitude && destination?.longitude) {
    allPoints.push([destination.latitude, destination.longitude]);
  }

  const center: [number, number] =
    allPoints.length > 0
      ? [
          allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length,
          allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length,
        ]
      : defaultCenter;

  const hasAnyMarkers = allPoints.length > 0 || nearbySpots.some((s) => s.latitude && s.longitude);

  return (
    <div className="w-full h-[350px] sm:h-[450px] md:h-[600px] rounded-lg overflow-hidden shadow-lg">
      {hasAnyMarkers ? (
        <MapContainer
          center={center}
          zoom={6}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <MapController points={allPoints} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 出発地マーカー */}
          {origin?.latitude && origin?.longitude && (
            <Marker
              position={[origin.latitude, origin.longitude]}
              icon={createLabelIcon('出発', '#16a34a')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-green-700 mb-1">🚗 出発地</h3>
                  <p className="text-sm text-gray-700">{origin.name}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 経由地マーカー */}
          {validStops.map((stop, index) => (
            <Marker
              key={`stop-${index}`}
              position={[stop.latitude!, stop.longitude!]}
              icon={createNumberIcon(index + 1)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-gray-800 mb-1">{stop.name}</h3>
                  {stop.address && (
                    <p className="text-sm text-gray-600 mb-1">{stop.address}</p>
                  )}
                  {stop.notes && (
                    <p className="text-sm text-gray-700 italic">{stop.notes}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 目的地マーカー */}
          {destination?.latitude && destination?.longitude && (
            <Marker
              position={[destination.latitude, destination.longitude]}
              icon={createLabelIcon('目的地', '#dc2626')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-red-700 mb-1">🏁 目的地</h3>
                  <p className="text-sm text-gray-700">{destination.name}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 周辺スポットマーカー */}
          {nearbySpots
            .filter((s) => s.latitude && s.longitude)
            .map((spot, index) => (
              <Marker
                key={`nearby-${index}`}
                position={[spot.latitude!, spot.longitude!]}
                icon={createSmallIcon(
                  spot.type === 'partner' ? '🏪' : '📅',
                  spot.type === 'partner' ? '#f97316' : '#8b5cf6'
                )}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-gray-800 mb-1">{spot.name}</h3>
                    <p className="text-xs text-gray-500">
                      {spot.type === 'partner' ? '協力店' : 'イベント'}
                      {spot.distance_km ? ` (約${spot.distance_km}km)` : ''}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ルートライン（出発地→経由地→目的地） */}
          {allPoints.length > 1 && (
            <Polyline
              positions={allPoints}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
              dashArray="10, 5"
            />
          )}
        </MapContainer>
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">地図を表示できません</p>
            <p className="text-sm">
              出発地・目的地を設定するか、位置情報を持つスポットを追加してください
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
