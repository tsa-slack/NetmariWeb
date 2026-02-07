import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuery } from '../useQuery';
import type { Result } from '../../base/types';

describe('useQuery', () => {
  it('成功時にデータを返す', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: '1', name: 'テスト' }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any[]>);

    const { result } = renderHook(() => useQuery(queryFn));

    // 初期状態
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([{ id: '1', name: 'テスト' }]);
    expect(result.current.error).toBeNull();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('エラー時にerrorを返す', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      success: false,
      error: new Error('テストエラー'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() => useQuery(queryFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe('テストエラー');
  });

  it('enabled=false の場合はクエリを実行しない', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any[]>);

    const { result } = renderHook(() =>
      useQuery(queryFn, { enabled: false })
    );

    // should not be loading and should not call queryFn
    expect(result.current.loading).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('refetchで再取得できる', async () => {
    let callCount = 0;
    const queryFn = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        success: true,
        data: { count: callCount },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as Result<any>;
    });

    const { result } = renderHook(() => useQuery(queryFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ count: 1 });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual({ count: 2 });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('onSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    const queryFn = vi.fn().mockResolvedValue({
      success: true,
      data: 'test',
    } as Result<string>);

    renderHook(() => useQuery(queryFn, { onSuccess }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('test');
    });
  });

  it('onErrorコールバックが呼ばれる', async () => {
    const onError = vi.fn();
    const error = new Error('テスト');
    const queryFn = vi.fn().mockResolvedValue({
      success: false,
      error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    renderHook(() => useQuery(queryFn, { onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('例外がスローされた場合もエラーを捕捉する', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('ネットワークエラー'));

    const { result } = renderHook(() => useQuery(queryFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('ネットワークエラー');
  });
});
