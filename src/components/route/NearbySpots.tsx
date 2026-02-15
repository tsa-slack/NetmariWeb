import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  Plus,
  Navigation,
  Store,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRepository, RouteRepository } from '../../lib/data-access';
import { logger } from '../../lib/logger';
import type { Database } from '../../lib/database.types';

type Partner = Database['public']['Tables']['partners']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface NearbyPartner extends Partner {
  distance_km: number;
}

interface NearbyEvent extends Event {
  distance_km: number;
}

interface NearbySpotsProps {
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  onAddToRoute: (spot: {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    notes: string;
    partner_id?: string | null;
  }) => void;
}

/** Haversine距離計算 (km) */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** スポットの基準点情報 */
interface SpotWithRef {
  refLabel: string;      // 「出発地」「目的地」「ルート中間地点」
  refDistance: number;    // 最寄り基準点からの距離
}

function calcRef(
  spotLat: number | null,
  spotLng: number | null,
  originLat: number | null,
  originLng: number | null,
  destLat: number | null,
  destLng: number | null,
): SpotWithRef {
  if (!spotLat || !spotLng) {
    return { refLabel: 'ルート中間地点', refDistance: 0 };
  }

  const dists: { label: string; km: number }[] = [];

  if (originLat && originLng) {
    dists.push({ label: '出発地', km: haversineKm(spotLat, spotLng, originLat, originLng) });
  }
  if (destLat && destLng) {
    dists.push({ label: '目的地', km: haversineKm(spotLat, spotLng, destLat, destLng) });
  }

  if (dists.length === 0) {
    return { refLabel: 'ルート中間地点', refDistance: 0 };
  }

  // 最も近い基準点を選択
  dists.sort((a, b) => a.km - b.km);
  return {
    refLabel: dists[0].label,
    refDistance: Math.round(dists[0].km * 10) / 10,
  };
}

export default function NearbySpots({
  originLat,
  originLng,
  destLat,
  destLng,
  onAddToRoute,
}: NearbySpotsProps) {
  const routeRepo = useRepository(RouteRepository);
  const [partners, setPartners] = useState<NearbyPartner[]>([]);
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPartners, setShowPartners] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // ルートの中間点を計算
  const midLat = originLat && destLat ? (originLat + destLat) / 2 : null;
  const midLng = originLng && destLng ? (originLng + destLng) / 2 : null;

  // ルートの対角距離からの検索半径
  const searchRadius = (() => {
    if (!originLat || !originLng || !destLat || !destLng) return 50;
    const dLat = Math.abs(destLat - originLat);
    const dLng = Math.abs(destLng - originLng);
    const diagonal = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    return Math.max(30, Math.min(diagonal * 0.7, 200));
  })();

  useEffect(() => {
    if (!midLat || !midLng) {
      setPartners([]);
      setEvents([]);
      return;
    }

    const loadNearbySpots = async () => {
      setLoading(true);
      try {
        const [partnerResult, eventResult] = await Promise.all([
          routeRepo.findNearbyPartners(midLat, midLng, searchRadius),
          routeRepo.findNearbyEvents(midLat, midLng, searchRadius),
        ]);

        if (partnerResult.success) {
          setPartners(partnerResult.data as NearbyPartner[]);
        }
        if (eventResult.success) {
          setEvents(eventResult.data as NearbyEvent[]);
        }
      } catch (error) {
        logger.error('Error loading nearby spots:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNearbySpots();
  }, [midLat, midLng, searchRadius]);

  // 協力店を基準点ごとにグループ化
  const groupedPartners = useMemo(() => {
    const originGroup: (NearbyPartner & SpotWithRef)[] = [];
    const destGroup: (NearbyPartner & SpotWithRef)[] = [];
    const otherGroup: (NearbyPartner & SpotWithRef)[] = [];

    partners.forEach((p) => {
      const ref = calcRef(p.latitude, p.longitude, originLat, originLng, destLat, destLng);
      const item = { ...p, ...ref };
      if (ref.refLabel === '出発地') originGroup.push(item);
      else if (ref.refLabel === '目的地') destGroup.push(item);
      else otherGroup.push(item);
    });

    // 各グループ内で近い順
    originGroup.sort((a, b) => a.refDistance - b.refDistance);
    destGroup.sort((a, b) => a.refDistance - b.refDistance);
    otherGroup.sort((a, b) => a.refDistance - b.refDistance);

    const groups: { label: string; items: (NearbyPartner & SpotWithRef)[] }[] = [];
    if (originGroup.length > 0) groups.push({ label: '🚗 出発地の周辺', items: originGroup });
    if (destGroup.length > 0) groups.push({ label: '🏁 目的地の周辺', items: destGroup });
    if (otherGroup.length > 0) groups.push({ label: '📍 その他', items: otherGroup });
    return groups;
  }, [partners, originLat, originLng, destLat, destLng]);

  // イベントも同様にグループ化
  const groupedEvents = useMemo(() => {
    const originGroup: (NearbyEvent & SpotWithRef)[] = [];
    const destGroup: (NearbyEvent & SpotWithRef)[] = [];
    const otherGroup: (NearbyEvent & SpotWithRef)[] = [];

    events.forEach((e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lat = (e as any).latitude || null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lng = (e as any).longitude || null;
      const ref = calcRef(lat, lng, originLat, originLng, destLat, destLng);
      const item = { ...e, ...ref };
      if (ref.refLabel === '出発地') originGroup.push(item);
      else if (ref.refLabel === '目的地') destGroup.push(item);
      else otherGroup.push(item);
    });

    originGroup.sort((a, b) => a.refDistance - b.refDistance);
    destGroup.sort((a, b) => a.refDistance - b.refDistance);
    otherGroup.sort((a, b) => a.refDistance - b.refDistance);

    const groups: { label: string; items: (NearbyEvent & SpotWithRef)[] }[] = [];
    if (originGroup.length > 0) groups.push({ label: '🚗 出発地の周辺', items: originGroup });
    if (destGroup.length > 0) groups.push({ label: '🏁 目的地の周辺', items: destGroup });
    if (otherGroup.length > 0) groups.push({ label: '📍 その他', items: otherGroup });
    return groups;
  }, [events, originLat, originLng, destLat, destLng]);

  const handleAddPartner = (partner: NearbyPartner, ref: SpotWithRef) => {
    onAddToRoute({
      name: partner.name,
      address: partner.address || '',
      latitude: partner.latitude,
      longitude: partner.longitude,
      notes: `協力店 (${ref.refLabel}から${ref.refDistance}km)`,
      partner_id: partner.id,
    });
    setAddedIds((prev) => new Set(prev).add(partner.id));
  };

  const handleAddEvent = (event: NearbyEvent, ref: SpotWithRef) => {
    onAddToRoute({
      name: event.title,
      address: event.location || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latitude: (event as any).latitude || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      longitude: (event as any).longitude || null,
      notes: `イベント (${ref.refLabel}から${ref.refDistance}km) ${event.event_date ? new Date(event.event_date).toLocaleDateString('ja-JP') : ''}`,
    });
    setAddedIds((prev) => new Set(prev).add(event.id));
  };

  // 座標が未設定の場合
  if (!midLat || !midLng) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-700 flex items-center mb-3">
          <Navigation className="h-5 w-5 mr-2 text-cyan-600" />
          道中のスポット
        </h3>
        <div className="text-center py-4 text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">出発地と目的地を設定すると、道中のスポットが表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-700 flex items-center">
          <Navigation className="h-5 w-5 mr-2 text-cyan-600" />
          道中のスポット
        </h3>
        <span className="text-xs text-gray-400">
          検索範囲: 約{Math.round(searchRadius)}km
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          検索中...
        </div>
      ) : (
        <>
          {/* 協力店セクション */}
          <div className="bg-orange-50/50 rounded-xl border border-orange-100">
            <button
              onClick={() => setShowPartners(!showPartners)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-100/50 rounded-xl transition"
            >
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-orange-500" />
                協力店 ({partners.length})
              </span>
              {showPartners ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showPartners && (
              <div className="px-4 pb-4">
                {partners.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">周辺に協力店が見つかりませんでした</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {groupedPartners.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 mt-1">{group.label}</p>
                        <div className="space-y-1.5">
                          {group.items.map((partner) => (
                            <div
                              key={partner.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-orange-100 hover:shadow-sm transition"
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <h4 className="font-medium text-gray-800 text-sm truncate">
                                  {partner.name}
                                </h4>
                                {partner.address && (
                                  <p className="text-xs text-gray-400 truncate">{partner.address}</p>
                                )}
                                <p className="text-xs text-orange-600 font-medium mt-0.5">
                                  {partner.refLabel}から約{partner.refDistance}km
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddPartner(partner, partner)}
                                disabled={addedIds.has(partner.id)}
                                className="flex-shrink-0 px-2.5 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition flex items-center"
                              >
                                {addedIds.has(partner.id) ? (
                                  '✓ 追加済'
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-0.5" />
                                    追加
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* イベントセクション */}
          <div className="bg-purple-50/50 rounded-xl border border-purple-100">
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-100/50 rounded-xl transition"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                イベント ({events.length})
              </span>
              {showEvents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showEvents && (
              <div className="px-4 pb-4">
                {events.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">周辺に今後のイベントが見つかりませんでした</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {groupedEvents.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 mt-1">{group.label}</p>
                        <div className="space-y-1.5">
                          {group.items.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-100 hover:shadow-sm transition"
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <h4 className="font-medium text-gray-800 text-sm truncate">
                                  {event.title}
                                </h4>
                                {event.location && (
                                  <p className="text-xs text-gray-400 truncate">{event.location}</p>
                                )}
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-purple-600 font-medium">
                                    {event.refLabel}から約{event.refDistance}km
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    📅 {event.event_date ? new Date(event.event_date).toLocaleDateString('ja-JP') : '未定'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddEvent(event, event)}
                                disabled={addedIds.has(event.id)}
                                className="flex-shrink-0 px-2.5 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500 transition flex items-center"
                              >
                                {addedIds.has(event.id) ? (
                                  '✓ 追加済'
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-0.5" />
                                    追加
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {partners.length === 0 && events.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">周辺にスポットやイベントが見つかりませんでした</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
