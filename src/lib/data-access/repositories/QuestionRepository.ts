import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * 質問リポジトリ
 */
export class QuestionRepository extends BaseRepository<'questions'> {
    constructor() {
        super('questions');
    }

    /**
     * すべての質問を取得（著者情報と回答数付き）
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllWithAuthorAndAnswerCount(): Promise<Result<any[]>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
          *,
          author:users!questions_author_id_fkey (first_name, last_name),
          answers:question_answers (count)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 回答数を集計
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questionsWithCount = (data || []).map((q: any) => ({
                ...q,
                answer_count: q.answers?.length || 0
            }));

            return { success: true, data: questionsWithCount } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch questions')
            } as const;
        }
    }

    /**
     * ユーザーの質問を取得
     */
    async findByUser(userId: string): Promise<Result<Row<'questions'>[]>> {
        const query = new QueryBuilder<Row<'questions'>>(this.table)
            .whereEqual('author_id', userId)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 質問を著者情報付きで取得
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findByIdWithAuthor(id: string): Promise<Result<any>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select(`
                    *,
                    author:users!questions_author_id_fkey (first_name, last_name)
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch question')
            } as const;
        }
    }
}
