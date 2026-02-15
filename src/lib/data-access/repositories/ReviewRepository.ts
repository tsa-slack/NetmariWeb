import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { ReviewWithAuthor, ReviewForAdmin } from '../base/joinTypes';
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
    ): Promise<Result<ReviewWithAuthor[]>> {
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
            return ResultHelper.success((data || []) as ReviewWithAuthor[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch reviews')
            );
        }
    }

    /**
     * 管理用：著者情報付きでレビュー一覧を取得（フィルタ対応）
     */
    async findAllForAdmin(filter?: 'all' | 'published' | 'unpublished'): Promise<Result<ReviewForAdmin[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select(`
                    id, target_type, target_id, rating, title, content,
                    is_published, created_at,
                    author:users!reviews_author_id_fkey(first_name, last_name, email)
                `)
                .order('created_at', { ascending: false });

            if (filter === 'published') {
                query = query.eq('is_published', true);
            } else if (filter === 'unpublished') {
                query = query.eq('is_published', false);
            }

            const { data, error } = await query;
            if (error) throw error;

            const reviewsWithAuthor: ReviewForAdmin[] = (data || []).map((r: Record<string, unknown>) => {
                const author = r.author as { last_name?: string; first_name?: string; email?: string } | null;
                return {
                    ...r,
                    author: {
                        full_name: author
                            ? `${author.last_name || ''} ${author.first_name || ''}`.trim() || '不明'
                            : '不明',
                        email: author?.email || '',
                    },
                } as ReviewForAdmin;
            });

            return ResultHelper.success(reviewsWithAuthor);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch reviews')
            );
        }
    }
}
