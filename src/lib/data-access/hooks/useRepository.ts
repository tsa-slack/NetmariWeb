import { useMemo } from 'react';
import type { BaseRepository } from '../base/BaseRepository';

/**
 * リポジトリインスタンスを作成するためのフック
 * 
 * @example
 * const eventRepo = useRepository(EventRepository);
 * const { data } = useQuery(() => eventRepo.findUpcoming());
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRepository<T extends BaseRepository<any>>(
    RepositoryClass: new () => T
): T {
    return useMemo(() => new RepositoryClass(), [RepositoryClass]);
}

/**
 * 複数のリポジトリを一度に作成
 * 
 * @example
 * const { eventRepo, userRepo } = useRepositories({
 *   eventRepo: EventRepository,
 *   userRepo: UserRepository,
 * });
 */
export function useRepositories<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends Record<string, new () => BaseRepository<any>>
>(
    repositories: T
): { [K in keyof T]: InstanceType<T[K]> } {
    return useMemo(() => {
        const instances = {} as { [K in keyof T]: InstanceType<T[K]> };

        for (const key in repositories) {
            instances[key] = new repositories[key]() as InstanceType<T[typeof key]>;
        }

        return instances;
    }, [repositories]);
}
