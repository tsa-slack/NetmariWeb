import { BaseRepository } from '../base/BaseRepository';
import { QueryBuilder } from '../base/QueryBuilder';
import type { Result, Row } from '../base/types';
import { Result as ResultHelper } from '../base/types';
import type { UserForAdmin } from '../base/joinTypes';

/**
 * ユーザーリポジトリ
 * ユーザーテーブルへのデータアクセスを提供
 */
export class UserRepository extends BaseRepository<'users'> {
    constructor() {
        super('users');
    }

    /**
     * メールアドレスでユーザーを検索
     */
    async findByEmail(email: string): Promise<Result<Row<'users'> | null>> {
        const query = new QueryBuilder<Row<'users'>>(this.table)
            .whereEqual('email', email);

        return query.single();
    }

    /**
     * ロールでユーザーを検索
     */
    async findByRole(role: string): Promise<Result<Row<'users'>[]>> {
        return this.findWhere('role', role, {
            orderBy: { column: 'created_at', ascending: false },
        });
    }

    /**
   * すべてのユーザーを取得
   */
    async findAll(): Promise<Result<Row<'users'>[]>> {
        const query = new QueryBuilder<Row<'users'>>(this.table).orderBy(
            'created_at',
            'desc'
        );

        return query.execute();
    }

    /**
     * ユーザー総数を取得
     */
    async count(): Promise<Result<number>> {
        const query = new QueryBuilder<Row<'users'>>(this.table);
        return query.count();
    }

    /**
     * アクティブなユーザーを取得
     */
    async findActive(): Promise<Result<Row<'users'>[]>> {
        const query = new QueryBuilder<Row<'users'>>(this.table)
            .whereEqual('is_active', true)
            .orderBy('last_name', 'asc');

        return query.execute();
    }

    /**
     * プロフィール情報を更新
     */
    async updateProfile(
        userId: string,
        profileData: {
            first_name?: string;
            last_name?: string;
            phone_number?: string;
            bio?: string;
        }
    ): Promise<Result<Row<'users'>>> {
        return this.update(userId, profileData);
    }

    /**
     * 管理用：ロールフィルタ付きでユーザー一覧を取得
     */
    async findAllFiltered(roleFilter?: string): Promise<Result<UserForAdmin[]>> {
        try {
            let query = this.client
                .from(this.table)
                .select('id, email, first_name, last_name, phone_number, role, created_at')
                .order('created_at', { ascending: false });

            if (roleFilter && roleFilter !== 'all') {
                query = query.eq('role', roleFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return ResultHelper.success((data || []) as UserForAdmin[]);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('Failed to fetch users')
            );
        }
    }
}
