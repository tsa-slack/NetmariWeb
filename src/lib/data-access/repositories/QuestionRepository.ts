import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { QuestionWithAuthorAndCount, QuestionForAdmin } from '../base/joinTypes';
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
    async findAllWithAuthorAndAnswerCount(): Promise<Result<QuestionWithAuthorAndCount[]>> {
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
            const questionsWithCount = (data || []).map((q: Record<string, unknown>) => ({
                ...q,
                answer_count: ((q.answers as Array<{ count: number }>) ?? [])[0]?.count ?? 0
            })) as QuestionWithAuthorAndCount[];

            return ResultHelper.success(questionsWithCount);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch questions')
            );
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
    async findByIdWithAuthor(id: string): Promise<Result<QuestionWithAuthorAndCount | null>> {
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
            return ResultHelper.success(data as QuestionWithAuthorAndCount | null);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch question')
            );
        }
    }

    /**
     * 管理用：著者情報・回答数付きで質問一覧を取得（ステータスフィルタ対応）
     */
    async findAllForAdmin(statusFilter?: string): Promise<Result<QuestionForAdmin[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select(`
                    *,
                    author:users!questions_author_id_fkey(first_name, last_name, email)
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
            (answerCounts || []).forEach((answer: { question_id: string }) => {
                answerCountMap[answer.question_id] = (answerCountMap[answer.question_id] || 0) + 1;
            });

            const questionsWithCounts: QuestionForAdmin[] = (questionsData || []).map((q: Record<string, unknown>) => {
                const author = q.author as { last_name?: string; first_name?: string; email?: string } | null;
                return {
                    ...q,
                    author: {
                        full_name: author
                            ? `${author.last_name || ''} ${author.first_name || ''}`.trim() || '不明'
                            : '不明',
                        email: author?.email || '',
                    },
                    answer_count: answerCountMap[(q.id as string)] || 0,
                } as QuestionForAdmin;
            });

            return ResultHelper.success(questionsWithCounts);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch questions')
            );
        }
    }
}
