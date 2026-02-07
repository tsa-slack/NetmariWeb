import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SystemSettingsRepository, useQuery } from '../lib/data-access';

interface SystemSettings {
  rental_enabled: boolean;
  partner_registration_enabled: boolean;
  user_registration_enabled: boolean;
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
  });

  useEffect(() => {
    if (settingsData) {
      const settingsMap: Partial<SystemSettings> = {};
      Object.entries(settingsData).forEach(([key, value]) => {
        if (key in settings) {
          settingsMap[key as keyof SystemSettings] = value === 'true';
        }
      });

      setSettings((prev) => ({
        ...prev,
        ...settingsMap,
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
