import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Download,
  ShoppingBag,
  Heart,
  Eye,
  ShieldCheck,
  Check,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { PetCustomization } from '../../types/order';
import { ProductVariant } from '../../types/product';
import { formatVND } from '../../utils/currency';

interface BowlDemoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: PetCustomization;
  selectedVariant?: ProductVariant;
  unitPrice: number;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
}

type ViewAngle = 'front' | 'side' | 'top';

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  // Check if YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return dateStr;
}

export const BowlDemoPreviewModal: React.FC<BowlDemoPreviewModalProps> = ({
  isOpen,
  onClose,
  customization,
  selectedVariant,
  unitPrice,
  onAddToCart,
  onBuyNow,
}) => {
  const [activeAngle, setActiveAngle] = useState<ViewAngle>('front');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const topColorHex = customization.bodyColorHex || '#FFFFFF';
  const topColorName = customization.bodyColor || 'Trắng Sứ';
  const bottomColorHex = customization.baseColorHex || '#1A7B8E';
  const bottomColorName = customization.baseColor || 'Xanh Cổ Vịt (Mẫu Ngáo)';
  const petName = customization.petName || 'Ngáo';
  const icons = customization.selectedIcons && customization.selectedIcons.length > 0
    ? customization.selectedIcons
    : ['🐶', '🐾'];
  const birthdayDisplay = formatDisplayDate(customization.petBirthday);

  // Auto match embossed text color with bottom base color or contrast
  const textColor = customization.textColor || (
    bottomColorHex.toLowerCase() === '#ffffff'
      ? topColorHex.toLowerCase() === '#ffffff' ? '#1A7B8E' : '#3B251B'
      : bottomColorHex
  );

  const variantValue = selectedVariant?.variant_value || 'Size S : H1: 12 cm - H2: 8cm - D: 18cm (Bát inox Ø14cm)';
  const isTilted = !variantValue.includes('XL') && !variantValue.includes('XXL');

  // Handle Export / Download Image of Demo
  const handleDownloadDemo = () => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 1000);
    bgGrad.addColorStop(0, '#FFFDF9');
    bgGrad.addColorStop(0.5, '#FDF2F4');
    bgGrad.addColorStop(1, '#F3E8FF');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 1000);

    // Decorative background pattern
    ctx.strokeStyle = 'rgba(230, 200, 215, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 940, 940);

    // 2. Header / Brand
    ctx.fillStyle = '#E11D48';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BÂU SHOP - BÁT ĂN CHỐNG GÙ & CHỐNG KIẾN', 500, 90);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Bản Xem Trước Thiết Kế Cá Nhân Hóa (Demo 3D)', 500, 125);

    // 3. Draw Bowl Simulation
    const centerY = 450;

    // A. Stainless Steel Bowl (Top Lip)
    const inoxGrad = ctx.createLinearGradient(350, centerY - 130, 650, centerY - 70);
    inoxGrad.addColorStop(0, '#E2E8F0');
    inoxGrad.addColorStop(0.3, '#FFFFFF');
    inoxGrad.addColorStop(0.7, '#CBD5E1');
    inoxGrad.addColorStop(1, '#94A3B8');

    ctx.fillStyle = inoxGrad;
    ctx.beginPath();
    ctx.ellipse(500, centerY - 95, 170, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner rim
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.ellipse(500, centerY - 95, 145, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('BÁT INOX 304 DỄ VỆ SINH', 500, centerY - 90);

    // B. Bowl Upper Body
    ctx.fillStyle = topColorHex;
    ctx.beginPath();
    // Trapezoid shape for 3D body
    ctx.moveTo(330, centerY - 80);
    ctx.lineTo(670, centerY - 80);
    ctx.lineTo(710, centerY + 80);
    ctx.lineTo(290, centerY + 80);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shading on body
    const bodyShade = ctx.createLinearGradient(290, centerY, 710, centerY);
    bodyShade.addColorStop(0, 'rgba(0,0,0,0.12)');
    bodyShade.addColorStop(0.15, 'rgba(255,255,255,0.25)');
    bodyShade.addColorStop(0.85, 'rgba(0,0,0,0.02)');
    bodyShade.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = bodyShade;
    ctx.beginPath();
    ctx.moveTo(330, centerY - 80);
    ctx.lineTo(670, centerY - 80);
    ctx.lineTo(710, centerY + 80);
    ctx.lineTo(290, centerY + 80);
    ctx.closePath();
    ctx.fill();

    // C. Anti-ant Water Moat Base
    ctx.fillStyle = bottomColorHex;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(260, centerY + 70, 480, 50, 25) : ctx.rect(260, centerY + 70, 480, 50);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Water ring caption
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('💧 ĐẾ CHỐNG KIẾN VỚI KHOANG CHỨA NƯỚC', 500, centerY + 102);

    // D. Printed Inscription (Pet Name + Icons + Birthday)
    ctx.fillStyle = textColor;
    ctx.font = 'bold 44px sans-serif';
    const textStr = `${icons[0] || ''}  ${petName}  ${icons[1] || ''}`;
    ctx.fillText(textStr.trim(), 500, centerY - 5);

    if (birthdayDisplay) {
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`🎂 ${birthdayDisplay}`, 500, centerY + 38);
    } else {
      ctx.font = 'italic 16px sans-serif';
      ctx.fillText(isTilted ? '🌸 Thiết kế nghiêng 15° chống gù' : '🌸 Bát ăn chống gù chống kiến', 500, centerY + 38);
    }

    // 4. Details Table at Bottom
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.roundRect(80, 680, 840, 240, 20);
    } else {
      ctx.rect(80, 680, 840, 240);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📋 THÔNG SỐ BÁT ĐÃ THIẾT KẾ:', 110, 725);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`• Kích cỡ: ${variantValue}`, 110, 765);
    ctx.fillText(`• Màu ở trên (Thân): ${topColorName} (${topColorHex})`, 110, 800);
    ctx.fillText(`• Màu ở dưới (Đế chống kiến): ${bottomColorName} (${bottomColorHex})`, 110, 835);
    ctx.fillText(`• Tên cún: "${petName}" | Icon: ${icons.join(' ')} ${birthdayDisplay ? `| Ngày sinh: ${birthdayDisplay}` : ''}`, 110, 870);

    ctx.fillStyle = '#E11D48';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Tổng: ${formatVND(unitPrice)}`, 880, 885);

    // Download trigger
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `bau-shop-demo-${petName || 'bat-an'}.png`;
      a.click();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      console.error('Lỗi khi tải ảnh demo:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-cute-surface-dark rounded-4xl shadow-2xl border-2 border-cute-pink/40 dark:border-cute-border-dark flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-cute-surface-dark/95 backdrop-blur-md border-b border-cute-border-light dark:border-cute-border-dark">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-cute-brown dark:text-cute-cream font-sans">
                Review Mẫu Demo Bát Ăn 3D - Bâu Shop
              </h3>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                Xem trực quan mẫu bát đã phối màu, chữ viết tên cún, icon và ngày sinh trước khi chốt đơn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cute-cream hover:bg-cute-peach/50 dark:bg-cute-cream-dark text-cute-brown dark:text-cute-cream flex items-center justify-center transition-all"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Angle Toggle Pills */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-cute-brown-light dark:text-cute-muted mr-1">
              Góc nhìn:
            </span>
            <button
              type="button"
              onClick={() => setActiveAngle('front')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAngle === 'front'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-cute-cream dark:bg-cute-cream-dark/60 text-cute-brown dark:text-cute-cream hover:bg-cute-peach/40'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chính diện (Front 3D)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAngle('side')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAngle === 'side'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-cute-cream dark:bg-cute-cream-dark/60 text-cute-brown dark:text-cute-cream hover:bg-cute-peach/40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Góc nghiêng 15°</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAngle('top')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAngle === 'top'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-cute-cream dark:bg-cute-cream-dark/60 text-cute-brown dark:text-cute-cream hover:bg-cute-peach/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Từ trên xuống (Lòng inox & rãnh nước)</span>
            </button>
          </div>

          {/* Interactive Visual Stage */}
          <div className="relative rounded-3xl p-6 sm:p-10 border-2 border-dashed border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-[#FFFDF9] via-[#FDF2F4] to-[#F7EEFA] dark:from-cute-surface-dark dark:to-cute-cream-dark/30 flex flex-col items-center justify-center min-h-[340px] shadow-inner overflow-hidden">
            {/* Ambient Lighting Background */}
            <div
              style={{ backgroundColor: `${bottomColorHex}25` }}
              className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none -top-10 -right-10"
            />
            <div
              style={{ backgroundColor: `${topColorHex}30` }}
              className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none -bottom-10 -left-10"
            />

            {/* View 1: FRONT 3D VIEW */}
            {activeAngle === 'front' && (
              <div className="relative z-10 flex flex-col items-center w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Metallic Inox Bowl Rim */}
                <div className="w-56 sm:w-68 h-12 rounded-t-full bg-gradient-to-b from-gray-200 via-gray-100 to-gray-400 border-2 border-gray-400 shadow-inner flex items-center justify-center relative -mb-3 z-20">
                  <div className="w-44 sm:w-56 h-7 rounded-full bg-gradient-to-b from-gray-400 via-gray-100 to-white shadow-inner flex items-center justify-center">
                    <span className="text-[10px] font-extrabold text-gray-600 tracking-wider">
                      ✨ BÁT INOX 304 THÁO RỜI VỆ SINH
                    </span>
                  </div>
                </div>

                {/* Upper Body (Màu ở trên) */}
                <div
                  style={{
                    backgroundColor: topColorHex,
                    borderColor: topColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : topColorHex,
                    boxShadow: `0 14px 28px -6px ${bottomColorHex}40, inset 0 -6px 12px rgba(0,0,0,0.08)`,
                  }}
                  className="w-68 sm:w-80 py-6 px-4 rounded-3xl border-2 flex flex-col items-center justify-center relative z-10 transition-all duration-300"
                >
                  {/* Subtle highlights */}
                  <div className="absolute top-2 left-6 right-6 h-3 rounded-full bg-white/20 blur-[1px]" />

                  {/* Embossed Pet Inscription */}
                  <div
                    style={{ color: textColor }}
                    className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black tracking-wide filter drop-shadow-sm select-none transition-colors duration-300 text-center"
                  >
                    {icons[0] && <span className="text-2xl sm:text-3xl">{icons[0]}</span>}
                    <span className="truncate max-w-[200px]">{petName || 'Ngáo'}</span>
                    {icons[1] && <span className="text-2xl sm:text-3xl">{icons[1]}</span>}
                  </div>

                  {/* Birthday in demo */}
                  {birthdayDisplay ? (
                    <div
                      style={{ color: textColor }}
                      className="mt-1 px-3 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🎂</span>
                      <span>{birthdayDisplay}</span>
                    </div>
                  ) : (
                    <span
                      style={{ color: textColor }}
                      className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase opacity-80 mt-1"
                    >
                      {isTilted ? '★ Nghiêng 15° Chống Gù Cổ ★' : '★ Đế Chống Kiến Thông Minh ★'}
                    </span>
                  )}
                </div>

                {/* Anti-ant Water Moat Base (Màu ở dưới) */}
                <div
                  style={{
                    backgroundColor: bottomColorHex,
                    borderColor: bottomColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : bottomColorHex,
                    boxShadow: '0 8px 20px -4px rgba(0,0,0,0.15)',
                  }}
                  className="w-76 sm:w-92 h-12 rounded-3xl border-2 flex items-center justify-center relative -mt-3 z-0 transition-all duration-300 shadow-md"
                >
                  <span
                    style={{
                      color: bottomColorHex.toLowerCase() === '#ffffff' ? '#1E293B' : '#FFFFFF',
                    }}
                    className="text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5"
                  >
                    <span>💧</span>
                    <span>KHOANG CHỨA NƯỚC CHỐNG KIẾN BÂU SHOP</span>
                    <span>💧</span>
                  </span>
                </div>
              </div>
            )}

            {/* View 2: SIDE 15° VIEW */}
            {activeAngle === 'side' && (
              <div className="relative z-10 flex flex-col items-center w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="text-center mb-3">
                  <span className="text-xs font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200">
                    {isTilted ? '🌸 Góc Nghiêng 15° Chuẩn Công Thái Học (Size S | M | L)' : '🌸 Dáng Đứng Phẳng Chắc Chắn (Size XL | XXL)'}
                  </span>
                </div>

                {/* Angled representation */}
                <div className="relative py-4 flex flex-col items-center">
                  <div
                    style={{
                      transform: isTilted ? 'rotate(-15deg)' : 'none',
                      backgroundColor: topColorHex,
                      borderColor: topColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : topColorHex,
                    }}
                    className="w-56 h-28 rounded-3xl border-2 shadow-lg flex flex-col items-center justify-center p-3 relative transition-all"
                  >
                    <div className="w-40 h-6 rounded-full bg-gradient-to-r from-gray-300 via-white to-gray-400 border border-gray-400 -mt-2 mb-2 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-600">LÒNG INOX SUS 304</span>
                    </div>
                    <div style={{ color: textColor }} className="text-base font-black truncate max-w-[150px]">
                      {icons[0]} {petName} {icons[1]}
                    </div>
                    {birthdayDisplay && (
                      <span style={{ color: textColor }} className="text-[10px] font-bold mt-0.5">
                        🎂 {birthdayDisplay}
                      </span>
                    )}
                  </div>

                  {/* Level bottom base with moat */}
                  <div
                    style={{
                      backgroundColor: bottomColorHex,
                      borderColor: bottomColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : bottomColorHex,
                    }}
                    className="w-68 h-10 rounded-2xl border-2 shadow-md flex items-center justify-center relative -mt-3 z-0"
                  >
                    <span
                      style={{
                        color: bottomColorHex.toLowerCase() === '#ffffff' ? '#1E293B' : '#FFFFFF',
                      }}
                      className="text-[10px] font-bold tracking-wide"
                    >
                      Rãnh nước chống kiến ngăn 100% côn trùng
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: TOP-DOWN VIEW */}
            {activeAngle === 'top' && (
              <div className="relative z-10 flex flex-col items-center w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="text-center mb-3">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200">
                    💧 Cấu trúc khoang chứa nước chống kiến bao quanh thân bát
                  </span>
                </div>

                {/* Nested circles representing top-down view */}
                <div
                  style={{
                    backgroundColor: bottomColorHex,
                    borderColor: bottomColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : bottomColorHex,
                  }}
                  className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 shadow-xl flex items-center justify-center relative transition-all"
                >
                  {/* Water moat groove */}
                  <div className="w-56 h-56 sm:w-62 sm:h-62 rounded-full border-2 border-dashed border-sky-300 bg-sky-100/50 flex items-center justify-center">
                    {/* Top bowl body ring */}
                    <div
                      style={{
                        backgroundColor: topColorHex,
                        borderColor: topColorHex.toLowerCase() === '#ffffff' ? '#CBD5E1' : topColorHex,
                      }}
                      className="w-48 h-48 sm:w-52 sm:h-52 rounded-full border-2 shadow-inner flex items-center justify-center"
                    >
                      {/* Stainless Steel Bowl Core */}
                      <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-gray-400 via-gray-100 to-white border-2 border-gray-400 shadow-inner flex flex-col items-center justify-center p-2 text-center">
                        <span className="text-xl">🐾</span>
                        <span className="text-[10px] font-extrabold text-gray-700 tracking-wider">
                          INOX 304
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {variantValue.includes('XL') || variantValue.includes('XXL') ? 'Ø 18-20cm' : 'Ø 14cm'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Color & Specification Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color summary */}
            <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark space-y-3">
              <h4 className="text-xs font-black uppercase text-cute-brown dark:text-cute-cream tracking-wider flex items-center gap-1.5">
                <span>🎨</span> Phối màu khách đã chọn
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-cute-cream/50 dark:bg-cute-cream-dark/50">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: topColorHex }}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                    />
                    <span className="font-semibold text-cute-brown dark:text-cute-cream">
                      Màu ở trên (Thân bát):
                    </span>
                  </div>
                  <strong className="text-cute-brown dark:text-cute-cream">{topColorName}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-cute-cream/50 dark:bg-cute-cream-dark/50">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: bottomColorHex }}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                    />
                    <span className="font-semibold text-cute-brown dark:text-cute-cream">
                      Màu ở dưới (Đế chống kiến):
                    </span>
                  </div>
                  <strong className="text-cute-brown dark:text-cute-cream">{bottomColorName}</strong>
                </div>
              </div>
            </div>

            {/* Customization Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark space-y-3">
              <h4 className="text-xs font-black uppercase text-cute-brown dark:text-cute-cream tracking-wider flex items-center gap-1.5">
                <span>✨</span> Chi tiết in chữ & Icon
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-cute-cream/50 dark:bg-cute-cream-dark/50">
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">Tên bé cưng:</span>
                  <strong className="text-rose-500 font-extrabold text-sm">{petName}</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-cute-cream/50 dark:bg-cute-cream-dark/50">
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">Icon đi kèm (tối đa 2):</span>
                  <span className="text-base font-bold">{icons.join('  ') || 'Không chọn'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-cute-cream/50 dark:bg-cute-cream-dark/50">
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">Ngày sinh bé:</span>
                  <strong className="text-cute-brown dark:text-cute-cream">
                    {birthdayDisplay ? `🎂 ${birthdayDisplay}` : 'Chưa nhập (Có thể bổ sung)'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Size & Dimensions Table Accordion / Rules */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cute-pink/20 to-cute-peach/20 dark:from-cute-surface-dark dark:to-cute-cream-dark/30 border border-cute-border-light dark:border-cute-border-dark text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-1">
                <span>📏</span> Kích cỡ đã chọn: <strong>{variantValue}</strong>
              </span>
              <span className="text-base font-black text-rose-500">
                {formatVND(unitPrice)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-cute-brown-light dark:text-cute-muted border-t border-cute-border-light/60">
              <div>🌸 Nghiêng 15° chống gù (S/M/L)</div>
              <div>🌸 Khoang rãnh chứa nước chống kiến</div>
              <div>🌸 Nhựa PETG Food-safe nguyên sinh</div>
              <div>🌸 Lòng bát inox 304 tháo rời</div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="sticky bottom-0 z-20 px-6 py-4 bg-white/95 dark:bg-cute-surface-dark/95 backdrop-blur-md border-t border-cute-border-light dark:border-cute-border-dark flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Download Demo Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-xs font-bold text-cute-brown dark:text-cute-cream hover:bg-cute-cream shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Đã lưu ảnh demo vào máy!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-rose-500" />
                <span>{isExporting ? 'Đang xuất ảnh...' : 'Lưu ảnh demo này'}</span>
              </>
            )}
          </button>

          {/* Confirm & Purchase Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onAddToCart && (
              <button
                type="button"
                onClick={() => {
                  onAddToCart();
                  onClose();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-rose-400 bg-white dark:bg-cute-surface-dark text-rose-500 text-xs font-extrabold hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm vào giỏ hàng</span>
              </button>
            )}

            {onBuyNow && (
              <button
                type="button"
                onClick={() => {
                  onBuyNow();
                  onClose();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-cute-lg transition-all active:scale-95"
              >
                <Heart className="w-4 h-4 fill-white/30" />
                <span>Chốt Mẫu & Đặt Ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

