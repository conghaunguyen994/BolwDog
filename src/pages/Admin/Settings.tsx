import React, { useEffect, useState } from 'react';
import { Save, Check, Building2, Store, Share2, Mail, Send, Copy } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { emailService } from '../../services/emailService';
import { EmailNotificationConfig, ShopSettings } from '../../types/settings';
import { defaultShopSettings } from '../../constants/defaultSettings';
import { Button } from '../../components/common/Button';

const GOOGLE_APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  MailApp.sendEmail({
    to: data.to,
    cc: data.cc || "",
    replyTo: data.replyTo || "",
    subject: data.subject,
    body: data.textBody,
    htmlBody: data.htmlBody
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}`;

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultShopSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const emailConfig: EmailNotificationConfig = {
    ...defaultShopSettings.email_notifications!,
    ...(settings.email_notifications || {}),
  };

  const updateEmailConfig = (patch: Partial<EmailNotificationConfig>) => {
    setSettings({
      ...settings,
      email_notifications: {
        ...emailConfig,
        ...patch,
      },
    });
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await emailService.sendTestEmail(emailConfig);
      if (res.ok) {
        setTestEmailStatus(
          `✅ Đã gửi email kiểm tra tới ${emailConfig.admin_email} (Kênh: ${res.channel}). Hãy kiểm tra hộp thư của bạn (kể cả mục Quảng cáo/Spam lần đầu)!`
        );
      } else {
        setTestEmailStatus(`⚠️ Chưa gửi được tự động: ${res.error || 'Vui lòng kiểm tra lại cấu hình.'}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`❌ Lỗi: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

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

        {/* Section 4: Two-Way Email Notification System (User <-> Admin) */}
        <div className="cute-card p-6 space-y-4 border-2 border-purple-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cute-border-light">
            <h2 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              <span>Thông báo Email Tự Động 2 Chiều (Khách hàng ⇄ Admin)</span>
            </h2>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.enabled}
                onChange={(e) => updateEmailConfig({ enabled: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-400"
              />
              <span>Bật gửi thông báo Email tự động</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Email Admin nhận thông báo (Khi khách đặt đơn / yêu cầu sửa file 3D) *
              </label>
              <input
                type="email"
                value={emailConfig.admin_email}
                onChange={(e) => updateEmailConfig({ admin_email: e.target.value })}
                placeholder="conghaunguyen994@gmail.com.vn"
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Email Admin dự phòng (CC nhận đồng thời)
              </label>
              <input
                type="email"
                value={emailConfig.admin_backup_email || ''}
                onChange={(e) => updateEmailConfig({ admin_backup_email: e.target.value })}
                placeholder="conghaunguyen994@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Tùy chọn các sự kiện gửi email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-cute-cream/50 border border-cute-border-light cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.notify_on_new_order}
                onChange={(e) => updateEmailConfig({ notify_on_new_order: e.target.checked })}
              />
              <span>🛒 Báo Email khi có <strong>Đơn đặt hàng mới</strong> (cho cả Admin & Khách)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-cute-cream/50 border border-cute-border-light cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.notify_on_demo_sent}
                onChange={(e) => updateEmailConfig({ notify_on_demo_sent: e.target.checked })}
              />
              <span>🎨 Báo Email cho Khách khi Admin <strong>Gửi bản Demo file 3D</strong></span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-cute-cream/50 border border-cute-border-light cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.notify_on_demo_review}
                onChange={(e) => updateEmailConfig({ notify_on_demo_review: e.target.checked })}
              />
              <span>✏️ Báo Email về Admin khi Khách <strong>Yêu cầu sửa file 3D / Chốt in</strong></span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-cute-cream/50 border border-cute-border-light cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.notify_on_status_change}
                onChange={(e) => updateEmailConfig({ notify_on_status_change: e.target.checked })}
              />
              <span>📦 Báo Email cho Khách khi đơn <strong>Đổi trạng thái (Đang in / Giao hàng)</strong></span>
            </label>
          </div>

          {/* Google Apps Script Webhook (Không lưu key ở .env, gửi bằng chính Gmail chủ tiệm) */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-purple-900">
                Link Google Apps Script / Webhook gửi Email 2 chiều (Tùy chọn – Khuyên dùng để gửi từ chính Gmail của bạn tới mọi khách hàng):
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SNIPPET).catch(() => {});
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 3000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-700 font-bold text-[11px] hover:bg-purple-100"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedScript ? 'Đã copy mã Google Script!' : 'Copy mã Google Apps Script (10 dòng)'}</span>
              </button>
            </div>
            <input
              type="url"
              value={emailConfig.webhook_url || ''}
              onChange={(e) => updateEmailConfig({ webhook_url: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec (Nếu để trống, hệ thống tự động dùng FormSubmit Relay)"
              className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
            />
            <p className="text-[11px] text-purple-800 leading-relaxed">
              💡 <strong>Mặc định:</strong> Hệ thống đã hoạt động sẵn qua <em>FormSubmit AJAX Relay</em> mà không cần cấu hình thêm. Nếu muốn gửi bằng chính địa chỉ Gmail cá nhân tới hộp thư mọi khách hàng: chỉ cần vào <code>script.google.com</code> → Tạo dự án mới → Dán đoạn mã 10 dòng ở nút trên → Bấm <strong>Triển khai (Deploy) &gt; Ứng dụng web (Anyone)</strong> rồi dán link vào ô này và bấm Lưu! (Mọi cấu hình lưu trong Database bảo mật, hoàn toàn không lưu ở <code>.env</code>).
            </p>
          </div>

          {testEmailStatus && (
            <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900">
              {testEmailStatus}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={testingEmail}
              onClick={handleTestEmail}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Gửi Email Thử Nghiệm Tới Admin Ngay
            </Button>
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

