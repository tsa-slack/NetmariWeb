import { Map } from 'lucide-react';
import RouteMap from '../RouteMap';
import type { Database } from '../../lib/database.types';

type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteMapSectionProps {
  routeStops: RouteStop[];
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

export default function RouteMapSection({
  routeStops,
  origin,
  destination,
  nearbySpots = [],
}: RouteMapSectionProps) {
  const hasOriginOrDest =
    (origin?.latitude && origin?.longitude) ||
    (destination?.latitude && destination?.longitude);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <Map className="h-6 w-6 mr-2 text-blue-600" />
        ルートマップ
      </h2>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> 出発地
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 経由地
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> 目的地
        </span>
        {nearbySpots.length > 0 && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> 協力店
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> イベント
            </span>
          </>
        )}
      </div>

      <RouteMap
        stops={routeStops.map((stop) => ({
          name: stop.name || '',
          address: stop.address || '',
          latitude: stop.latitude ? Number(stop.latitude) : null,
          longitude: stop.longitude ? Number(stop.longitude) : null,
          notes: stop.notes || undefined,
        }))}
        origin={origin}
        destination={destination}
        nearbySpots={nearbySpots}
      />

      {routeStops.length === 0 && !hasOriginOrDest && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            このルートにはスポットが登録されていません。出発地・目的地を設定するか、スポットを追加してください。
          </p>
        </div>
      )}
    </div>
  );
}
