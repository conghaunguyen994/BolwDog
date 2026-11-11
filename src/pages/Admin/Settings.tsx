import React, { useEffect, useState } from 'react';
import { Save, Check, Building2, Store, Share2, ShieldCheck, QrCode } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { ShopSettings } from '../../types/settings';
import { initialSettings } from '../../services/mock/mockData';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs">Đang tải cấu hình shop...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
            Cài Đặt Tiệm & Cấu Hình Ngân Hàng
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Tất cả thông tin hiển thị ở footer, chi tiết liên hệ và tài khoản nhận cọc VietQR
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: General Shop Information */}
        <div className="cute-card p-6 space-y-4">
          <h2 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2 pb-3 border-b border-cute-border-light">
            <Store className="w-5 h-5 text-cute-pink-500" />
            <span>Thông tin thương hiệu tiệm</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Tên tiệm shop</label>
              <input
                type="text"
                value={settings.general_info.shop_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general_info: { ...settings.general_info, shop_name: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Tên chủ tiệm</label>
              <input
                type="text"
                value={settings.general_info.owner_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general_info: { ...settings.general_info, owner_name: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Hotline / Zalo liên hệ</label>
              <input
                type="text"
                value={settings.general_info.phone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general_info: { ...settings.general_info, phone: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Email chăm sóc khách hàng</label>
              <input
                type="email"
                value={settings.general_info.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general_info: { ...settings.general_info, email: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown mb-1">Địa chỉ xưởng & tiệm</label>
            <input
              type="text"
              value={settings.general_info.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general_info: { ...settings.general_info, address: e.target.value },
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown mb-1">Slogan / Lời giới thiệu ngắn</label>
            <input
              type="text"
              value={settings.general_info.tagline}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general_info: { ...settings.general_info, tagline: e.target.value },
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Bank Transfer & VietQR Configuration */}
        <div className="cute-card p-6 space-y-4">
          <h2 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2 pb-3 border-b border-cute-border-light">
            <Building2 className="w-5 h-5 text-rose-500" />
            <span>Tài khoản ngân hàng nhận tiền cọc (VietQR)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Tên ngân hàng</label>
              <input
                type="text"
                value={settings.bank_transfer.bank_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, bank_name: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Mã ngân hàng (VCB, MB, TCB, VPB...)</label>
              <input
                type="text"
                value={settings.bank_transfer.bank_code}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, bank_code: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Số tài khoản nhận tiền *</label>
              <input
                type="text"
                required
                value={settings.bank_transfer.account_number}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, account_number: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Tên chủ tài khoản (In hoa không dấu) *</label>
              <input
                type="text"
                required
                value={settings.bank_transfer.account_holder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, account_holder: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Phần trăm đặt cọc mặc định (%)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.bank_transfer.deposit_percentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, deposit_percentage: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-bold text-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Mã cú pháp chuyển khoản (Prefix)</label>
              <input
                type="text"
                value={settings.bank_transfer.transfer_note_prefix}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, transfer_note_prefix: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Social Media Links */}
        <div className="cute-card p-6 space-y-4">
          <h2 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2 pb-3 border-b border-cute-border-light">
            <Share2 className="w-5 h-5 text-cute-pink-500" />
            <span>Kênh mạng xã hội tiệm</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Facebook URL</label>
              <input
                type="url"
                value={settings.social_links.facebook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social_links: { ...settings.social_links, facebook: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">TikTok URL</label>
              <input
                type="url"
                value={settings.social_links.tiktok}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social_links: { ...settings.social_links, tiktok: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Instagram URL</label>
              <input
                type="url"
                value={settings.social_links.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social_links: { ...settings.social_links, instagram: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Lưu Toàn Bộ Cấu Hình Tiệm
          </Button>
        </div>
      </form>
    </div>
  );
};

