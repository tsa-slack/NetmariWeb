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
 *
 * Supabase の .from() はジェネリック T extends TableName を narrowing できないため、
 * getTable() ヘルパーで as any キャストを1箇所に集約している。
 * 外部 API は型安全（Result<Row<T>> 等）を維持。
 */
export class BaseRepository<T extends TableName> {
    constructor(protected readonly tableName: T) { }

    /**
     * Supabase テーブルクエリを取得
     * ジェネリック T → テーブル名リテラルの narrowing 不可を
     * この1箇所の as any で吸収する
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected getTable(): any {
        return supabase.from(this.tableName as never);
    }

    /**
     * IDで単一レコードを取得
     */
    async findById(id: string): Promise<Result<Row<T> | null>> {
        try {
            const { data, error } = await this.getTable()
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return ResultHelper.success(data as Row<T> | null);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * すべてのレコードを取得
     */
    async findAll(options?: QueryOptions): Promise<Result<Row<T>[]>> {
        try {
            let query = this.getTable().select('*');

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
            return ResultHelper.success((data || []) as Row<T>[]);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * 新しいレコードを作成
     */
    async create(input: Insert<T>): Promise<Result<Row<T>>> {
        try {
            const { data, error } = await this.getTable()
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(data as Row<T>);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコードを更新
     */
    async update(id: string, input: Update<T>): Promise<Result<Row<T>>> {
        try {
            const { data, error } = await this.getTable()
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return ResultHelper.success(data as Row<T>);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコードを削除
     */
    async delete(id: string): Promise<Result<void>> {
        try {
            const { error } = await this.getTable()
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
            let query = this.getTable()
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
            return ResultHelper.success((data || []) as Row<T>[]);
        } catch (error) {
            return ResultHelper.error(this.handleError(error));
        }
    }

    /**
     * レコード数をカウント
     */
    async count(): Promise<Result<number>> {
        try {
            const { count, error } = await this.getTable()
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
        const message = typeof error === 'string' ? error
            : (error && typeof error === 'object' && 'message' in error) ? `${error.message}${error.details ? ` (${error.details})` : ''}`
                : 'データベースエラーが発生しました';
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
