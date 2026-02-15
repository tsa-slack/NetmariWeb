import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Row, Result } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { AnnouncementWithAuthor } from '../base/joinTypes';

/**
 * お知らせリポジトリ
 */
export class AnnouncementRepository extends BaseRepository<'announcements'> {
    constructor() {
        super('announcements');
    }

    /**
     * 優先度でフィルタリング
     */
    async findByPriority(priority: string): Promise<Result<Row<'announcements'>[]>> {
        const query = new QueryBuilder<Row<'announcements'>>(this.table)
            .whereEqual('priority', priority)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * アクティブなお知らせを取得
     */
    async findActive(): Promise<Result<Row<'announcements'>[]>> {
        const query = new QueryBuilder<Row<'announcements'>>(this.table)
            .whereEqual('is_active', true)
            .orderBy('created_at', 'desc');

        return query.execute();
    }

    /**
     * 優先度でソートして全件取得
     */
    async findAllSorted(): Promise<Result<Row<'announcements'>[]>> {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };

        const result = await this.findAll({
            orderBy: { column: 'created_at', ascending: false },
        });

        if (!result.success) {
            return result;
        }

        // クライアント側で優先度ソート
        const sorted = [...result.data].sort((a, b) => {
            const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return priorityB - priorityA;
        });

        return ResultHelper.success(sorted);
    }

    /**
     * 公開済みお知らせを著者情報付きで取得
     */
    async findPublishedWithAuthor(): Promise<Result<AnnouncementWithAuthor[]>> {
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select(`
                    *,
                    author:users!announcements_author_id_fkey(first_name, last_name)
                `)
                .eq('published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return ResultHelper.success((data || []) as AnnouncementWithAuthor[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch announcements')
            );
        }
    }
}
