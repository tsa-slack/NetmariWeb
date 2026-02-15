import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { AnswerWithAuthor } from '../base/joinTypes';
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
    async findByQuestionWithAuthor(questionId: string): Promise<Result<AnswerWithAuthor[]>> {
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
            return ResultHelper.success((data || []) as AnswerWithAuthor[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch answers')
            );
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
