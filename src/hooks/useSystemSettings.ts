import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SystemSettings {
  rental_enabled: boolean;
  partner_registration_enabled: boolean;
  user_registration_enabled: boolean;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    rental_enabled: true,
    partner_registration_enabled: true,
    user_registration_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();

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
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsMap: Partial<SystemSettings> = {};
        data.forEach((setting) => {
          const key = setting.key as keyof SystemSettings;
          settingsMap[key] = setting.value === 'true';
        });

        setSettings((prev) => ({
          ...prev,
          ...settingsMap,
        }));
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
}
