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
}
