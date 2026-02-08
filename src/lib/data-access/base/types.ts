import type { Database } from '../../database.types';

/**
 * Result型 - 成功/失敗を表現
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * データベーステーブルの型ヘルパー
 */
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]['Row'];
export type Insert<T extends TableName> = Tables[T]['Insert'];
export type Update<T extends TableName> = Tables[T]['Update'];

/**
 * クエリオプション
 */
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: {
        column: string;
        ascending?: boolean;
    };
}

/**
 * ページネーション結果
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * フィルター演算子
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

/**
 * フィルター条件
 */
export interface FilterCondition<T = unknown> {
    field: string;
    operator: FilterOperator;
    value: T;
}

/**
 * データアクセスエラー
 */
export class DataAccessError extends Error {
    constructor(
        message: string,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'DataAccessError';
    }
}

/**
 * Result型のヘルパー関数
 */
export const Result = {
    success: <T>(data: T): Result<T> => ({ success: true, data }),
    error: <T>(error: Error): Result<T> => ({ success: false, error }),
};
