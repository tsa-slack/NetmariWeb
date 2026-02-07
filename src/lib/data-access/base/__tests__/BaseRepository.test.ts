import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository } from '../BaseRepository';

// supabaseクライアントをモック
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockRange = vi.fn();

const buildChain = () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
});

vi.mock('../../../supabase', () => ({
    supabase: {
        from: vi.fn(() => buildChain()),
    },
}));

// チェーンの返り値をセットアップ
beforeEach(() => {
    vi.clearAllMocks();
    // Default: all chain methods return the chain
    const chain = buildChain();
    for (const fn of [mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockOrder, mockLimit, mockRange]) {
        fn.mockReturnValue(chain);
    }
});

describe('BaseRepository', () => {
    // BaseRepositoryは抽象クラスなのでテスト用サブクラスを作成
    class TestRepository extends BaseRepository<'events'> {
        constructor() {
            super('events');
        }

        // protectedメソッドをテスト用に公開
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public testHandleError(error: any) {
            return this.handleError(error);
        }
    }

    let repo: TestRepository;

    beforeEach(() => {
        repo = new TestRepository();
    });

    describe('findById', () => {
        it('成功時にデータを返す', async () => {
            const mockData = { id: '1', title: 'テストイベント' };
            mockMaybeSingle.mockResolvedValue({ data: mockData, error: null });

            const result = await repo.findById('1');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockData);
            }
        });

        it('エラー時にResult.errorを返す', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

            const result = await repo.findById('1');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('DB error');
            }
        });
    });

    describe('findAll', () => {
        it('オプションなしで全レコードを返す', async () => {
            const mockData = [{ id: '1' }, { id: '2' }];
            mockSelect.mockResolvedValue({ data: mockData, error: null });

            const result = await repo.findAll();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
            }
        });

        it('nullデータの場合は空配列を返す', async () => {
            mockSelect.mockResolvedValue({ data: null, error: null });

            const result = await repo.findAll();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual([]);
            }
        });
    });

    describe('handleError', () => {
        it('Errorインスタンスをそのまま返す', () => {
            const error = new Error('test error');
            expect(repo.testHandleError(error)).toBe(error);
        });

        it('文字列をErrorに変換する', () => {
            const result = repo.testHandleError('string error');
            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('string error');
        });

        it('その他のエラーをデフォルトメッセージで変換する', () => {
            const result = repo.testHandleError({ code: 123 });
            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('データベースエラーが発生しました');
        });
    });
});
