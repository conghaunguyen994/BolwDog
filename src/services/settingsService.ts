import { supabase } from './supabase/client';
import { ShopSettings } from '../types/settings';
import { defaultShopSettings } from '../constants/defaultSettings';

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    localStorage.removeItem('bowldog_mock_settings');
    if (!supabase) return defaultShopSettings;

    const { data, error } = await supabase.from('shop_settings').select('*');
    if (error || !data || data.length === 0) {
      return defaultShopSettings;
    }

    const settings: any = { ...defaultShopSettings };
    data.forEach((row) => {
      if (row.setting_key in settings) {
        settings[row.setting_key] = row.setting_value;
      }
    });
    return settings as ShopSettings;
  },

  async updateSettings(newSettings: Partial<ShopSettings>): Promise<ShopSettings> {
    if (!supabase) {
      throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
    }

    for (const [key, val] of Object.entries(newSettings)) {
      const { error } = await supabase
        .from('shop_settings')
        .upsert(
          {
            setting_key: key,
            setting_value: val,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );
      if (error) throw new Error(error.message);
    }

    return this.getSettings();
  },
};
