import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Result, Row } from '../base/types';

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
    async findWithOrganizer(id: string): Promise<Result<any>> {
        const query = new QueryBuilder(this.table)
            .select('*, organizer:users(first_name, last_name)')
            .whereEqual('id', id);

        return query.single();
    }

    /**
     * IDでイベントを取得（主催者情報付き）- 詳細ページ用
     */
    async findByIdWithOrganizer(id: string): Promise<Result<any>> {
        try {
            const { data, error } = await (this.client
                .from(this.table) as any)
                .select(`
          *,
          organizer:users(first_name, last_name)
        `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: this.handleError(error) };
        }
    }

    /**
     * 参加者数を含むイベント一覧を取得
     */
    async findAllWithParticipantCount(): Promise<Result<any[]>> {
        try {
            const { data, error } = await (this.client
                .from(this.table) as any)
                .select(`
          *,
          participants:event_participants(count)
        `)
                .order('event_date', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: this.handleError(error) };
        }
    }
}
