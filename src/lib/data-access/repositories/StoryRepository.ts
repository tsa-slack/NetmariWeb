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
            .whereEqual('published', true)
            .orderBy('published_at', 'desc');

        return query.execute();
    }

    /**
     * 公開済みストーリーを取得（著者情報付き）
     */
    async findPublishedWithAuthor(): Promise<Result<any[]>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
          *,
          users!stories_author_id_fkey (first_name, last_name)
        `)
                .eq('status', 'Published')
                .order('published_at', { ascending: false });

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
    async findByIdWithAuthor(id: string): Promise<Result<any>> {
        try {
            const { data, error } = await (supabase
                .from(this.table) as any)
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
}
