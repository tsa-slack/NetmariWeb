import { Map } from 'lucide-react';
import RouteMap from '../RouteMap';
import type { Database } from '../../lib/database.types';

type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteMapSectionProps {
  routeStops: RouteStop[];
}

export default function RouteMapSection({ routeStops }: RouteMapSectionProps) {
  return (
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
  );
}
