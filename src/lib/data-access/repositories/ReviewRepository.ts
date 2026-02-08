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
            .whereEqual('author_id', userId)
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

    /**
     * 管理用：著者情報付きでレビュー一覧を取得（フィルタ対応）
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllForAdmin(filter?: 'all' | 'published' | 'unpublished'): Promise<Result<any[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select(`
                    id, target_type, target_id, rating, title, content,
                    is_published, created_at,
                    author:users!reviews_author_id_fkey(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (filter === 'published') {
                query = query.eq('is_published', true);
            } else if (filter === 'unpublished') {
                query = query.eq('is_published', false);
            }

            const { data, error } = await query;
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
