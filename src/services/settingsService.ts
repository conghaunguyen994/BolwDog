import { supabase, isSupabaseConfigured } from './supabase/client';
import { ShopSettings } from '../types/settings';
import { initialSettings } from './mock/mockData';

const MOCK_SETTINGS_KEY = 'bowldog_mock_settings';

function getStoredMockSettings(): ShopSettings {
  const data = localStorage.getItem(MOCK_SETTINGS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(initialSettings));
    return initialSettings;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialSettings;
  }
}

function saveMockSettings(settings: ShopSettings) {
  localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(settings));
}

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('shop_settings').select('*');
      if (error || !data || data.length === 0) return initialSettings;

      const settings: any = { ...initialSettings };
      data.forEach((row) => {
        if (row.setting_key in settings) {
          settings[row.setting_key] = row.setting_value;
        }
      });
      return settings as ShopSettings;
    }

    return getStoredMockSettings();
  },

  async updateSettings(newSettings: Partial<ShopSettings>): Promise<ShopSettings> {
    if (isSupabaseConfigured && supabase) {
      for (const [key, val] of Object.entries(newSettings)) {
        await supabase
          .from('shop_settings')
          .upsert({
            setting_key: key,
            setting_value: val,
            updated_at: new Date().toISOString(),
          });
      }
      return this.getSettings();
    }

    const current = getStoredMockSettings();
    const updated = {
      ...current,
      ...newSettings,
      general_info: { ...current.general_info, ...newSettings.general_info },
      social_links: { ...current.social_links, ...newSettings.social_links },
      bank_transfer: { ...current.bank_transfer, ...newSettings.bank_transfer },
    };
    saveMockSettings(updated);
    return updated;
  },
};

