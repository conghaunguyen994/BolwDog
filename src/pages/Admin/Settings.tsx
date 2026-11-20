import React, { useEffect, useState } from 'react';
import {
  Save,
  Check,
  Building2,
  Store,
  Share2,
  Mail,
  Send,
  Copy,
  Zap,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Flame,
  Clock,
  Tag,
  Calendar,
  Truck,
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { productService } from '../../services/productService';
import { emailService } from '../../services/emailService';
import { sepayService } from '../../services/sepayService';
import {
  EmailNotificationConfig,
  FreeshipVoucherConfig,
  SaleCampaignConfig,
  ShopSettings,
} from '../../types/settings';
import { Product } from '../../types/product';
import { defaultShopSettings } from '../../constants/defaultSettings';
import { formatVND } from '../../utils/currency';
import {
  calculateDiscountedPrice,
  formatSaleDateTimeVN,
  fromDatetimeLocalInput,
  getSaleCountdown,
  getSaleStatus,
  normalizeDiscountPercentage,
  toDatetimeLocalInput,
} from '../../utils/sale';
import { useAppDispatch } from '../../app/hooks';
import {
  setDepositPercentage,
  setFreeshipVoucherConfig,
  setSaleCampaign,
} from '../../features/cart/cartSlice';
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
  const dispatch = useAppDispatch();
  const [settings, setSettings] = useState<ShopSettings>(defaultShopSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [testingSepay, setTestingSepay] = useState(false);
  const [sepayTestStatus, setSepayTestStatus] = useState<string | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedFreeshipCode, setCopiedFreeshipCode] = useState(false);
  const [dbCleanedNotice, setDbCleanedNotice] = useState<string | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [now, setNow] = useState<Date>(() => new Date());

  const sepayConfig = settings.sepay || defaultShopSettings.sepay!;
  const saleConfig: SaleCampaignConfig = {
    ...defaultShopSettings.sale_campaign!,
    ...(settings.sale_campaign || {}),
  };
  const freeshipConfig: FreeshipVoucherConfig = {
    ...defaultShopSettings.freeship_voucher!,
    ...(settings.freeship_voucher || {}),
  };

  const updateFreeshipConfig = (patch: Partial<FreeshipVoucherConfig>) => {
    setSettings({
      ...settings,
      freeship_voucher: {
        ...freeshipConfig,
        ...patch,
      },
    });
  };

  const updateSaleConfig = (patch: Partial<SaleCampaignConfig>) => {
    setSettings({
      ...settings,
      sale_campaign: {
        ...saleConfig,
        ...patch,
      },
    });
  };

  const applyQuickSaleDuration = (hours: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    updateSaleConfig({
      enabled: true,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    });
  };

  const toggleSaleProductId = (prodId: string) => {
    const currentIds = Array.isArray(saleConfig.product_ids) ? saleConfig.product_ids : [];
    const nextIds = currentIds.includes(prodId)
      ? currentIds.filter((id) => id !== prodId)
      : [...currentIds, prodId];
    updateSaleConfig({ product_ids: nextIds });
  };

  const siteOrigin =
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.origin.includes('localhost') &&
    !window.location.origin.includes('127.0.0.1')
      ? window.location.origin
      : 'https://bowlshop.vercel.app';

  const webhookUrl = `${siteOrigin}/api/sepay-webhook`;

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  const handleTestSepay = async () => {
    setTestingSepay(true);
    setSepayTestStatus(null);
    try {
      const res = await sepayService.verifySepayConnection();
      if (res.ok) {
        setSepayTestStatus(`✅ ${res.message}`);
      } else {
        setSepayTestStatus(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setSepayTestStatus(`❌ Lỗi kết nối: ${err.message}`);
    } finally {
      setTestingSepay(false);
    }
  };

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
    settingsService.purgeLegacySecretsFromDatabase().then((cleaned) => {
      if (cleaned.length > 0) {
        setDbCleanedNotice(
          `Đã tự động xóa các API Key cũ lưu trước đó trong DB (${cleaned.join(', ')}). Tất cả API Key hiện chỉ đọc từ file .env.`
        );
      }
    });
    Promise.all([
      settingsService.getSettings(),
      productService.getProducts({ activeOnly: false }).catch(() => [] as Product[]),
    ]).then(([s, prods]) => {
      setSettings(s);
      setShopProducts(prods);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleConfig.enabled) {
      const pct = normalizeDiscountPercentage(saleConfig.discount_percentage);
      if (pct < 1 || pct > 90) {
        alert('Phần trăm giảm giá Sale phải nằm trong khoảng từ 1% đến 90%.');
        return;
      }
      if (saleConfig.start_at && saleConfig.end_at) {
        const startMs = new Date(saleConfig.start_at).getTime();
        const endMs = new Date(saleConfig.end_at).getTime();
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
          alert('Thời gian kết thúc Sale phải sau thời gian bắt đầu!');
          return;
        }
      }
      if (
        saleConfig.apply_scope === 'selected_products' &&
        (!Array.isArray(saleConfig.product_ids) || saleConfig.product_ids.length === 0)
      ) {
        alert('Vui lòng tích chọn ít nhất 1 sản phẩm khi chọn phạm vi "Chọn riêng từng sản phẩm".');
        return;
      }
    }

    if (freeshipConfig.enabled && !String(freeshipConfig.code || '').trim()) {
      alert('Vui lòng nhập mã Freeship (ví dụ: bowlfreeship) trước khi bật hiệu lực!');
      return;
    }

    setSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      if (updated.bank_transfer && typeof updated.bank_transfer.deposit_percentage === 'number') {
        dispatch(setDepositPercentage(updated.bank_transfer.deposit_percentage));
      }
      dispatch(setSaleCampaign(updated.sale_campaign || null));
      dispatch(setFreeshipVoucherConfig(updated.freeship_voucher || null));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const saleStatus = getSaleStatus(saleConfig, now);
  const saleCountdown =
    saleStatus === 'active'
      ? getSaleCountdown(saleConfig.end_at, now)
      : saleStatus === 'upcoming'
        ? getSaleCountdown(saleConfig.start_at, now)
        : null;
  const previewDiscountPct = normalizeDiscountPercentage(saleConfig.discount_percentage);

  if (loading) {
    return <div className="p-8 text-center text-xs">Đang tải cấu hình shop...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
            Cài Đặt Tiệm, Chương Trình Sale & Ngân Hàng
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Quản lý chiến dịch giảm giá theo khung giờ, thông tin tiệm và tài khoản nhận cọc VietQR
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      {dbCleanedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{dbCleanedNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 0: Flash Sale / Discount Campaign by Date & Time */}
        <div className="cute-card p-6 space-y-5 border-2 border-rose-300 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30 dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-200">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
                <Flame className="w-5 h-5 fill-amber-200" />
              </div>
              <div>
                <h2 className="text-base font-black text-cute-brown dark:text-cute-cream flex items-center gap-2">
                  <span>Chương Trình Sale Giảm Giá Theo Ngày Giờ (Flash Sale)</span>
                </h2>
                <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                  Tự động kích hoạt giảm giá đúng ngày giờ bắt đầu và tự động tắt khi hết giờ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Live Status Badge */}
              {saleStatus === 'active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    ĐANG SALE -{previewDiscountPct}%
                    {saleCountdown?.shortLabel ? ` (Còn ${saleCountdown.shortLabel})` : ''}
                  </span>
                </span>
              )}
              {saleStatus === 'upcoming' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    SẮP DIỄN RA
                    {saleCountdown?.shortLabel ? ` (Sau ${saleCountdown.shortLabel})` : ''}
                  </span>
                </span>
              )}
              {saleStatus === 'expired' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xs font-extrabold">
                  <span>ĐÃ KẾT THÚC KHUNG GIỜ SALE</span>
                </span>
              )}
              {saleStatus === 'disabled' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">
                  <span>Đang tắt Sale</span>
                </span>
              )}

              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold cursor-pointer shadow-sm transition-colors">
                <input
                  type="checkbox"
                  checked={saleConfig.enabled}
                  onChange={(e) => updateSaleConfig({ enabled: e.target.checked })}
                  className="rounded text-rose-700 focus:ring-white"
                />
                <span>Bật chương trình Sale</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tên chương trình */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Tên chương trình khuyến mãi (hiển thị trên Banner & Trang sản phẩm) *
              </label>
              <input
                type="text"
                value={saleConfig.title}
                onChange={(e) => updateSaleConfig({ title: e.target.value })}
                placeholder="Ví dụ: 🔥 FLASH SALE YÊU THƯƠNG"
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-bold"
              />
            </div>

            {/* Phần trăm giảm giá */}
            <div>
              <label className="block text-xs font-bold text-rose-600 mb-1">
                Mức giảm giá (% từ 1% đến 90%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={saleConfig.discount_percentage}
                  onChange={(e) =>
                    updateSaleConfig({
                      discount_percentage: Math.min(90, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full px-3.5 py-2 pr-10 rounded-xl border-2 border-rose-300 text-sm bg-white focus:outline-none font-black text-rose-600"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-rose-500">
                  %
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10, 15, 20, 25, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => updateSaleConfig({ discount_percentage: pct })}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                      saleConfig.discount_percentage === pct
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-cute-brown border-cute-border-light hover:border-rose-300'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Thời gian Bắt đầu & Kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/80 dark:bg-cute-cream-dark/40 border border-rose-200">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Bắt đầu Sale từ (Ngày & Giờ) *</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalInput(saleConfig.start_at)}
                onChange={(e) =>
                  updateSaleConfig({ start_at: fromDatetimeLocalInput(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-semibold"
              />
              <span className="text-[10px] text-cute-brown-light mt-1 block">
                Đang chọn: <strong>{formatSaleDateTimeVN(saleConfig.start_at)}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Kết thúc Sale lúc (Ngày & Giờ) *</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalInput(saleConfig.end_at)}
                onChange={(e) =>
                  updateSaleConfig({ end_at: fromDatetimeLocalInput(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-semibold"
              />
              <span className="text-[10px] text-cute-brown-light mt-1 block">
                Đang chọn: <strong>{formatSaleDateTimeVN(saleConfig.end_at)}</strong>
              </span>
            </div>

            {/* Nút chọn nhanh khung giờ */}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1 border-t border-cute-border-light/60">
              <span className="text-[11px] font-bold text-cute-brown-light">Cài nhanh khung giờ từ bây giờ:</span>
              <button
                type="button"
                onClick={() => applyQuickSaleDuration(6)}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold transition-colors"
              >
                ⚡ Flash Sale 6 giờ
              </button>
              <button
                type="button"
                onClick={() => applyQuickSaleDuration(24)}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold transition-colors"
              >
                🔥 Sale 24 giờ (1 ngày)
              </button>
              <button
                type="button"
                onClick={() => applyQuickSaleDuration(72)}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold transition-colors"
              >
                🎉 Sale 3 ngày
              </button>
              <button
                type="button"
                onClick={() => applyQuickSaleDuration(168)}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold transition-colors"
              >
                🌟 Sale 7 ngày (1 tuần)
              </button>
            </div>
          </div>

          {/* Thông điệp Banner & Phạm vi áp dụng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Lời nhắn trên thanh Banner đếm ngược đầu trang
              </label>
              <input
                type="text"
                value={saleConfig.banner_message || ''}
                onChange={(e) => updateSaleConfig({ banner_message: e.target.value })}
                placeholder="Ví dụ: Ưu đãi đặc biệt cho các bé cưng — Đặt ngay kẻo lỡ!"
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Phạm vi sản phẩm áp dụng giảm giá
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSaleConfig({ apply_scope: 'all' })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    (saleConfig.apply_scope || 'all') === 'all'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-cute-brown border-cute-border-light'
                  }`}
                >
                  🐾 Toàn bộ sản phẩm của shop
                </button>
                <button
                  type="button"
                  onClick={() => updateSaleConfig({ apply_scope: 'selected_products' })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    saleConfig.apply_scope === 'selected_products'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-cute-brown border-cute-border-light'
                  }`}
                >
                  🎯 Chọn riêng từng sản phẩm
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách chọn sản phẩm khi apply_scope === 'selected_products' */}
          {saleConfig.apply_scope === 'selected_products' && (
            <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cute-brown flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    Tích chọn các sản phẩm được giảm giá ({saleConfig.product_ids?.length || 0} đã chọn):
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSaleConfig({
                      product_ids:
                        (saleConfig.product_ids?.length || 0) === shopProducts.length
                          ? []
                          : shopProducts.map((p) => p.id),
                    })
                  }
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  {(saleConfig.product_ids?.length || 0) === shopProducts.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {shopProducts.map((prod) => {
                  const checked = Boolean(saleConfig.product_ids?.includes(prod.id));
                  return (
                    <label
                      key={prod.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        checked
                          ? 'bg-rose-50 border-rose-300 font-bold text-cute-brown'
                          : 'bg-cute-cream/30 border-cute-border-light text-cute-brown-light'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSaleProductId(prod.id)}
                          className="rounded text-rose-500"
                        />
                        <span className="truncate">{prod.name}</span>
                      </div>
                      <span className="text-rose-500 font-extrabold whitespace-nowrap">
                        {formatVND(calculateDiscountedPrice(prod.price, previewDiscountPct))}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bảng xem trước giá giảm trực tiếp */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900 dark:text-rose-200">
                👀 Xem trước bảng giá Bát Ăn 5 Size sau khi giảm {previewDiscountPct}%:
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                Tự động đồng bộ từ Trang chủ, Chi tiết, Giỏ hàng đến Thanh toán & Database
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                { label: 'Size S', price: 199000 },
                { label: 'Size M', price: 229000 },
                { label: 'Size L', price: 259000 },
                { label: 'Size XL', price: 300000 },
                { label: 'Size XXL', price: 350000 },
              ].map((sz) => {
                const afterSale = calculateDiscountedPrice(sz.price, previewDiscountPct);
                return (
                  <div
                    key={sz.label}
                    className="p-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-rose-200/80 shadow-xs"
                  >
                    <span className="text-[11px] font-extrabold text-cute-brown block">
                      {sz.label}
                    </span>
                    <span className="text-[10px] text-cute-brown-light line-through block">
                      {formatVND(sz.price)}
                    </span>
                    <span className="text-xs font-black text-rose-600 block">
                      {formatVND(afterSale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 0B: Freeship Voucher Code Configuration (bowlfreeship) */}
        <div className="cute-card p-6 space-y-4 border-2 border-emerald-300 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-cute-brown dark:text-cute-cream">
                  Mã Giảm Giá Phí Vận Chuyển (Freeship Voucher)
                </h2>
                <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                  Khi bật lên, khách hàng nhập mã <strong className="text-emerald-700">{freeshipConfig.code || 'bowlfreeship'}</strong> sẽ được miễn phí vận chuyển 100%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {freeshipConfig.enabled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>MÃ ĐANG CÓ HIỆU LỰC ({freeshipConfig.code || 'bowlfreeship'})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">
                  <span>Đang tắt (Khách nhập mã sẽ không áp dụng)</span>
                </span>
              )}

              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shadow-sm transition-colors">
                <input
                  type="checkbox"
                  checked={freeshipConfig.enabled}
                  onChange={(e) => updateFreeshipConfig({ enabled: e.target.checked })}
                  className="rounded text-emerald-700 focus:ring-white"
                />
                <span>Bật hiệu lực mã Freeship</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Mã giảm giá phí vận chuyển (Không phân biệt chữ hoa / chữ thường) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={freeshipConfig.code}
                  onChange={(e) =>
                    updateFreeshipConfig({ code: e.target.value.replace(/\s+/g, '') })
                  }
                  placeholder="bowlfreeship"
                  className="flex-1 px-3.5 py-2 rounded-xl border-2 border-emerald-300 text-xs bg-white focus:outline-none font-black text-emerald-800 tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(freeshipConfig.code || 'bowlfreeship')
                      .catch(() => {});
                    setCopiedFreeshipCode(true);
                    setTimeout(() => setCopiedFreeshipCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedFreeshipCode ? 'Đã copy!' : 'Copy mã'}</span>
                </button>
                {freeshipConfig.code !== 'bowlfreeship' && (
                  <button
                    type="button"
                    onClick={() => updateFreeshipConfig({ code: 'bowlfreeship' })}
                    className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold whitespace-nowrap"
                  >
                    Đặt lại bowlfreeship
                  </button>
                )}
              </div>
              <span className="text-[10px] text-cute-brown-light mt-1 block">
                Mặc định: <strong>bowlfreeship</strong> — Giảm 100% phí vận chuyển (30.000 ₫ → 0 ₫) ngay cả với đơn dưới 500.000 ₫.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Ghi chú / Mô tả chương trình Freeship
              </label>
              <input
                type="text"
                value={freeshipConfig.description || ''}
                onChange={(e) => updateFreeshipConfig({ description: e.target.value })}
                placeholder="Miễn phí 100% phí vận chuyển toàn quốc khi nhập mã bowlfreeship"
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
              <span className="text-[10px] text-cute-brown-light mt-1 block">
                🔒 Được kiểm tra đồng thời ở cả trình duyệt (Giỏ hàng / Thanh toán) lẫn hàm tạo đơn trên Supabase Database.
              </span>
            </div>
          </div>
        </div>

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
                onChange={(e) => {
                  const nextAcc = e.target.value;
                  const oldAcc = settings.bank_transfer.account_number;
                  const shouldSyncSepay =
                    !sepayConfig.account_number ||
                    sepayConfig.account_number === oldAcc ||
                    sepayConfig.account_number === '5801769728';
                  setSettings({
                    ...settings,
                    bank_transfer: { ...settings.bank_transfer, account_number: nextAcc },
                    sepay: shouldSyncSepay
                      ? { ...sepayConfig, account_number: nextAcc }
                      : settings.sepay,
                  });
                }}
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
                min={0}
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

        {/* Section 2.5: SePay Payment Gateway Integration */}
        <div className="cute-card p-6 space-y-5 border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-emerald-500 text-white shadow-sm">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
                  <span>Cổng Thanh Toán Tự Động SePay (VietQR Nhận Diện 24/7)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Auto Webhook
                  </span>
                </h2>
                <p className="text-xs text-cute-brown-light dark:text-cute-muted">
                  Tự động phát hiện khi khách chuyển khoản cọc, đối soát mã đơn hàng và cập nhật trạng thái trong 3-5 giây
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer bg-emerald-100/70 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-300">
              <input
                type="checkbox"
                checked={sepayConfig.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sepay: {
                      ...sepayConfig,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Bật tự động xác nhận chuyển khoản SePay</span>
            </label>
          </div>

          {/* Webhook Endpoint Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
                <span>📍 Đường link Webhook nhận dữ liệu từ SePay:</span>
              </label>
              <button
                type="button"
                onClick={handleCopyWebhookUrl}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors self-start sm:self-auto"
              >
                {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhookUrl ? 'Đã sao chép Link Webhook' : 'Sao chép Link Webhook'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cute-border-light bg-cute-cream/30 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 select-all"
              />
            </div>
            <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
              💡 Hãy dán đúng link <strong className="font-mono text-emerald-800">{webhookUrl}</strong> vào mục <strong>Cài đặt Webhook</strong> trên{' '}
              <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="underline font-bold">
                my.sepay.vn
              </a>
              .
            </p>
          </div>

          {/* Environment Security Notice & Server Connection Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border-2 border-emerald-200 dark:border-emerald-800 space-y-2.5 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-cute-brown dark:text-cute-cream">
                    Bảo mật API Key trong biến môi trường (.env Server-Only)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://my.sepay.vn"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Mở SePay.vn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestSepay}
                    isLoading={testingSepay}
                    className="border-emerald-400 text-emerald-800 hover:bg-emerald-100 flex-shrink-0"
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${testingSepay ? 'animate-spin' : ''}`} />}
                  >
                    Kiểm tra kết nối SePay Server (.env)
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
                🔒 Để chống lộ khóa qua trình duyệt hoặc Database, <code className="bg-emerald-50 px-1 rounded font-bold text-emerald-800">SEPAY_API_KEY</code> và <code className="bg-emerald-50 px-1 rounded font-bold text-emerald-800">SUPABASE_SERVICE_ROLE_KEY</code> chỉ lưu trong file <code className="bg-emerald-50 px-1 rounded font-bold text-emerald-800">.env</code> (local) và <strong>Vercel Environment Variables</strong> (production). Không lưu hay nhập API Key trên giao diện web này.
              </p>
              {sepayTestStatus && (
                <p className="text-[11px] font-bold mt-1 text-emerald-800 dark:text-emerald-300">
                  {sepayTestStatus}
                </p>
              )}
            </div>

            {/* Số tài khoản SePay */}
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Số tài khoản ngân hàng kết nối SePay
              </label>
              <input
                type="text"
                placeholder={settings.bank_transfer.account_number || '0345553913'}
                value={sepayConfig.account_number || settings.bank_transfer.account_number}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sepay: { ...sepayConfig, account_number: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono"
              />
            </div>

            {/* Tiền tố cú pháp */}
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">
                Tiền tố nội dung nhận diện đơn (Mặc định: BD)
              </label>
              <input
                type="text"
                value={sepayConfig.pattern_prefix || 'BD'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sepay: { ...sepayConfig, pattern_prefix: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 text-emerald-950 dark:text-emerald-200">
            <span className="font-extrabold block text-emerald-900 dark:text-emerald-300">
              📋 Hướng dẫn 4 bước kích hoạt SePay an toàn qua .env:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed opacity-95">
              <li>
                Truy cập <strong>https://my.sepay.vn</strong> và liên kết tài khoản ngân hàng (ví dụ MB Bank <strong>{settings.bank_transfer.account_number}</strong>).
              </li>
              <li>
                Vào <strong>Cấu hình Công ty &gt; API Access</strong> trên SePay để lấy <strong>API Token</strong>, rồi dán vào biến <code>SEPAY_API_KEY</code> trong file <code>.env</code> và mục <strong>Vercel Environment Variables</strong> (kèm <code>SUPABASE_SERVICE_ROLE_KEY</code>).
              </li>
              <li>
                Vào mục <strong>Tích hợp Webhooks</strong> trên SePay ➔ dán link Webhook ở trên vào ô URL, chọn sự kiện <strong>Có tiền vào</strong>, mục <em>&ldquo;Bỏ qua nếu nội dung không có code thanh toán&rdquo;</em> chọn <strong>Không</strong> (có thể chọn chứng thực API Key với <code>SEPAY_API_KEY</code> hoặc để server tự đối chiếu trực tiếp).
              </li>
              <li>
                Bấm nút <strong>Kiểm tra kết nối SePay Server (.env)</strong> bên trên để xác nhận server đọc biến môi trường thành công!
              </li>
            </ol>
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

          <div>
            <label className="block text-xs font-bold text-cute-brown mb-1">
              Tên miền Website chính thức (Gắn vào nút trong Email gửi khách):
            </label>
            <input
              type="url"
              value={emailConfig.production_site_url || ''}
              onChange={(e) => updateEmailConfig({ production_site_url: e.target.value })}
              placeholder="https://bowlshop.vercel.app"
              className="w-full px-3.5 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono"
            />
            <span className="text-[10px] text-cute-brown-light dark:text-cute-muted">
              Đường dẫn này được tự động gắn vào nút bấm duyệt Demo 3D để khách hàng mở trên điện thoại hay bất kỳ đâu cũng bấm vào xem được.
            </span>
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

          {/* Email Webhook / EmailJS Server-Only Env Notice */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-purple-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Cấu hình Email Webhook / EmailJS đã chuyển sang biến môi trường (.env Server-Only)</span>
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
            <p className="text-[11px] text-purple-900 leading-relaxed">
              🔒 Link Google Apps Script (<code className="bg-white px-1 rounded font-bold">EMAIL_WEBHOOK_URL</code>) và các khóa EmailJS (<code className="bg-white px-1 rounded font-bold">EMAILJS_SERVICE_ID</code>, <code className="bg-white px-1 rounded font-bold">EMAILJS_TEMPLATE_ID</code>, <code className="bg-white px-1 rounded font-bold">EMAILJS_PUBLIC_KEY</code>, <code className="bg-white px-1 rounded font-bold">EMAILJS_PRIVATE_KEY</code>) hiện được đọc trực tiếp từ <strong>.env / Vercel Environment Variables</strong> và gửi qua API <code className="bg-white px-1 rounded">/api/send-email</code>. Nếu để trống trên server, hệ thống tự động dự phòng qua FormSubmit Relay.
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

