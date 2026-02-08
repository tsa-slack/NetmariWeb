import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * お問い合わせリポジトリ
 */
export class ContactRepository extends BaseRepository<'contacts'> {
    constructor() {
        super('contacts');
    }

    /**
     * ステータス別にお問い合わせを取得
     */
    async findByStatus(status: string): Promise<Result<Row<'contacts'>[]>> {
        const query = new QueryBuilder<Row<'contacts'>>(this.table)
            .whereEqual('status', status)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 未対応のお問い合わせ数を取得
     */
    async countPending(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'contacts'>>(this.table)
            .whereEqual('status', 'Pending');

        return query.count();
    }

    /**
     * 管理用：新しい順に全件取得
     */
    async findAllOrdered(): Promise<Result<Row<'contacts'>[]>> {
        const query = new QueryBuilder<Row<'contacts'>>(this.table)
            .orderBy('created_at', 'desc');

        return query.execute();
    }
}
