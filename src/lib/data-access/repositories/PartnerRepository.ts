import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * パートナーリポジトリ
 */
export class PartnerRepository extends BaseRepository<'partners'> {
    constructor() {
        super('partners');
    }

    /**
     * すべてのパートナーを取得
     */
    async findAll(): Promise<Result<Row<'partners'>[]>> {
        const query = new QueryBuilder<Row<'partners'>>(this.table)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * タイプ別にパートナーを取得
     */
    async findByType(type: string): Promise<Result<Row<'partners'>[]>> {
        const query = new QueryBuilder<Row<'partners'>>(this.table)
            .whereEqual('type', type)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 評価順にパートナーを取得
     */
    async findByRating(): Promise<Result<Row<'partners'>[]>> {
        const query = new QueryBuilder<Row<'partners'>>(this.table)
            .orderBy('rating', 'desc');

        return query.execute();
    }

    /**
     * パートナー総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'partners'>>(this.table);
        return query.count();
    }
}
