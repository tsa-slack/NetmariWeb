import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type {
    ReservationWithDetails,
    ReservationForCalendar,
    RentalVehicleForCalendar,
    DashboardCounts,
} from '../base/joinTypes';

/**
 * カレンダーマトリックス用データ
 */
export type CalendarData = {
    reservations: ReservationForCalendar[];
    vehicles: RentalVehicleForCalendar[];
};

/**
 * 予約リポジトリ
 */
export class ReservationRepository extends BaseRepository<'reservations'> {
    constructor() {
        super('reservations');
    }

    /**
     * ユーザーの予約を取得
     */
    async findByUser(userId: string): Promise<Result<Row<'reservations'>[]>> {
        const query = new QueryBuilder<Row<'reservations'>>(this.table)
            .whereEqual('user_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * ステータスで予約を取得
     */
    async findByStatus(status: string): Promise<Result<Row<'reservations'>[]>> {
        const query = new QueryBuilder<Row<'reservations'>>(this.table)
            .whereEqual('status', status)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * ユーザーとステータスで予約を取得
     */
    async findByUserAndStatus(userId: string, status: string): Promise<Result<Row<'reservations'>[]>> {
        const query = new QueryBuilder<Row<'reservations'>>(this.table)
            .whereEqual('user_id', userId)
            .whereEqual('status', status)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 予約総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'reservations'>>(this.table);
        return query.count();
    }

    /**
     * 予約ステータスを更新（管理者用）
     * RPC 関数を使用して RLS をバイパス（SECURITY DEFINER）
     */
    async updateStatus(id: string, status: string): Promise<Result<void>> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (this.client.rpc as any)('update_reservation_status', {
                reservation_id: id,
                new_status: status,
            });

            if (error) throw error;
            return ResultHelper.success(undefined as void);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('ステータスの更新に失敗しました')
            );
        }
    }

    /**
     * カレンダーマトリックス用データ取得
     * 指定日付範囲に重複するすべての予約 + 全レンタル車両を取得
     */
    async findForCalendar(startDate: string, endDate: string): Promise<Result<CalendarData>> {
        try {
            // 指定範囲に重複する予約を取得（Cancelled以外）
            const { data: reservations, error: resError } = await this.client
                .from('reservations')
                .select(`
                    *,
                    user:users(email, first_name, last_name),
                    rental_vehicle:rental_vehicles(
                        license_plate,
                        vehicle:vehicles(name, type)
                    ),
                    reservation_equipment(
                        id,
                        quantity,
                        days,
                        price_per_day,
                        subtotal,
                        equipment(name, category)
                    ),
                    reservation_activities(
                        id,
                        date,
                        participants,
                        price,
                        activity:activities(name, duration)
                    )
                `)
                .in('status', ['Pending', 'Confirmed', 'InProgress', 'Completed'])
                .lte('start_date', endDate)
                .gte('end_date', startDate)
                .order('start_date', { ascending: true });

            if (resError) throw resError;

            // 全レンタル車両を取得（車両情報JOIN付き）
            const { data: vehicles, error: vehError } = await this.client
                .from('rental_vehicles')
                .select('*, vehicle:vehicles(name, type)')
                .order('created_at', { ascending: true });

            if (vehError) throw vehError;

            return ResultHelper.success({
                reservations: (reservations || []) as ReservationForCalendar[],
                vehicles: (vehicles || []) as RentalVehicleForCalendar[],
            });
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('カレンダーデータの取得に失敗しました')
            );
        }
    }

    /**
     * 管理用：関連情報付きで全予約を取得
     */
    async findAllWithDetails(): Promise<Result<ReservationWithDetails[]>> {
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select(`
                    *,
                    user:users(email, first_name, last_name),
                    rental_vehicle:rental_vehicles(
                        price_per_day,
                        location,
                        vehicle:vehicles(name, type)
                    ),
                    reservation_equipment(
                        id,
                        quantity,
                        days,
                        price_per_day,
                        subtotal,
                        equipment(name, category)
                    ),
                    reservation_activities(
                        id,
                        date,
                        participants,
                        price,
                        activity:activities(name, duration)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return ResultHelper.success((data || []) as ReservationWithDetails[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch reservations')
            );
        }
    }

    /**
     * スタッフダッシュボード用：集計カウントを取得
     */
    async getDashboardCounts(): Promise<Result<DashboardCounts>> {
        try {
            const [storiesRes, reviewsRes, questionsRes, rentalsRes] = await Promise.all([
                this.client
                    .from('stories')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Draft'),
                this.client
                    .from('reviews')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_published', false),
                this.client
                    .from('questions')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Open'),
                this.client
                    .from('reservations')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'InProgress'),
            ]);

            return ResultHelper.success({
                pendingStories: storiesRes.count || 0,
                pendingReviews: reviewsRes.count || 0,
                openQuestions: questionsRes.count || 0,
                activeRentals: rentalsRes.count || 0,
            });
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch dashboard counts')
            );
        }
    }
}

