import React from 'react';
import { Sparkles, Calendar, Smile, Palette, Check } from 'lucide-react';
import { PetCustomization } from '../../types/order';

interface CustomizationFormProps {
  categoryId: string;
  customization: PetCustomization;
  onChange: (customization: PetCustomization) => void;
}

const BODY_COLORS = [
  { name: 'Trắng Sứ', hex: '#FFFFFF', border: '#D0D0D0', textColor: '#1A7B8E' },
  { name: 'Cam Đất Vintage', hex: '#C86D3B', border: '#B05929', textColor: '#FFFFFF' },
  { name: 'Vàng Bơ / Kem Be', hex: '#FCE3B4', border: '#E2C38E', textColor: '#54382B' },
  { name: 'Hồng Pastel', hex: '#F8DDE5', border: '#E7B8C6', textColor: '#6B514A' },
  { name: 'Xanh Mint Dịu', hex: '#D4F0E4', border: '#A8DBC3', textColor: '#225740' },
  { name: 'Tím Lavender', hex: '#EAE3F8', border: '#CCBEEA', textColor: '#493766' },
];

const BASE_COLORS = [
  { name: 'Xanh Cổ Vịt (Teal)', hex: '#1A7B8E', border: '#135D6C' },
  { name: 'Nâu Socola Đậm', hex: '#54382B', border: '#3F281E' },
  { name: 'Xanh Rêu (Olive)', hex: '#55633C', border: '#3E492B' },
  { name: 'Trắng Sứ Tinh Khôi', hex: '#FFFFFF', border: '#D0D0D0' },
  { name: 'Đen Than Sang Trọng', hex: '#2A2A2A', border: '#1A1A1A' },
  { name: 'Hồng Phấn Ngọt Ngào', hex: '#F8DDE5', border: '#E7B8C6' },
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

export const CustomizationForm: React.FC<CustomizationFormProps> = ({
  categoryId,
  customization,
  onChange,
}) => {
  const isDogBowl = categoryId === 'cat-bowls';
  const isKeychain = categoryId === 'cat-keychains';

  // Current selections with smart defaults
  const currentBody = customization.bodyColor || BODY_COLORS[0].name;
  const currentBase = customization.baseColor || BASE_COLORS[0].name;
  const currentIcons = customization.selectedIcons || ['🐶', '🐾'];

  const selectedBodyObj = BODY_COLORS.find((c) => c.name === currentBody) || BODY_COLORS[0];
  const selectedBaseObj = BASE_COLORS.find((c) => c.name === currentBase) || BASE_COLORS[0];

  const updateField = (key: keyof PetCustomization, value: any) => {
    onChange({
      ...customization,
      [key]: value,
    });
  };

  const handleIconToggle = (iconChar: string) => {
    let next: string[];
    if (currentIcons.includes(iconChar)) {
      next = currentIcons.filter((i) => i !== iconChar);
    } else {
      if (currentIcons.length >= 2) {
        // Keep the latest 2
        next = [currentIcons[1], iconChar];
      } else {
        next = [...currentIcons, iconChar];
      }
    }
    updateField('selectedIcons', next);
  };

  return (
    <div className="space-y-5 p-5 sm:p-6 rounded-3xl bg-cute-cream/70 dark:bg-cute-cream-dark/50 border border-cute-pink/50 dark:border-cute-border-dark shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-cute-pink/30 dark:border-cute-border-dark">
        <h4 className="text-sm sm:text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Cá Nhân Hóa Bát Ăn 3D Riêng Biệt</span>
        </h4>
        <span className="text-[11px] text-cute-pink-600 dark:text-cute-pink-300 font-bold bg-cute-pink/40 dark:bg-cute-surface-dark px-2.5 py-1 rounded-full">
          Miễn phí khắc tên & 2 icon
        </span>
      </div>

      {/* Visual Live Interactive 3D Bowl Preview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-white via-cute-cream/50 to-cute-peach/20 dark:from-cute-surface-dark dark:to-cute-cream-dark border-2 border-dashed border-cute-pink-300/80 text-center relative overflow-hidden">
        <span className="text-[10px] text-cute-brown-light dark:text-cute-muted uppercase tracking-wider font-extrabold block mb-3">
          Mô phỏng phối màu thực tế của chiếc bát:
        </span>

        {/* 3D Bowl Representation */}
        <div className="relative mx-auto w-56 sm:w-64 flex flex-col items-center">
          
          {/* Top Inox Bowl Lip */}
          <div className="w-36 h-9 rounded-t-full bg-gradient-to-b from-gray-200 via-gray-100 to-gray-300 border-2 border-gray-400 shadow-inner flex items-center justify-center relative -mb-2 z-20">
            <div className="w-28 h-5 rounded-full bg-gradient-to-b from-gray-400 via-gray-200 to-white shadow-inner flex items-center justify-center">
              <span className="text-[9px] font-bold text-gray-500 tracking-wider">INOX 304</span>
            </div>
          </div>

          {/* Main 3D Bowl Body (Trapezoid / Tapered Cylindrical Look) */}
          <div
            style={{
              backgroundColor: selectedBodyObj.hex,
              borderColor: selectedBodyObj.border,
            }}
            className="w-48 sm:w-52 h-24 rounded-2xl border-2 shadow-md flex flex-col items-center justify-center relative z-10 transition-colors duration-300 px-3"
          >
            {/* 3D embossed custom text and icons */}
            <div
              style={{ color: selectedBodyObj.textColor }}
              className="flex items-center gap-1.5 text-lg sm:text-xl font-black tracking-wide filter drop-shadow-sm select-none"
            >
              {currentIcons[0] && <span>{currentIcons[0]}</span>}
              <span className="font-extrabold font-sans">
                {customization.petName || 'Tên Cún Yêu'}
              </span>
              {currentIcons[1] && <span>{currentIcons[1]}</span>}
            </div>

            {/* Birthday sub-badge if provided */}
            {customization.petBirthday && (
              <span
                style={{ color: selectedBodyObj.textColor }}
                className="text-[10px] font-bold opacity-80 mt-1 bg-white/40 dark:bg-black/20 px-2 py-0.5 rounded-full"
              >
                🎂 {customization.petBirthday}
              </span>
            )}
          </div>

          {/* Anti-Ant Water Moat Base Ring */}
          <div
            style={{
              backgroundColor: selectedBaseObj.hex,
              borderColor: selectedBaseObj.border,
            }}
            className="w-56 sm:w-60 h-8 rounded-2xl border-2 shadow-lg flex items-center justify-center relative -mt-2 z-0 transition-colors duration-300"
          >
            <span className="text-[9px] font-bold text-white/90 dark:text-cute-brown/90 tracking-wide uppercase drop-shadow">
              💧 Khoang chứa nước chống kiến
            </span>
          </div>

        </div>

        {/* Live caption */}
        <p className="text-[11px] text-cute-brown-light dark:text-cute-muted mt-3 font-medium">
          Màu thân: <strong className="text-cute-brown dark:text-cute-cream">{currentBody}</strong> • Màu đế: <strong className="text-cute-brown dark:text-cute-cream">{currentBase}</strong>
        </p>
      </div>

      {isDogBowl && (
        <div className="space-y-4">
          
          {/* Step 1: Pet Name */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-rose-500" />
                <span>1. Tên thú cưng in nổi trên thân bát *</span>
              </span>
              <span className="text-[10px] text-cute-brown-light">Ví dụ: Ngáo, Mr.Lu, Béo, Bắp</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên bé (Ví dụ: Ngáo, Mr.Lu, Bắp, Miu Miu...)"
              value={customization.petName || ''}
              onChange={(e) => updateField('petName', e.target.value)}
              maxLength={20}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300 font-bold"
            />
          </div>

          {/* Step 2: Choose 2 Icons */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>2. Chọn tối đa 2 icon ngộ nghĩnh đi kèm tên:</span>
              </span>
              <span className="text-[11px] text-rose-500 font-bold">
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
                    className={`h-11 rounded-xl flex flex-col items-center justify-center text-lg transition-all border ${
                      isSelected
                        ? 'bg-cute-pink text-cute-brown border-rose-400 ring-2 ring-rose-300 scale-105 shadow-sm font-bold'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light hover:bg-cute-cream text-cute-brown opacity-85'
                    }`}
                  >
                    <span>{item.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Color 1 - Body Color */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>3. Màu thân bát (Màu chính):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BODY_COLORS.map((col) => {
                const isSelected = currentBody === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => updateField('bodyColor', col.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'bg-cute-pink/40 border-rose-400 ring-1 ring-rose-300 text-cute-brown shadow-sm'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: col.hex, borderColor: col.border }}
                      className="w-5 h-5 rounded-full border shadow-inner flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && <Check className="w-3 h-3 text-cute-brown" />}
                    </span>
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Color 2 - Base Color */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>4. Màu đế khoang chứa nước chống kiến:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BASE_COLORS.map((col) => {
                const isSelected = currentBase === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => updateField('baseColor', col.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'bg-cute-pink/40 border-rose-400 ring-1 ring-rose-300 text-cute-brown shadow-sm'
                        : 'bg-white dark:bg-cute-surface-dark border-cute-border-light text-cute-brown dark:text-cute-cream hover:bg-cute-cream'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: col.hex, borderColor: col.border }}
                      className="w-5 h-5 rounded-full border shadow-inner flex items-center justify-center flex-shrink-0"
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Pet Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>5. Ngày sinh của bé cưng (tùy chọn)</span>
              </label>
              <input
                type="date"
                value={customization.petBirthday || ''}
                onChange={(e) => updateField('petBirthday', e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
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
                onChange={(e) => updateField('customNotes', e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
            </div>
          </div>

        </div>
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
              onChange={(e) => updateField('customText', e.target.value)}
              maxLength={25}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1">
              Kiểu móc khoá mong muốn:
            </label>
            <select
              value={customization.keychainDesign || 'Khoen tròn vàng hồng'}
              onChange={(e) => updateField('keychainDesign', e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
            >
              <option value="Khoen tròn vàng hồng">Khoen tròn mạ vàng hồng cao cấp</option>
              <option value="Móc càng cua trái tim">Móc bấm càng cua hình trái tim</option>
              <option value="Dây treo balo chuông con">Dây dù phong cách kèm chuông leng keng</option>
            </select>
          </div>
        </div>
      )}

      {!isDogBowl && !isKeychain && (
        <div>
          <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
            Thông tin khắc trên thẻ tên / phụ kiện (Tên + 1-2 SĐT):
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Miu Miu - 0912.345.678"
            value={customization.customText || ''}
            onChange={(e) => updateField('customText', e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
          />
        </div>
      )}
    </div>
  );
};
