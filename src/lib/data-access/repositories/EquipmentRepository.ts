import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';

/**
 * 備品リポジトリ
 */
export class EquipmentRepository extends BaseRepository<'equipment'> {
    constructor() {
        super('equipment');
    }

    /**
     * 利用可能な備品を取得
     */
    async findAvailable(): Promise<Result<Row<'equipment'>[]>> {
        const query = new QueryBuilder<Row<'equipment'>>(this.table)
            .whereEqual('status', 'Available')
            .orderBy('name', 'asc');

        return query.execute();
    }

    /**
     * カテゴリー別に備品を取得
     */
    async findByCategory(category: string): Promise<Result<Row<'equipment'>[]>> {
        const query = new QueryBuilder<Row<'equipment'>>(this.table)
            .whereEqual('category', category)
            .orderBy('name', 'asc');

        return query.execute();
    }

    /**
     * 備品総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'equipment'>>(this.table);
        return query.count();
    }

    /**
     * 管理用：フィルタ付きで備品一覧を取得
     */
    async findAllFiltered(
        publishFilter?: 'all' | 'published' | 'unpublished',
        categoryFilter?: string
    ): Promise<Result<Row<'equipment'>[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select('*')
                .order('created_at', { ascending: false });

            if (publishFilter === 'published') {
                query = query.eq('is_published', true);
            } else if (publishFilter === 'unpublished') {
                query = query.eq('is_published', false);
            }

            if (categoryFilter && categoryFilter !== 'all') {
                query = query.eq('category', categoryFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch equipment')
            } as const;
        }
    }
}
