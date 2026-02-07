import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * レビューリポジトリ
 */
export class ReviewRepository extends BaseRepository<'reviews'> {
    constructor() {
        super('reviews');
    }

    /**
     * ユーザーのレビューを取得
     */
    async findByUser(userId: string): Promise<Result<Row<'reviews'>[]>> {
        const query = new QueryBuilder<Row<'reviews'>>(this.table)
            .whereEqual('user_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
   * 対象のレビューを取得
   */
    async findByTarget(
        targetType: string,
        targetId: string
    ): Promise<Result<Row<'reviews'>[]>> {
        const query = new QueryBuilder<Row<'reviews'>>(this.table)
            .whereEqual('target_type', targetType)
            .whereEqual('target_id', targetId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 未公開レビュー数を取得
     */
    async countPending(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'reviews'>>(this.table)
            .whereEqual('is_published', false);

        return query.count();
    }

    /**
     * 対象のレビューを著者情報付きで取得
     */
    async findByTargetWithAuthor(
        targetType: string,
        targetId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<Result<any[]>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
                    *,
                    author:users!reviews_author_id_fkey (first_name, last_name)
                `)
                .eq('target_type', targetType)
                .eq('target_id', targetId)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch reviews')
            } as const;
        }
    }
}
