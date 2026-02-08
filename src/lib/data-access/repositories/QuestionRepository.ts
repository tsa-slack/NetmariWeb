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
          answers:answers (count)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 回答数を集計
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questionsWithCount = (data || []).map((q: any) => ({
                ...q,
                answer_count: q.answers?.[0]?.count ?? 0
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

    /**
     * 管理用：著者情報・回答数付きで質問一覧を取得（ステータスフィルタ対応）
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllForAdmin(statusFilter?: string): Promise<Result<any[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select(`
                    *,
                    author:users!questions_author_id_fkey(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter && statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data: questionsData, error: questionsError } = await query;
            if (questionsError) throw questionsError;

            // 回答数を集計
            const { data: answerCounts, error: answersError } = await this.client
                .from('answers')
                .select('question_id');

            if (answersError) throw answersError;

            const answerCountMap: Record<string, number> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            answerCounts?.forEach((answer: any) => {
                answerCountMap[answer.question_id] = (answerCountMap[answer.question_id] || 0) + 1;
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questionsWithCounts = (questionsData || []).map((q: any) => ({
                ...q,
                answer_count: answerCountMap[q.id] || 0,
            }));

            return { success: true, data: questionsWithCounts } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch questions')
            } as const;
        }
    }
}
