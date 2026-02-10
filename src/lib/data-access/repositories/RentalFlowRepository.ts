import { BaseRepository } from '../base/BaseRepository';
import type { Result, Row } from '../base/types';
import type { Json } from '../../database.types';

/**
 * レンタルフロー専用リポジトリ
 * 予約作成の複数テーブルトランザクション処理を統一
 */

// DB行型のエイリアス
type RentalVehicleRow = Row<'rental_vehicles'>;
type VehicleRow = Row<'vehicles'>;
type EquipmentRow = Row<'equipment'>;
type ActivityRow = Row<'activities'>;
type ReservationRow = Row<'reservations'>;

// JOIN付きの複合型
type RentalVehicleWithVehicle = RentalVehicleRow & {
    vehicle?: VehicleRow | null;
};

// 確認ページ用データ
interface ConfirmationData {
    vehicle: RentalVehicleWithVehicle | null;
    equipment: EquipmentRow[];
    activities: ActivityRow[];
    userRank: string;
    discountRate: number;
}

// 予約作成用パラメータ
interface CreateReservationParams {
    userId: string;
    rentalVehicleId: string;
    startDate: string;
    endDate: string;
    days: number;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    options: Json;
    equipment: Array<{
        equipmentId: string;
        quantity: number;
        days: number;
        pricePerDay: number;
        subtotal: number;
    }>;
    activities: Array<{
        activityId: string;
        date: string;
        participants: number;
        price: number;
    }>;
}

export class RentalFlowRepository extends BaseRepository<'reservations'> {
    constructor() {
        super('reservations');
    }

    /**
     * 日付文字列を±N日ずらすヘルパー
     */
    private addDays(dateStr: string, days: number): string {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    /**
     * 利用可能なレンタル車両を取得（車両情報JOIN付き）
     * 指定日付範囲で予約が重複していない車両のみ返す
     */
    async getAvailableVehicles(startDate?: string, endDate?: string): Promise<Result<RentalVehicleWithVehicle[]>> {
        try {
            // 指定期間に重複する予約がある車両IDを取得
            // バッファ日（前日準備+翌日返却）を含めた範囲で重複チェック
            let bookedVehicleIds: string[] = [];
            if (startDate && endDate) {
                const bufferStart = this.addDays(startDate, -1);
                const bufferEnd = this.addDays(endDate, 1);

                const { data: overlapping, error: overlapError } = await this.client
                    .from('reservations')
                    .select('rental_vehicle_id')
                    .in('status', ['Pending', 'Confirmed', 'InProgress'])
                    .lte('start_date', bufferEnd)
                    .gte('end_date', bufferStart);

                if (overlapError) throw overlapError;

                bookedVehicleIds = (overlapping || [])
                    .map(r => r.rental_vehicle_id)
                    .filter((id): id is string => id !== null);
            }

            // 利用可能な車両を取得（予約済み車両を除外）
            let query = this.client
                .from('rental_vehicles')
                .select('*, vehicle:vehicles(*)')
                .eq('status', 'Available')
                .order('price_per_day', { ascending: true });

            // 予約済み車両を除外（重複があれば）
            if (bookedVehicleIds.length > 0) {
                // Supabase の not.in フィルターで除外
                const uniqueIds = [...new Set(bookedVehicleIds)];
                query = query.not('id', 'in', `(${uniqueIds.join(',')})`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data: (data || []) as RentalVehicleWithVehicle[] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch vehicles'),
            } as const;
        }
    }

    /**
     * 利用可能な装備を取得
     */
    async getAvailableEquipment(): Promise<Result<EquipmentRow[]>> {
        try {
            const { data, error } = await this.client
                .from('equipment')
                .select('*')
                .eq('status', 'Available')
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch equipment'),
            } as const;
        }
    }

    /**
     * 利用可能なアクティビティを取得
     */
    async getAvailableActivities(): Promise<Result<ActivityRow[]>> {
        try {
            const { data, error } = await this.client
                .from('activities')
                .select('*')
                .eq('status', 'Active')
                .order('name', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch activities'),
            } as const;
        }
    }

    /**
     * 確認ページ用のデータを一括取得
     */
    async getConfirmationData(
        vehicleId: string,
        equipmentIds: string[],
        activityIds: string[],
        userId: string
    ): Promise<Result<ConfirmationData>> {
        try {
            // 車両データ
            const { data: vehicleData, error: vehicleError } = await this.client
                .from('rental_vehicles')
                .select('*, vehicle:vehicles(*)')
                .eq('id', vehicleId)
                .maybeSingle();

            if (vehicleError) throw vehicleError;

            // 装備データ
            let equipmentList: EquipmentRow[] = [];
            if (equipmentIds.length > 0) {
                const { data, error } = await this.client
                    .from('equipment')
                    .select('*')
                    .in('id', equipmentIds);

                if (error) throw error;
                equipmentList = data || [];
            }

            // アクティビティデータ
            let activityList: ActivityRow[] = [];
            if (activityIds.length > 0) {
                const { data, error } = await this.client
                    .from('activities')
                    .select('*')
                    .in('id', activityIds);

                if (error) throw error;
                activityList = data || [];
            }

            // ユーザーランク・割引率
            let userRank = 'Bronze';
            let discountRate = 0;

            const { data: userData, error: userError } = await this.client
                .from('users')
                .select('rank')
                .eq('id', userId)
                .maybeSingle();

            if (!userError && userData) {
                userRank = userData.rank || 'Bronze';

                const { data: settings } = await this.client
                    .from('system_settings')
                    .select('rank_settings')
                    .limit(1)
                    .maybeSingle();

                if (settings && settings.rank_settings) {
                    const rs = settings.rank_settings as unknown as {
                        ranks: Record<string, { discount_rate?: number }>;
                    };
                    const rankConfig = rs.ranks[userRank];
                    if (rankConfig) {
                        discountRate = rankConfig.discount_rate || 0;
                    }
                }
            }

            return {
                success: true,
                data: {
                    vehicle: vehicleData as RentalVehicleWithVehicle | null,
                    equipment: equipmentList,
                    activities: activityList,
                    userRank,
                    discountRate,
                },
            } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch confirmation data'),
            } as const;
        }
    }

    /**
     * 予約の重複チェック
     */
    async checkOverlap(
        vehicleId: string,
        startDate: string,
        endDate: string
    ): Promise<Result<boolean>> {
        try {
            // バッファ日（前日準備+翌日返却）を含めた範囲で重複チェック
            const bufferStart = this.addDays(startDate, -1);
            const bufferEnd = this.addDays(endDate, 1);

            const { data, error } = await this.client
                .from('reservations')
                .select('id')
                .eq('rental_vehicle_id', vehicleId)
                .in('status', ['Pending', 'Confirmed', 'CheckedOut'])
                .lte('start_date', bufferEnd)
                .gte('end_date', bufferStart)
                .limit(1);

            if (error) throw error;
            return { success: true, data: (data && data.length > 0) } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to check overlap'),
            } as const;
        }
    }

    /**
     * 予約を作成（複数テーブルトランザクション）
     * reservations → reservation_equipment → reservation_activities
     */
    async createReservation(params: CreateReservationParams): Promise<Result<ReservationRow>> {
        try {
            // 1. 予約レコード作成
            const { data: reservation, error: reservationError } = await this.client
                .from('reservations')
                .insert({
                    user_id: params.userId,
                    rental_vehicle_id: params.rentalVehicleId,
                    start_date: params.startDate,
                    end_date: params.endDate,
                    days: params.days,
                    status: params.status,
                    subtotal: params.subtotal,
                    tax: params.tax,
                    total: params.total,
                    payment_method: params.paymentMethod,
                    payment_status: params.paymentStatus,
                    options: params.options,
                })
                .select()
                .single();

            if (reservationError) throw reservationError;

            // 2. 装備レコード作成
            if (params.equipment.length > 0) {
                const equipmentInserts = params.equipment.map((eq) => ({
                    reservation_id: reservation.id,
                    equipment_id: eq.equipmentId,
                    quantity: eq.quantity,
                    days: eq.days,
                    price_per_day: eq.pricePerDay,
                    subtotal: eq.subtotal,
                }));

                const { error: equipmentError } = await this.client
                    .from('reservation_equipment')
                    .insert(equipmentInserts);

                if (equipmentError) throw equipmentError;
            }

            // 3. アクティビティレコード作成
            if (params.activities.length > 0) {
                const activityInserts = params.activities.map((act) => ({
                    reservation_id: reservation.id,
                    activity_id: act.activityId,
                    date: act.date,
                    participants: act.participants,
                    price: act.price,
                }));

                const { error: activityError } = await this.client
                    .from('reservation_activities')
                    .insert(activityInserts);

                if (activityError) throw activityError;
            }

            return { success: true, data: reservation } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to create reservation'),
            } as const;
        }
    }
}
