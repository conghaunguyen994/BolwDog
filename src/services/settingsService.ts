import { supabase } from './supabase/client';
import { ShopSettings } from '../types/settings';
import { defaultShopSettings } from '../constants/defaultSettings';

const LEGACY_SECRET_FIELDS_BY_KEY: Record<string, string[]> = {
  sepay: ['api_key'],
  email_notifications: [
    'webhook_url',
    'emailjs_service_id',
    'emailjs_template_id',
    'emailjs_public_key',
    'emailjs_private_key',
  ],
};

/**
 * Loại bỏ triệt để mọi API key / webhook secret cũ khỏi JSON trước khi đưa vào state client hoặc ghi vào DB.
 */
export function sanitizeSettingEntry(
  key: string,
  val: unknown
): { clean: any; hadSecrets: boolean } {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return { clean: val, hadSecrets: false };
  }

  const secretFields = LEGACY_SECRET_FIELDS_BY_KEY[key];
  let hadSecrets = false;
  const copy: Record<string, any> = { ...(val as Record<string, any>) };

  if (secretFields) {
    for (const field of secretFields) {
      if (field in copy) {
        delete copy[field];
        hadSecrets = true;
      }
    }
  }

  if (key === 'general' && copy.sepay && typeof copy.sepay === 'object' && 'api_key' in copy.sepay) {
    const cleanSepay = { ...copy.sepay };
    delete cleanSepay.api_key;
    copy.sepay = cleanSepay;
    hadSecrets = true;
  }

  return { clean: copy, hadSecrets };
}

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
        settings[row.setting_key] = sanitizeSettingEntry(row.setting_key, row.setting_value).clean;
      }
    });
    return settings as ShopSettings;
  },

  async updateSettings(newSettings: Partial<ShopSettings>): Promise<ShopSettings> {
    if (!supabase) {
      throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
    }

    for (const [key, val] of Object.entries(newSettings)) {
      const { clean } = sanitizeSettingEntry(key, val);
      const { error } = await supabase
        .from('shop_settings')
        .upsert(
          {
            setting_key: key,
            setting_value: clean,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );
      if (error) throw new Error(error.message);
    }

    return this.getSettings();
  },

  /**
   * Dọn sạch các API key / webhook URL từng lưu trước đó trong `shop_settings` (khi Admin đăng nhập).
   */
  async purgeLegacySecretsFromDatabase(): Promise<string[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('shop_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['sepay', 'email_notifications', 'general']);
    if (error || !data) return [];

    const cleanedKeys: string[] = [];
    for (const row of data) {
      const { clean, hadSecrets } = sanitizeSettingEntry(row.setting_key, row.setting_value);
      if (hadSecrets) {
        const { error: updErr } = await supabase
          .from('shop_settings')
          .update({ setting_value: clean, updated_at: new Date().toISOString() })
          .eq('setting_key', row.setting_key);
        if (!updErr) {
          cleanedKeys.push(row.setting_key);
        }
      }
    }
    return cleanedKeys;
  },
};
