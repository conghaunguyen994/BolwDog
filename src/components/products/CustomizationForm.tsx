import React from 'react';
import { Sparkles, Camera, Heart, Calendar, Smile } from 'lucide-react';
import { PetCustomization } from '../../types/order';

interface CustomizationFormProps {
  categoryId: string;
  customization: PetCustomization;
  onChange: (customization: PetCustomization) => void;
}

export const CustomizationForm: React.FC<CustomizationFormProps> = ({
  categoryId,
  customization,
  onChange,
}) => {
  const isDogBowl = categoryId === 'cat-bowls';
  const isKeychain = categoryId === 'cat-keychains';

  const updateField = (key: keyof PetCustomization, value: string) => {
    onChange({
      ...customization,
      [key]: value,
    });
  };

  const handlePhotoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      updateField('petPhotoUrl', fakeUrl);
    }
  };

  return (
    <div className="space-y-4 p-5 rounded-3xl bg-cute-cream/70 dark:bg-cute-cream-dark/50 border border-cute-pink/40 dark:border-cute-border-dark shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-cute-pink/30 dark:border-cute-border-dark">
        <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cute-pink-400" />
          <span>Tùy Biến 3D Riêng Biệt Cho Bé</span>
        </h4>
        <span className="text-[11px] text-cute-pink-500 font-semibold bg-cute-pink/30 px-2 py-0.5 rounded-full">
          Miễn phí khắc tên
        </span>
      </div>

      {/* Live 3D Emboss Name Preview Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cute-pink/30 via-cute-peach/30 to-cute-lavender/30 dark:from-cute-surface-dark dark:to-cute-cream-dark border border-dashed border-cute-pink/60 text-center relative overflow-hidden">
        <span className="text-[10px] text-cute-brown-light dark:text-cute-muted uppercase tracking-wider font-bold block mb-1">
          Mẫu xem trước vị trí in 3D nổi trên sản phẩm:
        </span>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-cute-surface-dark shadow-cute border border-cute-pink/40">
          <span className="text-lg">🐾</span>
          <span className="text-base font-extrabold text-cute-brown dark:text-cute-pink-200 tracking-wide">
            {customization.petName || customization.customText || 'Tên Cún Yêu'}
          </span>
          <span className="text-lg">✨</span>
        </div>
      </div>

      {isDogBowl && (
        <div className="space-y-3.5">
          {/* Pet Name */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-cute-pink-400" />
              <span>Tên bé cún muốn khắc lên vành bát *</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bắp, Miu Miu, Corgi Béo..."
              value={customization.petName || ''}
              onChange={(e) => updateField('petName', e.target.value)}
              maxLength={25}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
            />
          </div>

          {/* Age & Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-cute-pink-400" />
                <span>Tuổi của bé (không bắt buộc)</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 8 tháng tuổi"
                value={customization.petAge || ''}
                onChange={(e) => updateField('petAge', e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cute-pink-400" />
                <span>Sinh nhật bé (không bắt buộc)</span>
              </label>
              <input
                type="date"
                value={customization.petBirthday || ''}
                onChange={(e) => updateField('petBirthday', e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
            </div>
          </div>

          {/* Photo Upload Simulator */}
          <div>
            <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-cute-pink-400" />
              <span>Ảnh bé cưng để nghệ nhân tham khảo màu lông (tùy chọn)</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/20 transition-colors shadow-sm">
                <Camera className="w-4 h-4 text-cute-pink-400" />
                <span>Chọn ảnh từ máy</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadSim}
                  className="hidden"
                />
              </label>
              {customization.petPhotoUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={customization.petPhotoUrl}
                    alt="Preview"
                    className="w-9 h-9 rounded-xl object-cover border border-cute-pink"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold">Đã tải ảnh bé lên!</span>
                </div>
              )}
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-semibold text-cute-brown dark:text-cute-cream mb-1">
              Ghi chú riêng cho nghệ nhân in 3D:
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Bé thuộc giống Phốc Sóc, làm thêm icon hình trái tim ở cạnh tên..."
              value={customization.customNotes || ''}
              onChange={(e) => updateField('customNotes', e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300 resize-none"
            />
          </div>
        </div>
      )}

      {isKeychain && (
        <div className="space-y-3.5">
          {/* Custom Text / Name / Phone */}
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

