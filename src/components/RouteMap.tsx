import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  stops: Array<{
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    notes?: string;
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

export default function RouteMap({ stops }: RouteMapProps) {
  const defaultCenter: [number, number] = [36.2048, 138.2529];
  const defaultZoom = 6;

  console.log('RouteMap received stops:', stops);

  const validStops = stops.filter(
    (stop) => stop.latitude !== null && stop.longitude !== null
  );

  console.log('Valid stops for map:', validStops);

  const allPoints: Array<[number, number]> = validStops.map((stop) => [
    stop.latitude!,
    stop.longitude!,
  ]);

  const center: [number, number] =
    allPoints.length > 0
      ? [
          allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length,
          allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length,
        ]
      : defaultCenter;

  const calculateZoom = () => {
    if (allPoints.length === 0) return defaultZoom;
    if (allPoints.length === 1) return 12;

    const lats = allPoints.map((p) => p[0]);
    const lngs = allPoints.map((p) => p[1]);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    if (maxRange < 0.01) return 14;
    if (maxRange < 0.05) return 12;
    if (maxRange < 0.2) return 10;
    if (maxRange < 1) return 8;
    if (maxRange < 5) return 7;
    return 6;
  };

  const zoom = calculateZoom();

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      {validStops.length > 0 ? (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validStops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.latitude!, stop.longitude!]}
              icon={createNumberIcon(index + 1)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-gray-800 mb-1">{stop.name}</h3>
                  {stop.address && (
                    <p className="text-sm text-gray-600 mb-2">{stop.address}</p>
                  )}
                  {stop.notes && (
                    <p className="text-sm text-gray-700 italic">{stop.notes}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

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
              位置情報を持つスポットを追加してください
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
