import type { Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { EventParticipantWithUser } from '../base/joinTypes';
import { supabase } from '../../supabase';

/**
 * イベント参加者リポジトリ
 * event_participantsテーブルは型定義に含まれていないため、BaseRepositoryを継承しない
 */
export class EventParticipantRepository {
    private table = 'event_participants' as const;

    /**
     * イベントの参加者一覧を取得（ユーザー情報付き）
     */
    async findByEventWithUser(eventId: string): Promise<Result<EventParticipantWithUser[]>> {
        try {
            const { data, error } = await (supabase
                .from(this.table))
                .select(`
          id,
          status,
          created_at,
          user:users(first_name, last_name)
        `)
                .eq('event_id', eventId)
                .eq('status', 'Registered')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return ResultHelper.success((data || []) as EventParticipantWithUser[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch participants')
            );
        }
    }

    /**
     * ユーザーのイベント参加状況を確認
     */
    async checkParticipation(eventId: string, userId: string): Promise<Result<boolean>> {
        try {
            const { data, error } = await (supabase
                .from(this.table))
                .select('id')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .eq('status', 'Registered')
                .maybeSingle();

            if (error) throw error;
            return ResultHelper.success(!!data);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to check participation')
            );
        }
    }
}
