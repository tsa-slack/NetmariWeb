import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * ルートリポジトリ
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
}
