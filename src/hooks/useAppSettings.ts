import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_VERSION } from '@/constants/app';

interface AppSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  latestVersion: string;
  hasUpdate: boolean;
  loading: boolean;
}

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>({
    maintenanceMode: false,
    maintenanceMessage: '',
    latestVersion: APP_VERSION,
    hasUpdate: false,
    loading: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error || !data) {
        setSettings(prev => ({ ...prev, loading: false }));
        return;
      }

      const map = Object.fromEntries(data.map(r => [r.key, r.value]));
      const latestVersion = map['latest_version'] || APP_VERSION;

      setSettings({
        maintenanceMode: map['maintenance_mode'] === 'true',
        maintenanceMessage: map['maintenance_message'] || 'Aplikasi sedang dalam pemeliharaan.',
        latestVersion,
        hasUpdate: latestVersion !== APP_VERSION,
        loading: false,
      });
    };

    fetchSettings();
  }, []);

  return settings;
}
