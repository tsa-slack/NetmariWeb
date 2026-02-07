import { useState, useCallback } from 'react';
import type { Result } from '../base/types';

/**
 * ミューテーションオプション
 */
export interface UseMutationOptions<TData, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
}

/**
 * ミューテーション結果
 */
export interface UseMutationResult<TData, TVariables> {
    data: TData | null;
    loading: boolean;
    error: Error | null;
    mutate: (variables: TVariables) => Promise<void>;
    mutateAsync: (variables: TVariables) => Promise<Result<TData>>;
    reset: () => void;
}

/**
 * データ更新用のReactフック
 * 
 * @example
 * const { mutate, loading, error } = useMutation(
 *   (data) => eventRepo.create(data),
 *   {
 *     onSuccess: (event) => {
 *       console.log('Created:', event);
 *       refetch();
 *     }
 *   }
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMutation<TData = any, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<Result<TData>>,
    options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
    const { onSuccess, onError, onSettled } = options;

    const [data, setData] = useState<TData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    const mutateAsync = useCallback(
        async (variables: TVariables): Promise<Result<TData>> => {
            setLoading(true);
            setError(null);

            try {
                const result = await mutationFn(variables);

                if (result.success) {
                    setData(result.data);
                    onSuccess?.(result.data, variables);
                } else {
                    setError(result.error);
                    onError?.(result.error, variables);
                }

                onSettled?.(
                    result.success ? result.data : null,
                    result.success ? null : result.error,
                    variables
                );

                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                onError?.(error, variables);
                onSettled?.(null, error, variables);
                return { success: false, error };
            } finally {
                setLoading(false);
            }
        },
        [mutationFn, onSuccess, onError, onSettled]
    );

    const mutate = useCallback(
        async (variables: TVariables): Promise<void> => {
            await mutateAsync(variables);
        },
        [mutateAsync]
    );

    return {
        data,
        loading,
        error,
        mutate,
        mutateAsync,
        reset,
    };
}
