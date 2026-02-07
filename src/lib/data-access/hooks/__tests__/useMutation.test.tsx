import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutation } from '../useMutation';
import type { Result } from '../../base/types';

describe('useMutation', () => {
  it('mutateで成功時にデータがセットされる', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1', title: '新しいイベント' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() => useMutation(mutationFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.mutate({ title: '新しいイベント' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ id: '1', title: '新しいイベント' });
    expect(result.current.error).toBeNull();
    expect(mutationFn).toHaveBeenCalledWith({ title: '新しいイベント' });
  });

  it('mutateでエラー時にerrorがセットされる', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      success: false,
      error: new Error('作成失敗'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({ title: 'test' });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe('作成失敗');
  });

  it('onSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() =>
      useMutation(mutationFn, { onSuccess })
    );

    await act(async () => {
      await result.current.mutate({ title: 'test' });
    });

    expect(onSuccess).toHaveBeenCalledWith({ id: '1' }, { title: 'test' });
  });

  it('onErrorコールバックが呼ばれる', async () => {
    const onError = vi.fn();
    const error = new Error('テスト');
    const mutationFn = vi.fn().mockResolvedValue({
      success: false,
      error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() =>
      useMutation(mutationFn, { onError })
    );

    await act(async () => {
      await result.current.mutate({ title: 'test' });
    });

    expect(onError).toHaveBeenCalledWith(error, { title: 'test' });
  });

  it('resetで状態がクリアされる', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({ title: 'test' });
    });

    expect(result.current.data).toEqual({ id: '1' });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('mutateAsyncがResult型を返す', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() => useMutation(mutationFn));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mutationResult: Result<any> | undefined;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({ title: 'test' });
    });

    expect(mutationResult?.success).toBe(true);
    if (mutationResult?.success) {
      expect(mutationResult.data).toEqual({ id: '1' });
    }
  });

  it('onSettledが成功・失敗両方で呼ばれる', async () => {
    const onSettled = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Result<any>);

    const { result } = renderHook(() =>
      useMutation(mutationFn, { onSettled })
    );

    await act(async () => {
      await result.current.mutate({ title: 'test' });
    });

    expect(onSettled).toHaveBeenCalledWith(
      { id: '1' },
      null,
      { title: 'test' }
    );
  });
});
