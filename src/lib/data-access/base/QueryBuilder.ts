import { supabase } from '../../supabase';
import type { Result, FilterCondition, FilterOperator } from './types';
import { Result as ResultHelper } from './types';

/**
 * クエリビルダー
 * 型安全なクエリ構築を提供
 */
export class QueryBuilder<T = any> {
    private filters: FilterCondition[] = [];
    private selectFields: string = '*';
    private orderByField?: string;
    private orderDirection: 'asc' | 'desc' = 'asc';
    private limitValue?: number;
    private offsetValue?: number;
    private relations: string[] = [];

    constructor(private tableName: string) { }

    /**
     * 選択するフィールドを指定
     */
    select(fields: string): this {
        this.selectFields = fields;
        return this;
    }

    /**
     * フィルター条件を追加
     */
    where(field: string, operator: FilterOperator, value: any): this {
        this.filters.push({ field, operator, value });
        return this;
    }

    /**
     * 等価条件（ショートハンド）
     */
    whereEqual(field: string, value: any): this {
        return this.where(field, 'eq', value);
    }

    /**
     * WHERE IN句を追加
     */
    whereIn(field: string, values: any[]): this {
        return this.where(field, 'in', values);
    }

    /**
     * ソート順を指定
     */
    orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
        this.orderByField = field;
        this.orderDirection = direction;
        return this;
    }

    /**
     * 取得件数を制限
     */
    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    /**
     * オフセットを指定
     */
    offset(count: number): this {
        this.offsetValue = count;
        return this;
    }

    /**
     * リレーションを含める
     */
    include(relations: string[]): this {
        this.relations = relations;
        return this;
    }

    /**
     * クエリを実行
     */
    async execute(): Promise<Result<T[]>> {
        try {
            let query = (supabase.from(this.tableName) as any).select(
                this.buildSelectString()
            );

            // フィルターを適用
            for (const filter of this.filters) {
                query = this.applyFilter(query, filter);
            }

            // ソートを適用
            if (this.orderByField) {
                query = query.order(this.orderByField, {
                    ascending: this.orderDirection === 'asc',
                });
            }

            // リミットを適用
            if (this.limitValue !== undefined) {
                query = query.limit(this.limitValue);
            }

            // オフセットを適用
            if (this.offsetValue !== undefined && this.limitValue !== undefined) {
                query = query.range(
                    this.offsetValue,
                    this.offsetValue + this.limitValue - 1
                );
            }

            const { data, error } = await query;

            if (error) throw error;
            return ResultHelper.success(data || []);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('クエリ実行エラー')
            );
        }
    }

    /**
     * 単一レコードを取得
     */
    async single(): Promise<Result<T | null>> {
        try {
            let query = (supabase.from(this.tableName) as any).select(
                this.buildSelectString()
            );

            // フィルターを適用
            for (const filter of this.filters) {
                query = this.applyFilter(query, filter);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            return ResultHelper.success(data);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('クエリ実行エラー')
            );
        }
    }

    /**
     * カウントを取得
     */
    async count(): Promise<Result<number>> {
        try {
            let query = (supabase.from(this.tableName) as any).select('*', {
                count: 'exact',
                head: true,
            });

            // フィルターを適用
            for (const filter of this.filters) {
                query = this.applyFilter(query, filter);
            }

            const { count, error } = await query;

            if (error) throw error;
            return ResultHelper.success(count || 0);
        } catch (error) {
            return ResultHelper.error(
                error instanceof Error ? error : new Error('カウントエラー')
            );
        }
    }

    /**
     * SELECT文字列を構築
     */
    private buildSelectString(): string {
        if (this.relations.length === 0) {
            return this.selectFields;
        }

        const relationsStr = this.relations.join(',');
        return this.selectFields === '*'
            ? `*,${relationsStr}`
            : `${this.selectFields},${relationsStr}`;
    }

    /**
     * フィルターを適用
     */
    private applyFilter(query: any, filter: FilterCondition): any {
        const { field, operator, value } = filter;

        switch (operator) {
            case 'eq':
                return query.eq(field, value);
            case 'neq':
                return query.neq(field, value);
            case 'gt':
                return query.gt(field, value);
            case 'gte':
                return query.gte(field, value);
            case 'lt':
                return query.lt(field, value);
            case 'lte':
                return query.lte(field, value);
            case 'like':
                return query.like(field, value);
            case 'ilike':
                return query.ilike(field, value);
            case 'in':
                return query.in(field, value);
            case 'is':
                return query.is(field, value);
            default:
                return query;
        }
    }
}
