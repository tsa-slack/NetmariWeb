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
                .from(this.table))
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
                .from(this.table))
                .select('key, value');

            if (error) throw error;

            const settings: Record<string, string> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    /**
     * すべての設定を生データとして取得
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findAllRaw(): Promise<Result<any[]>> {
        try {
            const { data, error } = await (supabase
                .from(this.table))
                .select('*')
                .order('key');

            if (error) throw error;
            return { success: true, data: data || [] } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch settings')
            } as const;
        }
    }

    /**
     * キーで設定値を更新
     */
    async updateByKey(key: string, value: string | null): Promise<Result<void>> {
        try {
            const { error } = await (supabase
                .from(this.table))
                .update({ value })
                .eq('key', key);

            if (error) throw error;
            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to update setting')
            } as const;
        }
    }

    /**
     * キーで設定値を upsert（存在しなければ作成、存在すれば更新）
     */
    async upsertByKey(key: string, value: string | null, description: string = ''): Promise<Result<void>> {
        try {
            const { error } = await supabase
                .from(this.table)
                .upsert({ key, value, description }, { onConflict: 'key' });

            if (error) throw error;
            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to upsert setting')
            } as const;
        }
    }

    /**
     * ランク設定を保存
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateRankSettings(targetKey: string, rankSettings: any): Promise<Result<void>> {
        try {
            const { error } = await (supabase
                .from(this.table))
                .update({ rank_settings: rankSettings })
                .eq('key', targetKey);

            if (error) throw error;
            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to update rank settings')
            } as const;
        }
    }

    /**
     * コンテンツ設定のキー一覧
     */
    static readonly CONTENT_KEYS = [
        'hero_image_url',
        'hero_title',
        'hero_subtitle',
        'rental_intro_title',
        'rental_intro_description',
        'faq_items',
    ] as const;

    /**
     * コンテンツ設定のデフォルト値
     */
    static readonly CONTENT_DEFAULTS: Record<string, { value: string; description: string }> = {
        hero_image_url: { value: '', description: 'ヒーロー画像URL' },
        hero_title: { value: 'どこでも、寝泊まりを。', description: 'ヒーロータイトル' },
        hero_subtitle: { value: '車中泊に特化したキャンピングカーコミュニティサービス', description: 'ヒーローサブタイトル' },
        rental_intro_title: { value: '車中泊レンタルの魅力', description: 'レンタル紹介タイトル' },
        rental_intro_description: { value: 'キャンピングカーでの車中泊は自由な旅の始まり。好きな場所で、好きな時間に、特別な体験を。', description: 'レンタル紹介文' },
        faq_items: {
            value: JSON.stringify([
                { question: '車中泊は初めてですが大丈夫ですか？', answer: 'はい、初めての方でも安心してご利用いただけます。車両の使い方の説明やおすすめスポットの情報も提供しております。' },
                { question: '予約のキャンセルはできますか？', answer: '出発日の3日前まで無料でキャンセル可能です。それ以降はキャンセル料が発生する場合があります。' },
                { question: 'ペットを連れて行けますか？', answer: '車両によってペット同伴可能なものもございます。各車両の詳細ページでご確認ください。' },
                { question: '燃料代は含まれていますか？', answer: '燃料代はレンタル料金に含まれておりません。満タンでお渡しし、満タンでの返却をお願いしています。' },
                { question: '免許証は必要ですか？', answer: 'はい、普通自動車免許が必要です。予約時に免許証の確認をさせていただきます。' },
            ]),
            description: 'FAQ項目（JSON）',
        },
    };

    /**
     * コンテンツ設定を取得（デフォルト値つき）
     */
    async getContentSettings(): Promise<Result<Record<string, string>>> {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .select('key, value')
                .in('key', SystemSettingsRepository.CONTENT_KEYS as unknown as string[]);

            if (error) throw error;

            // デフォルト値をベースに、DB の値で上書き
            const settings: Record<string, string> = {};
            for (const key of SystemSettingsRepository.CONTENT_KEYS) {
                settings[key] = SystemSettingsRepository.CONTENT_DEFAULTS[key].value;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data || []).forEach((item: any) => {
                if (item.value !== null && item.value !== undefined) {
                    settings[item.key] = item.value;
                }
            });

            return { success: true, data: settings } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to fetch content settings')
            } as const;
        }
    }

    /**
     * コンテンツ設定を一括保存（upsert）
     */
    async saveContentSettings(settings: Record<string, string>): Promise<Result<void>> {
        try {
            for (const key of SystemSettingsRepository.CONTENT_KEYS) {
                if (key in settings) {
                    const description = SystemSettingsRepository.CONTENT_DEFAULTS[key]?.description || '';
                    const { error } = await supabase
                        .from(this.table)
                        .upsert({ key, value: settings[key], description }, { onConflict: 'key' });

                    if (error) throw error;
                }
            }
            return { success: true, data: undefined } as const;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Failed to save content settings')
            } as const;
        }
    }
}
