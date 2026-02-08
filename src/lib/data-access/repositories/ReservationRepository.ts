import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

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
     * 管理用：関連情報付きで全予約を取得
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllWithDetails(): Promise<Result<any[]>> {
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
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch reservations')
            } as const;
        }
    }

    /**
     * スタッフダッシュボード用：集計カウントを取得
     */
    async getDashboardCounts(): Promise<Result<{
        pendingStories: number;
        pendingReviews: number;
        openQuestions: number;
        activeRentals: number;
    }>> {
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

            return {
                success: true,
                data: {
                    pendingStories: storiesRes.count || 0,
                    pendingReviews: reviewsRes.count || 0,
                    openQuestions: questionsRes.count || 0,
                    activeRentals: rentalsRes.count || 0,
                },
            } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch dashboard counts'),
            } as const;
        }
    }
}
