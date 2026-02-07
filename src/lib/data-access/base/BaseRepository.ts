import { supabase } from '../../supabase';
import { logger } from '../../logger';
import type {
    Result,
    TableName,
    Row,
    Insert,
    Update,
    QueryOptions,
} from './types';
import { Result as ResultHelper } from './types';

/**
 * 基本リポジトリクラス
 * すべてのテーブル固有リポジトリの基底クラス
 */
export class BaseRepository<T extends TableName> {
    constructor(protected readonly tableName: T) { }

    /**
     * IDで単一レコードを取得
     */
    async findById(id: string): Promise<Result<Row<T> | null>> {
        try {
            const { data, error } = await (supabase
                .from(this.tableName))
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return ResultHelper.success(data);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * すべてのレコードを取得
     */
    async findAll(options?: QueryOptions): Promise<Result<Row<T>[]>> {
        try {
            let query = (supabase.from(this.tableName)).select('*');

            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true,
                });
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            if (options?.offset) {
                query = query.range(
                    options.offset,
                    options.offset + (options.limit || 10) - 1
                );
            }

            const { data, error } = await query;

            if (error) throw error;
            return ResultHelper.success(data || []);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * 新しいレコードを作成
     */
    async create(input: Insert<T>): Promise<Result<Row<T>>> {
        try {
            const { data, error } = await (supabase
                .from(this.tableName))
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(data);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコードを更新
     */
    async update(id: string, input: Update<T>): Promise<Result<Row<T>>> {
        try {
            const { data, error } = await (supabase
                .from(this.tableName))
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(data);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコードを削除
     */
    async delete(id: string): Promise<Result<void>> {
        try {
            const { error } = await (supabase
                .from(this.tableName))
                .delete()
                .eq('id', id);

            if (error) throw error;
            return ResultHelper.success(undefined);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * 条件に一致するレコードを検索
     */
    async findWhere(
        field: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any,
        options?: QueryOptions
    ): Promise<Result<Row<T>[]>> {
        try {
            let query = (supabase.from(this.tableName))
                .select('*')
                .eq(field, value);

            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true,
                });
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return ResultHelper.success(data || []);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコード数をカウント
     */
    async count(): Promise<Result<number>> {
        try {
            const { count, error } = await (supabase
                .from(this.tableName))
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return ResultHelper.success(count || 0);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * エラーハンドリング
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected handleError(error: any): Error {
        if (error instanceof Error) {
            logger.error(`[${this.tableName}] ${error.message}`, error);
            return error;
        }
        const message = typeof error === 'string' ? error : 'データベースエラーが発生しました';
        logger.error(`[${this.tableName}] ${message}`, error);
        return new Error(message);
    }

    /**
     * Supabaseクライアントへの直接アクセス（高度な使用のため）
     */
    protected get client() {
        return supabase;
    }

    /**
     * テーブル名を取得
     */
    protected get table() {
        return this.tableName;
    }
}
