import React from 'react';
import { Sparkles, Calendar, Smile, Palette, Check, Pipette } from 'lucide-react';
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
  const isKeychain =
    categorySlug === 'moc-khoa-3d' ||
    categoryId === 'cat-keychains' ||
    categoryId === 'a2222222-2222-4222-8222-222222222222' ||
    categoryId === 'c2222222-2222-2222-2222-222222222222' ||
    nameLower.includes('móc khóa');

  const isAccessory =
    categorySlug === 'phu-kien-ca-nhan-hoa' ||
    categoryId === 'a3333333-3333-4333-8333-333333333333' ||
    categoryId === 'c3333333-3333-3333-3333-333333333333' ||
    nameLower.includes('bảng tên') ||
    nameLower.includes('thẻ tên');

  // Mặc định hiển thị bộ tùy chỉnh Bát ăn 3D nếu không phải móc khóa hay thẻ tên
  const isDogBowl = !isKeychain && !isAccessory;

  const currentBodyName = customization.bodyColor || BODY_COLORS[0].name;
  const currentBaseName = customization.baseColor || BASE_COLORS[0].name;
  const currentIcons = customization.selectedIcons || ['🐶', '🐾'];

  const presetBody = BODY_COLORS.find((c) => c.name === currentBodyName);
  const presetBase = BASE_COLORS.find((c) => c.name === currentBaseName);

  const activeBodyHex = customization.bodyColorHex || presetBody?.hex || BODY_COLORS[0].hex;
  const activeBaseHex = customization.baseColorHex || presetBase?.hex || BASE_COLORS[0].hex;

  // Màu chữ in nổi trên thân bát đồng bộ theo Màu 2 (màu đế chống kiến) giống thực tế sản phẩm,
  // tự động tạo độ tương phản nếu màu thân và màu đế trùng nhau
  const embossedTextColor =
    activeBodyHex.toLowerCase() === activeBaseHex.toLowerCase()
      ? isLightHex(activeBodyHex)
        ? '#54382B'
        : '#FFFFFF'
      : activeBaseHex;

  // Màu chủ đạo động cho toàn bộ UI Card dựa theo lựa chọn của người dùng
  const dynamicAccentHex =
    activeBaseHex.toLowerCase() === '#ffffff'
      ? activeBodyHex.toLowerCase() === '#ffffff'
        ? '#1A7B8E'
        : activeBodyHex
      : activeBaseHex;

  const updateFields = (patch: Partial<PetCustomization>) => {
    onChange({
      ...customization,
      ...patch,
    });
  };

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

  const handleApplyQuickCombo = (combo: typeof QUICK_COMBOS[0]) => {
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
          <span>Cá Nhân Hóa Màu Sắc & Khắc Tên 3D</span>
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

          {/* Main 3D Bowl Body (Tapered Trapezoidal Look) */}
          <div
            style={{
              backgroundColor: activeBodyHex,
              borderColor: isLightHex(activeBodyHex) ? '#CBD5E1' : activeBodyHex,
              boxShadow: `0 10px 25px -5px ${dynamicAccentHex}40, inset 0 -6px 12px rgba(0,0,0,0.08)`,
            }}
            className="w-52 sm:w-56 h-24 rounded-2xl border-2 flex flex-col items-center justify-center relative z-10 transition-all duration-300 px-3"
          >
            {/* 3D embossed custom text and icons */}
            <div
              style={{ color: embossedTextColor }}
              className="flex items-center gap-1.5 text-xl sm:text-2xl font-black tracking-wide filter drop-shadow-sm select-none transition-colors duration-300"
            >
              {currentIcons[0] && <span>{currentIcons[0]}</span>}
              <span className="font-extrabold font-sans truncate max-w-[140px]">
                {customization.petName || 'Ngáo'}
              </span>
              {currentIcons[1] && <span>{currentIcons[1]}</span>}
            </div>

            {/* Birthday sub-badge if provided */}
            {customization.petBirthday && (
              <span
                style={{
                  color: embossedTextColor,
                  borderColor: `${embossedTextColor}40`,
                }}
                className="text-[10px] font-bold mt-1 bg-white/60 dark:bg-black/20 px-2.5 py-0.5 rounded-full border"
              >
                🎂 {customization.petBirthday}
              </span>
            )}
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

        {/* Quick Style Combos from real product photo */}
        {isDogBowl && (
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
        )}
      </div>

      {/* COLOR PICKERS - ALWAYS VISIBLE SO USER CAN PICK COLORS IMMEDIATELY */}
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
                onChange={(e) => handleSelectBodyColor(`Màu tự chọn (${e.target.value.toUpperCase()})`, e.target.value)}
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
                onChange={(e) => handleSelectBaseColor(`Màu tự chọn (${e.target.value.toUpperCase()})`, e.target.value)}
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
        {isDogBowl && (
          <>
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
          </>
        )}

        {isKeychain && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Tên hoặc SĐT khắc mặt sau móc khóa *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Bé Bắp - 0987654321"
                value={customization.customText || ''}
                onChange={(e) => updateFields({ customText: e.target.value })}
                maxLength={25}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1">
                Kiểu móc khoá mong muốn:
              </label>
              <select
                value={customization.keychainDesign || 'Khoen tròn vàng hồng'}
                onChange={(e) => updateFields({ keychainDesign: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              >
                <option value="Khoen tròn vàng hồng">Khoen tròn mạ vàng hồng cao cấp</option>
                <option value="Móc càng cua trái tim">Móc bấm càng cua hình trái tim</option>
                <option value="Dây treo balo chuông con">Dây dù phong cách kèm chuông leng keng</option>
              </select>
            </div>
          </div>
        )}

        {isAccessory && (
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Thông tin khắc trên thẻ tên / phụ kiện (Tên + 1-2 SĐT):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Miu Miu - 0912.345.678"
              value={customization.customText || ''}
              onChange={(e) => updateFields({ customText: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
