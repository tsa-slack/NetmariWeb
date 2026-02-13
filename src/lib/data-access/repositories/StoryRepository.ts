import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * ストーリーリポジトリ
 */
export class StoryRepository extends BaseRepository<'stories'> {
    constructor() {
        super('stories');
    }

    /**
     * ユーザーのストーリーを取得
     */
    async findByUser(userId: string): Promise<Result<Row<'stories'>[]>> {
        const query = new QueryBuilder<Row<'stories'>>(this.table)
            .whereEqual('author_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 公開済みストーリーを取得
     */
    async findPublished(): Promise<Result<Row<'stories'>[]>> {
        const query = new QueryBuilder<Row<'stories'>>(this.table)
            .whereEqual('status', 'Published')
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 公開済みストーリーを取得（著者情報付き）
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findPublishedWithAuthor(): Promise<Result<any[]>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
          *,
          users!stories_author_id_fkey (first_name, last_name)
        `)
                .eq('status', 'Published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch published stories')
            } as const;
        }
    }

    /**
     * IDでストーリーを取得（著者情報付き）- 詳細ページ用
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findByIdWithAuthor(id: string): Promise<Result<any>> {
        try {
            const { data, error } = await (supabase
                .from(this.table))
                .select(`
          *,
          users!stories_author_id_fkey (first_name, last_name)
        `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch story')
            } as const;
        }
    }

    /**
     * ストーリー総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'stories'>>(this.table);
        return query.count();
    }

    /**
     * 管理用：著者情報付きでストーリー一覧を取得（ステータスフィルタ対応）
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllForAdmin(statusFilter?: string): Promise<Result<any[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select(`
                    id, title, excerpt, content, cover_image, location,
                    status, likes, views, created_at,
                    author:users!stories_author_id_fkey(first_name, last_name, email)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter && statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const storiesWithAuthor = (data || []).map((s: any) => ({
                ...s,
                author: {
                    full_name: s.author
                        ? `${s.author.last_name || ''} ${s.author.first_name || ''}`.trim() || '不明'
                        : '不明',
                    email: s.author?.email || '',
                },
            }));

            return { success: true, data: storiesWithAuthor } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch stories')
            } as const;
        }
    }
}
