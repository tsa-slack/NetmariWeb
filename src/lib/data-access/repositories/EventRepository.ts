import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Result, Row } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { EventWithOrganizer, EventWithParticipantCount } from '../base/joinTypes';

/**
 * イベントリポジトリ
 * イベントテーブルへのデータアクセスを提供
 */
export class EventRepository extends BaseRepository<'events'> {
    constructor() {
        super('events');
    }

    /**
     * 開催予定のイベントを取得
     */
    async findUpcoming(): Promise<Result<Row<'events'>[]>> {
        const query = new QueryBuilder<Row<'events'>>(this.table)
            .whereEqual('status', 'Upcoming')
            .where('event_date', 'gt', new Date().toISOString())
            .orderBy('event_date', 'asc');

        return query.execute();
    }

    /**
     * 主催者IDでイベントを検索
     */
    async findByOrganizer(organizerId: string): Promise<Result<Row<'events'>[]>> {
        return this.findWhere('organizer_id', organizerId, {
            orderBy: { column: 'event_date', ascending: false },
        });
    }

    /**
     * イベントと主催者情報を取得
     */
    async findWithOrganizer(id: string): Promise<Result<EventWithOrganizer | null>> {
        const query = new QueryBuilder(this.table)
            .select('*, organizer:users(first_name, last_name)')
            .whereEqual('id', id);

        return query.single() as Promise<Result<EventWithOrganizer | null>>;
    }

    /**
     * IDでイベントを取得（主催者情報付き）- 詳細ページ用
     */
    async findByIdWithOrganizer(id: string): Promise<Result<EventWithOrganizer | null>> {
        try {
            const { data, error } = await (this.client
                .from(this.table))
                .select(`
          *,
          organizer:users(first_name, last_name)
        `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return ResultHelper.success(data as EventWithOrganizer | null);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * 参加者数を含むイベント一覧を取得
     */
    async findAllWithParticipantCount(): Promise<Result<EventWithParticipantCount[]>> {
        try {
            const { data, error } = await (this.client
                .from(this.table))
                .select(`
          *,
          participants:event_participants(count)
        `)
                .order('event_date', { ascending: false });

            if (error) throw error;
            return ResultHelper.success((data || []) as EventWithParticipantCount[]);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }
}
