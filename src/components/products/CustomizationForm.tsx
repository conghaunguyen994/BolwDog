import React from 'react';
import {
  Sparkles,
  Calendar,
  Smile,
  Palette,
  Check,
  Pipette,
  Key,
  Tag,
  Moon,
  Phone,
  FileText,
} from 'lucide-react';
import { PetCustomization } from '../../types/order';

interface CustomizationFormProps {
  categoryId: string;
  categorySlug?: string;
  productName?: string;
  customization: PetCustomization;
  onChange: (customization: PetCustomization) => void;
}

export const BODY_COLORS = [
  { name: 'Trắng Sứ', hex: '#FFFFFF', border: '#CBD5E1', textColor: '#1A7B8E' },
  { name: 'Cam Đất (Mẫu Bắp)', hex: '#C86D3B', border: '#9A4E24', textColor: '#FFFFFF' },
  { name: 'Vàng Kem (Mẫu Mr.Lu)', hex: '#F5CBA7', border: '#D9A77D', textColor: '#54382B' },
  { name: 'Hồng Pastel', hex: '#F8C8DC', border: '#E59BBA', textColor: '#6B3FA0' },
  { name: 'Xanh Mint Dịu', hex: '#C1F0DC', border: '#8AD6B5', textColor: '#1B5E43' },
  { name: 'Tím Lavender', hex: '#E2D4F8', border: '#BDAAE2', textColor: '#4A2E7A' },
  { name: 'Vàng Bơ Tươi', hex: '#FDF0A6', border: '#E5D16B', textColor: '#634819' },
  { name: 'Xanh Bầu Trời', hex: '#C8E6FF', border: '#91C5F2', textColor: '#1A4E7A' },
];

export const BASE_COLORS = [
  { name: 'Xanh Cổ Vịt (Mẫu Ngáo)', hex: '#1A7B8E', border: '#125967' },
  { name: 'Nâu Socola (Mẫu Mr.Lu)', hex: '#54382B', border: '#3B251B' },
  { name: 'Xanh Rêu (Mẫu Béo)', hex: '#55633C', border: '#3B4628' },
  { name: 'Trắng Sứ (Mẫu Bắp)', hex: '#FFFFFF', border: '#CBD5E1' },
  { name: 'Đen Than Sang Trọng', hex: '#2B2D32', border: '#16171A' },
  { name: 'Hồng Dâu Ngọt Ngào', hex: '#E05A8A', border: '#B93E6A' },
  { name: 'Cam Đào Năng Động', hex: '#E07A45', border: '#B95A29' },
  { name: 'Tím Mận Chín', hex: '#6D438A', border: '#4F2E66' },
];

const QUICK_COMBOS = [
  {
    label: 'Mẫu "Ngáo"',
    petSample: 'Ngáo',
    body: BODY_COLORS[0], // Trắng Sứ
    base: BASE_COLORS[0], // Xanh Cổ Vịt
    icons: ['🐶', '🐾'],
  },
  {
    label: 'Mẫu "Mr.Lu"',
    petSample: 'Mr.Lu',
    body: BODY_COLORS[2], // Vàng Kem
    base: BASE_COLORS[1], // Nâu Socola
    icons: ['👑', '🐾'],
  },
  {
    label: 'Mẫu "Béo"',
    petSample: 'Béo',
    body: BODY_COLORS[0], // Trắng Sứ
    base: BASE_COLORS[2], // Xanh Rêu
    icons: ['🐩', '🦴'],
  },
  {
    label: 'Mẫu "Bắp"',
    petSample: 'Bắp',
    body: BODY_COLORS[1], // Cam Đất
    base: BASE_COLORS[3], // Trắng Sứ
    icons: ['🐾', '❤️'],
  },
];

const AVAILABLE_ICONS = [
  { icon: '🐾', name: 'Chân cún' },
  { icon: '🦴', name: 'Khúc xương' },
  { icon: '👑', name: 'Vương miện' },
  { icon: '🐶', name: 'Mặt cún' },
  { icon: '🐩', name: 'Poodle xù' },
  { icon: '❤️', name: 'Trái tim' },
  { icon: '⭐', name: 'Ngôi sao' },
  { icon: '🐟', name: 'Cá nhỏ' },
  { icon: '🔔', name: 'Chuông xinh' },
  { icon: '🎀', name: 'Chiếc nơ' },
];

const KEYCHAIN_DESIGNS = [
  { id: 'Khoen tròn vàng hồng', name: 'Khoen tròn mạ vàng hồng cao cấp', preview: '⭕ Vàng Hồng' },
  { id: 'Móc bấm càng cua trái tim', name: 'Móc bấm càng cua hình trái tim', preview: '💖 Càng Cua Trái Tim' },
  { id: 'Dây treo balo chuông con', name: 'Dây dù phong cách kèm chuông leng keng', preview: '🔔 Dây Treo & Chuông' },
];

const KEYCHAIN_COLORS = [
  { name: 'Vàng Hồng (Rose Gold)', hex: '#B76E79' },
  { name: 'Bạc Ánh Kim (Silver)', hex: '#A8B2C1' },
  { name: 'Vàng Ánh Kim (Gold)', hex: '#D4AF37' },
  { name: 'Đen Mờ (Matte Black)', hex: '#2C2C2E' },
];

const TAG_SHAPES = [
  { id: 'Khúc xương', name: 'Hình khúc xương', icon: '🦴' },
  { id: 'Mặt cún', name: 'Hình mặt cún xinh', icon: '🐶' },
  { id: 'Trái tim', name: 'Hình trái tim yêu thương', icon: '❤️' },
  { id: 'Hình tròn', name: 'Hình tròn tối giản', icon: '⭕' },
];

const GLOW_COLORS = [
  { name: 'Xanh Dạ Quang (Glow Green)', hex: '#39FF14', glow: 'rgba(57, 255, 20, 0.5)' },
  { name: 'Xanh Biển Neon (Aqua Glow)', hex: '#00F0FF', glow: 'rgba(0, 240, 255, 0.5)' },
  { name: 'Cam Neon Nổi Bật (Neon Orange)', hex: '#FF7700', glow: 'rgba(255, 119, 0, 0.5)' },
];

function isLightHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68;
}

export const CustomizationForm: React.FC<CustomizationFormProps> = ({
  categoryId,
  categorySlug,
  productName,
  customization,
  onChange,
}) => {
  const nameLower = (productName || '').toLowerCase();
  const slugLower = (categorySlug || '').toLowerCase();
  const catIdLower = (categoryId || '').toLowerCase();

  // 1. Phân loại sản phẩm CHUẨN XÁC:
  // - Chỉ sản phẩm thuộc danh mục Bát Ăn mới là Bát (chọn size, chọn 2 màu thân/đế, mô phỏng bát 3D)
  const isDogBowl =
    slugLower === 'bat-an-cho-cho' ||
    slugLower.includes('bat-an') ||
    catIdLower === 'cat-bowls' ||
    catIdLower === 'a1111111-1111-4111-8111-111111111111' ||
    catIdLower === 'c1111111-1111-1111-1111-111111111111' ||
    nameLower.includes('bát') ||
    nameLower.includes('chén') ||
    nameLower.includes('bowl');

  // - Móc khóa 3D
  const isKeychain =
    !isDogBowl &&
    (slugLower === 'moc-khoa-3d' ||
      slugLower.includes('moc-khoa') ||
      catIdLower === 'cat-keychains' ||
      catIdLower === 'a2222222-2222-4222-8222-222222222222' ||
      catIdLower === 'c2222222-2222-2222-2222-222222222222' ||
      nameLower.includes('móc khóa') ||
      nameLower.includes('keychain'));

  // - Bảng tên / thẻ tên / phụ kiện cá nhân hóa
  const isAccessory =
    !isDogBowl &&
    !isKeychain &&
    (slugLower === 'phu-kien-ca-nhan-hoa' ||
      slugLower.includes('phu-kien') ||
      catIdLower === 'cat-accessories' ||
      catIdLower === 'a3333333-3333-4333-8333-333333333333' ||
      catIdLower === 'c3333333-3333-3333-3333-333333333333' ||
      nameLower.includes('bảng tên') ||
      nameLower.includes('thẻ tên') ||
      nameLower.includes('vòng cổ'));

  const updateFields = (patch: Partial<PetCustomization>) => {
    onChange({
      ...customization,
      ...patch,
    });
  };

  // =========================================================================
  // LOGIC & GIAO DIỆN DÀNH RIÊNG CHO BÁT ĂN CHỐNG GÙ CHỐNG KIẾN (isDogBowl)
  // =========================================================================
  if (isDogBowl) {
    const currentBodyName = customization.bodyColor || BODY_COLORS[0].name;
    const currentBaseName = customization.baseColor || BASE_COLORS[0].name;
    const currentIcons = customization.selectedIcons || ['🐶', '🐾'];

    const presetBody = BODY_COLORS.find((c) => c.name === currentBodyName);
    const presetBase = BASE_COLORS.find((c) => c.name === currentBaseName);

    const activeBodyHex = customization.bodyColorHex || presetBody?.hex || BODY_COLORS[0].hex;
    const activeBaseHex = customization.baseColorHex || presetBase?.hex || BASE_COLORS[0].hex;

    const embossedTextColor =
      activeBodyHex.toLowerCase() === activeBaseHex.toLowerCase()
        ? isLightHex(activeBodyHex)
          ? '#54382B'
          : '#FFFFFF'
        : activeBaseHex;

    const dynamicAccentHex =
      activeBaseHex.toLowerCase() === '#ffffff'
        ? activeBodyHex.toLowerCase() === '#ffffff'
          ? '#1A7B8E'
          : activeBodyHex
        : activeBaseHex;

    const handleSelectBodyColor = (name: string, hex: string) => {
      updateFields({
        bodyColor: name,
        bodyColorHex: hex,
      });
    };

    const handleSelectBaseColor = (name: string, hex: string) => {
      updateFields({
        baseColor: name,
        baseColorHex: hex,
      });
    };

    const handleApplyQuickCombo = (combo: (typeof QUICK_COMBOS)[0]) => {
      updateFields({
        bodyColor: combo.body.name,
        bodyColorHex: combo.body.hex,
        baseColor: combo.base.name,
        baseColorHex: combo.base.hex,
        selectedIcons: combo.icons,
        petName: customization.petName || combo.petSample,
      });
    };

    const handleIconToggle = (iconChar: string) => {
      let next: string[];
      if (currentIcons.includes(iconChar)) {
        next = currentIcons.filter((i) => i !== iconChar);
      } else {
        if (currentIcons.length >= 2) {
          next = [currentIcons[1], iconChar];
        } else {
          next = [...currentIcons, iconChar];
        }
      }
      updateFields({ selectedIcons: next });
    };

    return (
      <div
        style={{
          borderColor: `${dynamicAccentHex}66`,
          background: `linear-gradient(145deg, ${activeBodyHex}35 0%, ${dynamicAccentHex}12 100%)`,
        }}
        className="space-y-5 p-5 sm:p-6 rounded-3xl border-2 shadow-cute transition-all duration-300"
      >
        {/* Dynamic Header */}
        <div
          style={{ borderColor: `${dynamicAccentHex}33` }}
          className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b"
        >
          <h4 className="text-sm sm:text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
            <Sparkles style={{ color: dynamicAccentHex }} className="w-4 h-4 transition-colors" />
            <span>Cá Nhân Hóa Màu Sắc & Khắc Tên Bát Ăn 3D</span>
          </h4>
          <span
            style={{
              backgroundColor: dynamicAccentHex,
              color: isLightHex(dynamicAccentHex) ? '#3B251B' : '#FFFFFF',
            }}
            className="text-[11px] font-bold px-3 py-1 rounded-full shadow-sm transition-colors duration-300"
          >
            ✨ Phối màu trực tiếp
          </span>
        </div>

        {/* Visual Live Interactive 3D Bowl Preview */}
        <div
          style={{
            borderColor: `${dynamicAccentHex}80`,
            background: `radial-gradient(circle at center, #ffffff 0%, ${activeBodyHex}25 60%, ${dynamicAccentHex}18 100%)`,
          }}
          className="p-4 sm:p-6 rounded-3xl border-2 border-dashed text-center relative overflow-hidden transition-all duration-300"
        >
          <span className="text-[10px] text-cute-brown-light dark:text-cute-muted uppercase tracking-wider font-extrabold block mb-3">
            Mô phỏng phối màu thực tế của chiếc bát (Đổi màu tức thì khi chọn):
          </span>

          {/* 3D Bowl Representation */}
          <div className="relative mx-auto w-60 sm:w-68 flex flex-col items-center py-1">
            {/* Top Inox Bowl Lip */}
            <div className="w-40 h-9 rounded-t-full bg-gradient-to-b from-gray-200 via-gray-100 to-gray-300 border-2 border-gray-400 shadow-inner flex items-center justify-center relative -mb-2.5 z-20">
              <div className="w-32 h-5 rounded-full bg-gradient-to-b from-gray-400 via-gray-200 to-white shadow-inner flex items-center justify-center">
                <span className="text-[9px] font-bold text-gray-600 tracking-wider">LÒNG BÁT INOX 304</span>
              </div>
            </div>

            {/* Main 3D Bowl Body */}
            <div
              style={{
                backgroundColor: activeBodyHex,
                borderColor: isLightHex(activeBodyHex) ? '#CBD5E1' : activeBodyHex,
                boxShadow: `0 10px 25px -5px ${dynamicAccentHex}40, inset 0 -6px 12px rgba(0,0,0,0.08)`,
              }}
              className="w-52 sm:w-56 h-24 rounded-2xl border-2 flex flex-col items-center justify-center relative z-10 transition-all duration-300 px-3"
            >
              <div
                style={{ color: embossedTextColor }}
                className="flex items-center gap-1.5 text-xl sm:text-2xl font-black tracking-wide filter drop-shadow-sm select-none transition-colors duration-300"
              >
                {currentIcons[0] && <span>{currentIcons[0]}</span>}
                <span className="truncate max-w-[150px]">
                  {customization.petName || 'Ngáo'}
                </span>
                {currentIcons[1] && <span>{currentIcons[1]}</span>}
              </div>
              <span
                style={{
                  color: isLightHex(activeBodyHex) ? '#78716C' : '#F5F5F4',
                }}
                className="text-[9px] tracking-widest uppercase font-semibold mt-1"
              >
                ★ Nâng 15° Chống Gù Cổ ★
              </span>
            </div>

            {/* Anti-Ant Water Moat Base Ring */}
            <div
              style={{
                backgroundColor: activeBaseHex,
                borderColor: isLightHex(activeBaseHex) ? '#CBD5E1' : activeBaseHex,
              }}
              className="w-60 sm:w-64 h-9 rounded-2xl border-2 shadow-lg flex items-center justify-center relative -mt-2 z-0 transition-all duration-300"
            >
              <span
                style={{
                  color: isLightHex(activeBaseHex) ? '#3B251B' : '#FFFFFF',
                }}
                className="text-[9px] font-extrabold tracking-wide uppercase"
              >
                💧 Khoang chứa nước chống kiến
              </span>
            </div>
          </div>

          {/* Live Color Summary Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-cute-border-light font-semibold text-cute-brown shadow-sm">
              <span
                style={{ backgroundColor: activeBodyHex }}
                className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
              />
              Thân bát: <strong>{currentBodyName}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-cute-border-light font-semibold text-cute-brown shadow-sm">
              <span
                style={{ backgroundColor: activeBaseHex }}
                className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
              />
              Đế & Chữ: <strong>{currentBaseName}</strong>
            </span>
          </div>

          {/* Quick Style Combos */}
          <div className="mt-3 pt-3 border-t border-cute-border-light/60 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] font-bold text-cute-brown-light mr-1">Gợi ý phối màu nhanh:</span>
            {QUICK_COMBOS.map((combo) => (
              <button
                key={combo.label}
                type="button"
                onClick={() => handleApplyQuickCombo(combo)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-cute-cream border border-cute-border-light text-[10px] font-bold text-cute-brown shadow-sm transition-transform active:scale-95"
              >
                <span
                  style={{ backgroundColor: combo.body.hex }}
                  className="w-2.5 h-2.5 rounded-full border border-gray-400"
                />
                <span
                  style={{ backgroundColor: combo.base.hex }}
                  className="w-2.5 h-2.5 rounded-full border border-gray-400 -ml-1"
                />
                <span>{combo.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* COLOR PICKERS */}
        <div className="space-y-4">
          {/* Step 1: Body Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
                <Palette style={{ color: dynamicAccentHex }} className="w-4 h-4" />
                <span>1. Chọn màu thân bát (Màu 1):</span>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
                <Pipette className="w-3 h-3" />
                <span>Tự chọn mã màu khác</span>
                <input
                  type="color"
                  value={activeBodyHex}
                  onChange={(e) =>
                    handleSelectBodyColor(`Màu tự chọn (${e.target.value.toUpperCase()})`, e.target.value)
                  }
                  className="sr-only"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BODY_COLORS.map((col) => {
                const isSelected = currentBodyName === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectBodyColor(col.name, col.hex)}
                    style={
                      isSelected
                        ? {
                            borderColor: dynamicAccentHex,
                            backgroundColor: `${col.hex}40`,
                            boxShadow: `0 0 0 2px ${dynamicAccentHex}40`,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'text-cute-brown font-extrabold'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: col.hex, borderColor: col.border }}
                      className="w-5 h-5 rounded-full border-2 shadow-inner flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && (
                        <Check
                          className="w-3 h-3"
                          style={{ color: isLightHex(col.hex) ? '#1A7B8E' : '#FFFFFF' }}
                        />
                      )}
                    </span>
                    <span className="truncate text-[11px]">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Base & Embossed Text Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
                <Palette style={{ color: dynamicAccentHex }} className="w-4 h-4" />
                <span>2. Chọn màu đế chống kiến & chữ in nổi (Màu 2):</span>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
                <Pipette className="w-3 h-3" />
                <span>Tự chọn mã màu khác</span>
                <input
                  type="color"
                  value={activeBaseHex}
                  onChange={(e) =>
                    handleSelectBaseColor(`Màu tự chọn (${e.target.value.toUpperCase()})`, e.target.value)
                  }
                  className="sr-only"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASE_COLORS.map((col) => {
                const isSelected = currentBaseName === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectBaseColor(col.name, col.hex)}
                    style={
                      isSelected
                        ? {
                            borderColor: dynamicAccentHex,
                            backgroundColor: `${col.hex}25`,
                            boxShadow: `0 0 0 2px ${dynamicAccentHex}40`,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'text-cute-brown font-extrabold'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: col.hex, borderColor: col.border }}
                      className="w-5 h-5 rounded-full border-2 shadow-inner flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && (
                        <Check
                          className="w-3 h-3"
                          style={{ color: isLightHex(col.hex) ? '#3B251B' : '#FFFFFF' }}
                        />
                      )}
                    </span>
                    <span className="truncate text-[11px]">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Pet Name */}
          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smile style={{ color: dynamicAccentHex }} className="w-4 h-4" />
                <span>3. Tên thú cưng in nổi trên thân bát *</span>
              </span>
              <span className="text-[10px] text-cute-brown-light">Ví dụ: Ngáo, Mr.Lu, Béo, Bắp</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên bé cưng (Ví dụ: Ngáo, Mr.Lu, Béo, Bắp...)"
              value={customization.petName || ''}
              onChange={(e) => updateFields({ petName: e.target.value })}
              maxLength={20}
              style={{ borderColor: `${dynamicAccentHex}66` }}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-2 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none font-bold transition-colors"
            />
          </div>

          {/* Step 4: Choose up to 2 Icons */}
          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles style={{ color: dynamicAccentHex }} className="w-4 h-4" />
                <span>4. Chọn tối đa 2 icon ngộ nghĩnh đi kèm tên:</span>
              </span>
              <span style={{ color: dynamicAccentHex }} className="text-[11px] font-bold">
                Đã chọn: {currentIcons.length}/2
              </span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {AVAILABLE_ICONS.map((item) => {
                const isSelected = currentIcons.includes(item.icon);
                return (
                  <button
                    key={item.icon}
                    type="button"
                    onClick={() => handleIconToggle(item.icon)}
                    title={item.name}
                    style={
                      isSelected
                        ? {
                            borderColor: dynamicAccentHex,
                            backgroundColor: `${dynamicAccentHex}20`,
                            boxShadow: `0 0 0 2px ${dynamicAccentHex}40`,
                          }
                        : undefined
                    }
                    className={`h-11 rounded-xl flex flex-col items-center justify-center text-lg transition-all border ${
                      isSelected
                        ? 'scale-105 font-bold'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light hover:bg-cute-cream opacity-85'
                    }`}
                  >
                    <span>{item.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Pet Birthday & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Calendar style={{ color: dynamicAccentHex }} className="w-3.5 h-3.5" />
                <span>5. Ngày sinh của bé cưng (tùy chọn)</span>
              </label>
              <input
                type="date"
                value={customization.petBirthday || ''}
                onChange={(e) => updateFields({ petBirthday: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Ghi chú riêng cho xưởng in 3D:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Giống cún Corgi, in chữ in hoa..."
                value={customization.customNotes || ''}
                onChange={(e) => updateFields({ customNotes: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGIC & GIAO DIỆN DÀNH RIÊNG CHO MÓC KHÓA 3D (isKeychain)
  // (Không có chọn kích cỡ bát, không có màu thân/màu đế bát ăn)
  // =========================================================================
  if (isKeychain) {
    const selectedDesign = customization.keychainDesign || KEYCHAIN_DESIGNS[0].id;
    const selectedColor = customization.keychainColor || KEYCHAIN_COLORS[0].name;
    const petNameText = customization.customText || customization.petName || 'Bé Bắp';
    const phoneText = customization.phoneOnTag || '0345.553.913';

    return (
      <div className="space-y-5 p-5 sm:p-6 rounded-3xl border-2 border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/60 dark:from-cute-surface-dark dark:to-cute-surface-dark shadow-cute">
        {/* Keychain Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rose-100 dark:border-rose-900/30">
          <h4 className="text-sm sm:text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
            <Key className="w-4 h-4 text-rose-500" />
            <span>Cá Nhân Hóa Móc Khóa 3D In Tên Bé</span>
          </h4>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500 text-white shadow-sm">
            ✨ Khắc Tên & SĐT Mặt Sau
          </span>
        </div>

        {/* Interactive Visual Preview of Keychain */}
        <div className="p-4 sm:p-6 rounded-3xl border-2 border-dashed border-rose-200 dark:border-rose-800 text-center relative overflow-hidden bg-white/80 dark:bg-cute-surface-dark/90">
          <span className="text-[10px] text-cute-brown-light dark:text-cute-muted uppercase tracking-wider font-extrabold block mb-3">
            Mô phỏng móc khóa in 3D thực tế của bạn:
          </span>

          <div className="mx-auto w-52 sm:w-60 flex flex-col items-center py-2">
            {/* Clasp Ring simulation */}
            <div className="w-12 h-12 rounded-full border-4 border-amber-300 shadow-md flex items-center justify-center -mb-2 z-10 bg-amber-50">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400" />
            </div>

            {/* Main 3D Keychain Tag Body */}
            <div className="w-48 sm:w-52 py-4 px-4 rounded-3xl bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-xl flex flex-col items-center justify-center relative border-2 border-rose-300">
              <div className="flex items-center gap-1.5 text-lg font-black tracking-wide filter drop-shadow">
                <span>🐾</span>
                <span className="truncate max-w-[130px]">{petNameText}</span>
                <span>⭐</span>
              </div>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                <span>{phoneText}</span>
              </div>
            </div>

            <span className="text-[10px] text-cute-brown-light dark:text-cute-muted mt-3 font-semibold">
              Kiểu móc: <strong className="text-rose-600 dark:text-rose-400">{selectedDesign}</strong>
            </span>
          </div>
        </div>

        {/* Form Options for Keychain */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-rose-500" />
              <span>1. Tên thú cưng / Chữ khắc mặt trước *</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bé Bắp, Corgi Milo, Miu Miu..."
              value={customization.customText || customization.petName || ''}
              onChange={(e) =>
                updateFields({
                  customText: e.target.value,
                  petName: e.target.value,
                })
              }
              maxLength={25}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-500" />
              <span>2. Số điện thoại khắc mặt sau (để người nhặt liên hệ) *</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 0345.553.913 hoặc 'Tìm thấy bé gọi ba nhé'"
              value={customization.phoneOnTag || ''}
              onChange={(e) => updateFields({ phoneOnTag: e.target.value })}
              maxLength={30}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-rose-500" />
              <span>3. Chọn kiểu khoen móc khóa:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {KEYCHAIN_DESIGNS.map((design) => {
                const isSelected = selectedDesign === design.id;
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => updateFields({ keychainDesign: design.id })}
                    className={`p-3 rounded-2xl border-2 text-left text-xs transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold shadow-sm'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span className="block font-bold text-xs mb-0.5">{design.preview}</span>
                    <span className="block text-[11px] opacity-80">{design.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-rose-500" />
              <span>4. Chọn tông màu móc khóa:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KEYCHAIN_COLORS.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => updateFields({ keychainColor: col.name })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: col.hex }}
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
                    />
                    <span className="truncate text-[11px]">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cute-brown-light" />
              <span>Ghi chú riêng cho xưởng in 3D (tùy chọn):</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Khắc hình bé Poodle, gắn kèm chuông màu bạc..."
              value={customization.customNotes || ''}
              onChange={(e) => updateFields({ customNotes: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGIC & GIAO DIỆN DÀNH RIÊNG CHO BẢNG TÊN / THẺ TÊN DẠ QUANG (isAccessory)
  // (Không có chọn kích cỡ bát, không có màu thân/màu đế bát ăn)
  // =========================================================================
  if (isAccessory) {
    const selectedShape = customization.tagShape || TAG_SHAPES[0].id;
    const selectedGlow = customization.glowColor || GLOW_COLORS[0].name;
    const currentGlowObj = GLOW_COLORS.find((g) => g.name === selectedGlow) || GLOW_COLORS[0];
    const petNameText = customization.petName || customization.customText || 'Lucky';
    const phoneText = customization.phoneOnTag || '0345.553.913';

    return (
      <div className="space-y-5 p-5 sm:p-6 rounded-3xl border-2 border-teal-200 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/60 dark:from-cute-surface-dark dark:to-cute-surface-dark shadow-cute">
        {/* Accessory Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-teal-100 dark:border-teal-900/30">
          <h4 className="text-sm sm:text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
            <Tag className="w-4 h-4 text-teal-600" />
            <span>Cá Nhân Hóa Thẻ Tên & Phụ Kiện Thú Cưng</span>
          </h4>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-600 text-white shadow-sm flex items-center gap-1">
            <Moon className="w-3 h-3" />
            <span>Dạ Quang Phát Sáng Ban Đêm</span>
          </span>
        </div>

        {/* Interactive Glowing Tag Preview */}
        <div className="p-4 sm:p-6 rounded-3xl border-2 border-dashed border-teal-200 dark:border-teal-800 text-center relative overflow-hidden bg-slate-900 text-white">
          <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-extrabold block mb-3">
            🌙 Mô phỏng hiệu ứng phát sáng ban đêm chống lạc bé:
          </span>

          <div className="mx-auto w-56 sm:w-64 flex flex-col items-center py-2">
            {/* Tag Simulation */}
            <div
              style={{
                borderColor: currentGlowObj.hex,
                boxShadow: `0 0 25px ${currentGlowObj.glow}, inset 0 0 15px ${currentGlowObj.glow}`,
              }}
              className="w-48 sm:w-52 py-4 px-3 rounded-2xl border-2 bg-slate-800/90 flex flex-col items-center justify-center transition-all duration-300"
            >
              <div
                style={{ color: currentGlowObj.hex }}
                className="text-xl font-black tracking-wide filter drop-shadow flex items-center gap-1.5"
              >
                <span>{TAG_SHAPES.find((s) => s.id === selectedShape)?.icon || '🦴'}</span>
                <span className="truncate max-w-[140px]">{petNameText}</span>
              </div>
              <div
                style={{ color: currentGlowObj.hex }}
                className="mt-1 text-[11px] font-bold tracking-wider flex items-center gap-1 opacity-90"
              >
                <Phone className="w-3 h-3" />
                <span>{phoneText}</span>
              </div>
            </div>

            <span className="text-[10px] text-teal-200 mt-3 font-semibold">
              Hình dáng: <strong>{selectedShape}</strong> • Hiệu ứng:{' '}
              <strong style={{ color: currentGlowObj.hex }}>{selectedGlow}</strong>
            </span>
          </div>
        </div>

        {/* Form Options for Tag / Accessory */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-teal-600" />
              <span>1. Tên bé cưng in trên thẻ tên *</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Lucky, Mochi, Bơ, Corgi..."
              value={customization.petName || customization.customText || ''}
              onChange={(e) =>
                updateFields({
                  petName: e.target.value,
                  customText: e.target.value,
                })
              }
              maxLength={20}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>2. Số điện thoại ba mẹ liên hệ khẩn cấp *</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 0345.553.913 (hoặc 2 SĐT: 0345553913 - 0987654321)"
              value={customization.phoneOnTag || ''}
              onChange={(e) => updateFields({ phoneOnTag: e.target.value })}
              maxLength={35}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>3. Chọn hình dáng thẻ tên:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TAG_SHAPES.map((shape) => {
                const isSelected = selectedShape === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => updateFields({ tagShape: shape.id })}
                    className={`p-2.5 rounded-2xl border-2 text-center text-xs transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold shadow-sm'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span className="text-xl block mb-1">{shape.icon}</span>
                    <span className="text-[11px] block">{shape.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-teal-600" />
              <span>4. Chọn màu dạ quang phát sáng trong đêm:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {GLOW_COLORS.map((g) => {
                const isSelected = selectedGlow === g.name;
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => updateFields({ glowColor: g.name })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-bold'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: g.hex }}
                      className="w-3.5 h-3.5 rounded-full border border-gray-400 shadow-sm flex-shrink-0"
                    />
                    <span className="truncate text-[11px]">{g.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cute-brown-light" />
              <span>Ghi chú riêng cho xưởng in 3D (tùy chọn):</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Kèm khoen móc inox chống rỉ..."
              value={customization.customNotes || ''}
              onChange={(e) => updateFields({ customNotes: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN DÀNH CHO CÁC SẢN PHẨM KHÁC (NẾU CÓ)
  // =========================================================================
  return (
    <div className="space-y-4 p-5 rounded-3xl border-2 border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark shadow-cute">
      <h4 className="text-sm font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cute-pink-500" />
        <span>Yêu Cầu Riêng Cho Xưởng In 3D</span>
      </h4>
      <div>
        <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1">
          Ghi chú hoặc thông tin cá nhân hóa mong muốn:
        </label>
        <textarea
          rows={3}
          placeholder="Nhập yêu cầu riêng cho bé yêu của bạn..."
          value={customization.customNotes || ''}
          onChange={(e) => updateFields({ customNotes: e.target.value })}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};
