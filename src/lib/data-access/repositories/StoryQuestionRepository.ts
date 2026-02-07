import type { Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * ストーリー質問リポジトリ
 * story_questionsテーブルは型定義に含まれているが、複雑なリレーションのため独立クラス
 */
export class StoryQuestionRepository {
    private table = 'story_questions' as const;

    /**
     * ストーリーの質問一覧を取得（ユーザー情報と回答付き）
     */
    async findByStoryWithAnswers(storyId: string): Promise<Result<any[]>> {
        try {
            const { data, error } = await (supabase
                .from(this.table) as any)
                .select(`
          *,
          users!story_questions_user_id_fkey (first_name, last_name),
          story_answers (
            *,
            users!story_answers_user_id_fkey (first_name, last_name)
          )
        `)
                .eq('story_id', storyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch questions')
            } as const;
        }
    }
}

/**
 * ストーリーいいねリポジトリ
 * story_likesテーブルは型定義に含まれているが、シンプルな操作のため独立クラス
 */
export class StoryLikeRepository {
    private table = 'story_likes' as const;

    /**
     * ユーザーのいいね状況を確認
     */
    async checkLiked(storyId: string, userId: string): Promise<Result<boolean>> {
        try {
            const { data, error } = await (supabase
                .from(this.table) as any)
                .select('id')
                .eq('story_id', storyId)
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data: !!data } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to check like status')
            } as const;
        }
    }
}
