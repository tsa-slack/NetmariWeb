import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * アクティビティリポジトリ
 */
export class ActivityRepository extends BaseRepository<'activities'> {
    constructor() {
        super('activities');
    }

    /**
     * パートナー別にアクティビティを取得
     */
    async findByPartner(partnerId: string): Promise<Result<Row<'activities'>[]>> {
        const query = new QueryBuilder<Row<'activities'>>(this.table)
            .whereEqual('partner_id', partnerId)
            .orderBy('name', 'asc');

        return query.execute();
    }

    /**
     * アクティビティ総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'activities'>>(this.table);
        return query.count();
    }

    /**
     * 管理用：パートナー情報付きで全アクティビティを取得
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllWithPartner(): Promise<Result<any[]>> {
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select(`
                    *,
                    partner:partners(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch activities')
            } as const;
        }
    }
}
