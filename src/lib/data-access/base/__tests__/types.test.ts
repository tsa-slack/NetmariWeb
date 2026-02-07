import { describe, it, expect } from 'vitest';
import { Result, DataAccessError } from '../types';

describe('Result ヘルパー', () => {
    describe('Result.success', () => {
        it('成功結果を返す', () => {
            const result = Result.success('test data');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('test data');
            }
        });

        it('配列データで成功結果を返す', () => {
            const data = [{ id: '1' }, { id: '2' }];
            const result = Result.success(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
            }
        });

        it('nullデータで成功結果を返す', () => {
            const result = Result.success(null);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });
    });

    describe('Result.error', () => {
        it('エラー結果を返す', () => {
            const error = new Error('テストエラー');
            const result = Result.error<string>(error);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(error);
                expect(result.error.message).toBe('テストエラー');
            }
        });
    });
});

describe('DataAccessError', () => {
    it('メッセージ付きで作成できる', () => {
        const error = new DataAccessError('テストエラー');
        expect(error.message).toBe('テストエラー');
        expect(error.name).toBe('DataAccessError');
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
    });

    it('コードと詳細付きで作成できる', () => {
        const error = new DataAccessError('テストエラー', 'ERR_001', { table: 'events' });
        expect(error.message).toBe('テストエラー');
        expect(error.code).toBe('ERR_001');
        expect(error.details).toEqual({ table: 'events' });
    });

    it('Errorのインスタンスである', () => {
        const error = new DataAccessError('test');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DataAccessError);
    });
});
