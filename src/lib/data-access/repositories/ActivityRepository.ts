import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { ActivityWithPartner } from '../base/joinTypes';

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
    async findAllWithPartner(): Promise<Result<ActivityWithPartner[]>> {
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select(`
                    *,
                    partner:partners(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return ResultHelper.success((data || []) as unknown as ActivityWithPartner[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch activities')
            );
        }
    }
}
