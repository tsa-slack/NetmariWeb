import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SystemSettingsRepository, useQuery } from '../lib/data-access';

interface SystemSettings {
  rental_enabled: boolean;
  partner_registration_enabled: boolean;
  user_registration_enabled: boolean;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  rental_intro_title: string;
  rental_intro_description: string;
  faq_items: string;
}

export function useSystemSettings() {
  const settingsRepo = new SystemSettingsRepository();

  // SystemSettingsRepositoryを使用してすべての設定を取得
  const { data: settingsData, loading, refetch } = useQuery<Record<string, string>>(
    async () => settingsRepo.findAll(),
    { enabled: true }
  );

  // 設定データをboolean型に変換
  const [settings, setSettings] = useState<SystemSettings>({
    rental_enabled: true,
    partner_registration_enabled: true,
    user_registration_enabled: true,
    hero_image_url: '',
    hero_title: 'どこでも、寝泊まりを。',
    hero_subtitle: '車中泊に特化したキャンピングカーコミュニティサービス',
    rental_intro_title: '車中泊レンタルの魅力',
    rental_intro_description: 'キャンピングカーでの車中泊は自由な旅の始まり。',
    faq_items: '',
  });

  useEffect(() => {
    if (settingsData) {
      const booleanKeys = ['rental_enabled', 'partner_registration_enabled', 'user_registration_enabled'];
      const newSettings: Partial<SystemSettings> = {};
      Object.entries(settingsData).forEach(([key, value]) => {
        if (key in settings) {
          if (booleanKeys.includes(key)) {
            (newSettings as Record<string, unknown>)[key] = value === 'true';
          } else {
            (newSettings as Record<string, unknown>)[key] = value || '';
          }
        }
      });

      setSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
    }
  }, [settingsData]);

  // リアルタイム更新のサブスクリプション
  useEffect(() => {
    const subscription = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
        },
        () => {
          refetch(); // useQueryのrefetchを使用
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  return { settings, loading };
}
