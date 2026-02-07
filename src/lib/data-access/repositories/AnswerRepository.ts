import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * 回答リポジトリ
 */
export class AnswerRepository extends BaseRepository<'answers'> {
    constructor() {
        super('answers');
    }

    /**
     * 質問の回答を著者情報付きで取得
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findByQuestionWithAuthor(questionId: string): Promise<Result<any[]>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
                    *,
                    author:users!answers_author_id_fkey (first_name, last_name)
                `)
                .eq('question_id', questionId)
                .order('is_accepted', { ascending: false })
                .order('helpful_count', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch answers')
            } as const;
        }
    }

    /**
     * ユーザーの回答を取得
     */
    async findByUser(userId: string): Promise<Result<Row<'answers'>[]>> {
        const query = new QueryBuilder<Row<'answers'>>(this.table)
            .whereEqual('author_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }
}
