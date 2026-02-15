import { useState, useEffect, useCallback, useRef } from 'react';
import type { Result } from '../base/types';

/**
 * クエリオプション
 */
export interface UseQueryOptions<T> {
    enabled?: boolean;
    refetchOnMount?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

/**
 * クエリ結果
 */
export interface UseQueryResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * データフェッチ用のReactフック
 * 
 * @example
 * const { data, loading, error, refetch } = useQuery(
 *   () => eventRepo.findUpcoming()
 * );
 */
export function useQuery<T>(
    queryFn: () => Promise<Result<T>>,
    options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
    const {
        enabled = true,
        refetchOnMount = true,
        onSuccess,
        onError,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<Error | null>(null);

    const isMounted = useRef(true);
    const hasExecuted = useRef(false);

    // queryFn と callbacks を ref に保持して依存配列から除外
    const queryFnRef = useRef(queryFn);
    queryFnRef.current = queryFn;
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const execute = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const result = await queryFnRef.current();

            if (!isMounted.current) return;

            if (result.success) {
                setData(result.data);
                onSuccessRef.current?.(result.data);
            } else {
                setError(result.error);
                onErrorRef.current?.(result.error);
            }
        } catch (err) {
            if (!isMounted.current) return;

            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            onErrorRef.current?.(error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [enabled]);

    useEffect(() => {
        isMounted.current = true;

        if (enabled && (refetchOnMount || !hasExecuted.current)) {
            execute();
            hasExecuted.current = true;
        }

        return () => {
            isMounted.current = false;
        };
    }, [execute, enabled, refetchOnMount]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    return {
        data,
        loading,
        error,
        refetch,
    };
}

