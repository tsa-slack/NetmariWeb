import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * カテゴリーリポジトリ
 */
export class CategoryRepository extends BaseRepository<'categories'> {
    constructor() {
        super('categories');
    }

    /**
     * タイプ別にカテゴリーを取得
     */
    async findByType(type: string): Promise<Result<Row<'categories'>[]>> {
        const query = new QueryBuilder<Row<'categories'>>(this.table)
            .whereEqual('type', type)
            .orderBy('display_order', 'asc');

        return query.execute();
    }

    /**
     * アクティブなカテゴリーを取得
     */
    async findActive(): Promise<Result<Row<'categories'>[]>> {
        const query = new QueryBuilder<Row<'categories'>>(this.table)
            .whereEqual('is_active', true)
            .orderBy('type', 'asc')
            .orderBy('display_order', 'asc');

        return query.execute();
    }
}
