import type { Result } from '../base/types';
import { supabase } from '../../supabase';

/**
 * システム設定リポジトリ
 * system_settingsテーブルは型定義に含まれていないため、BaseRepositoryを継承しない
 */
export class SystemSettingsRepository {
    private table = 'system_settings' as const;

    /**
     * キーで設定値を取得
     */
    async findByKey(key: string): Promise<Result<string | null>> {
        try {
            const { data, error } = await (supabase
                .from(this.table) as any)
                .select('value')
                .eq('key', key)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data: data?.value || null } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch setting')
            } as const;
        }
    }

    /**
     * すべての設定を取得
     */
    async findAll(): Promise<Result<Record<string, string>>> {
        try {
            const { data, error } = await (supabase
                .from(this.table) as any)
                .select('key, value');

            if (error) throw error;

            const settings: Record<string, string> = {};
            (data || []).forEach((item: any) => {
                settings[item.key] = item.value;
            });

            return { success: true, data: settings } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch settings')
            } as const;
        }
    }
}
