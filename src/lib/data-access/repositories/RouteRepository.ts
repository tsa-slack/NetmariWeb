import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import { supabase } from '../../supabase';
import { logger } from '../../logger';

type RouteStop = Row<'route_stops'>;
type RouteStopInsert = {
    route_id: string;
    stop_order: number;
    name?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    partner_id?: string | null;
};
type RouteStopUpdate = Partial<Omit<RouteStopInsert, 'route_id'>>;

/**
 * ルートリポジトリ
 * routes + route_stops テーブルのCRUD操作を提供
 */
export class RouteRepository extends BaseRepository<'routes'> {
    constructor() {
        super('routes');
    }

    /**
     * ユーザーのルートを取得
     */
    async findByUser(userId: string): Promise<Result<Row<'routes'>[]>> {
        const query = new QueryBuilder<Row<'routes'>>(this.table)
            .whereEqual('user_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 公開ルートを取得
     */
    async findPublic(): Promise<Result<Row<'routes'>[]>> {
        const query = new QueryBuilder<Row<'routes'>>(this.table)
            .whereEqual('is_public', true)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    // =========================================================================
    // route_stops CRUD
    // =========================================================================

    /**
     * ルートの全経由地を stop_order 順で取得
     */
    async findStopsByRoute(routeId: string): Promise<Result<RouteStop[]>> {
        try {
            const { data, error } = await supabase
                .from('route_stops')
                .select('*')
                .eq('route_id', routeId)
                .order('stop_order', { ascending: true });

            if (error) throw error;
            return ResultHelper.success((data || []) as unknown as RouteStop[]);
        } catch (error) {
            logger.error('Error loading route stops:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('経由地の取得に失敗しました')
            );
        }
    }

    /**
     * 経由地を1件追加
     */
    async addStop(stop: RouteStopInsert): Promise<Result<RouteStop>> {
        try {
            const { data, error } = await supabase
                .from('route_stops')
                .insert(stop)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(data as unknown as RouteStop);
        } catch (error) {
            logger.error('Error adding route stop:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('経由地の追加に失敗しました')
            );
        }
    }

    /**
     * 経由地を更新
     */
    async updateStop(stopId: string, data: RouteStopUpdate): Promise<Result<RouteStop>> {
        try {
            const { data: updated, error } = await supabase
                .from('route_stops')
                .update(data)
                .eq('id', stopId)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(updated as unknown as RouteStop);
        } catch (error) {
            logger.error('Error updating route stop:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('経由地の更新に失敗しました')
            );
        }
    }

    /**
     * 経由地を削除
     */
    async deleteStop(stopId: string): Promise<Result<void>> {
        try {
            const { error } = await supabase
                .from('route_stops')
                .delete()
                .eq('id', stopId);

            if (error) throw error;
            return ResultHelper.success(undefined);
        } catch (error) {
            logger.error('Error deleting route stop:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('経由地の削除に失敗しました')
            );
        }
    }

    /**
     * 並べ替え — stop_order を一括更新
     */
    async reorderStops(routeId: string, stopIds: string[]): Promise<Result<void>> {
        try {
            const updates = stopIds.map((id, index) =>
                supabase
                    .from('route_stops')
                    .update({ stop_order: index + 1 })
                    .eq('id', id)
                    .eq('route_id', routeId)
            );

            const results = await Promise.all(updates);
            const firstError = results.find((r) => r.error);
            if (firstError?.error) throw firstError.error;

            return ResultHelper.success(undefined);
        } catch (error) {
            logger.error('Error reordering route stops:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('経由地の並べ替えに失敗しました')
            );
        }
    }

    // =========================================================================
    // 周辺スポット検索
    // =========================================================================

    /**
     * 指定座標の周辺にある協力店を検索（Haversine公式）
     * フロントエンドで距離計算するため、全パートナーを取得してフィルタリング
     */
    async findNearbyPartners(
        lat: number,
        lng: number,
        radiusKm: number = 50
    ): Promise<Result<Array<Row<'partners'> & { distance_km: number }>>> {
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;

            const nearby = (data || [])
                .map((partner) => {
                    const dist = haversineDistance(
                        lat, lng,
                        Number(partner.latitude), Number(partner.longitude)
                    );
                    return { ...partner, distance_km: Math.round(dist * 10) / 10 };
                })
                .filter((p) => p.distance_km <= radiusKm)
                .sort((a, b) => a.distance_km - b.distance_km);

            return ResultHelper.success(nearby);
        } catch (error) {
            logger.error('Error finding nearby partners:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('周辺協力店の検索に失敗しました')
            );
        }
    }

    /**
     * 指定座標の周辺にある今後のイベントを検索
     */
    async findNearbyEvents(
        lat: number,
        lng: number,
        radiusKm: number = 50
    ): Promise<Result<Array<Row<'events'> & { distance_km: number }>>> {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .gte('event_date', new Date().toISOString());

            if (error) throw error;

            const nearby = (data || [])
                .map((event) => {
                    const e = event as Record<string, unknown>;
                    const dist = haversineDistance(
                        lat, lng,
                        Number(e.latitude), Number(e.longitude)
                    );
                    return { ...event, distance_km: Math.round(dist * 10) / 10 };
                })
                .filter((e) => e.distance_km <= radiusKm)
                .sort((a, b) => a.distance_km - b.distance_km);

            return ResultHelper.success(nearby);
        } catch (error) {
            logger.error('Error finding nearby events:', error);
            return ResultHelper.error(
                error instanceof Error ? error : new Error('周辺イベントの検索に失敗しました')
            );
        }
    }
}

/**
 * Haversine公式で2点間の距離を計算（km）
 */
function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}
