import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { ShopSettings } from '../../types/settings';
import { defaultShopSettings } from '../../constants/defaultSettings';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultShopSettings);

  useEffect(() => {
    settingsService.getSettings().then(setSettings).catch(() => {});
  }, []);

  const info = settings.general_info;
  const socials = settings.social_links;

  return (
    <footer className="mt-16 sm:mt-20 bg-gradient-to-b from-transparent to-cute-peach/20 dark:to-cute-surface-dark border-t border-cute-border-light dark:border-cute-border-dark pt-12 sm:pt-14 pb-24 md:pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Shop Story & Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cute-pink flex items-center justify-center shadow-cute text-xl">
                🐾
              </div>
              <span className="text-2xl font-black text-cute-brown dark:text-cute-cream font-sans">
                {info.shop_name}
              </span>
            </div>
            <p className="text-sm text-cute-brown-light dark:text-cute-muted leading-relaxed">
              {info.tagline}. Mỗi sản phẩm là một tác phẩm thủ công in 3D sinh học thân thiện với bé yêu và hành tinh xanh.
            </p>
            <div className="flex items-center gap-2 text-xs text-cute-brown dark:text-cute-cream font-medium bg-cute-pink/40 dark:bg-cute-surface-dark px-3 py-2 rounded-xl inline-flex">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Chủ tiệm tâm huyết: <strong>{info.owner_name}</strong></span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cute-pink-400" />
              <span>Góc Khám Phá</span>
            </h4>
            <ul className="space-y-2 text-sm text-cute-brown-light dark:text-cute-muted">
              <li>
                <Link to="/products?category=bat-an-cho-cho" className="hover:text-cute-pink-400 transition-colors">
                  🥣 Bát ăn in 3D khắc tên cún
                </Link>
              </li>
              <li>
                <Link to="/products?category=moc-khoa-3d" className="hover:text-cute-pink-400 transition-colors">
                  🔑 Móc khóa 3D giống cún cưng
                </Link>
              </li>
              <li>
                <Link to="/products?category=phu-kien-ca-nhan-hoa" className="hover:text-cute-pink-400 transition-colors">
                  ✨ Bảng tên dạ quang chống lạc
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-cute-pink-400 transition-colors">
                  📦 Tra cứu tiến độ đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cute-pink-400 transition-colors text-xs opacity-85">
                  🔐 Đăng nhập Quản trị / Thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Hours */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <Clock className="w-4 h-4 text-cute-pink-400" />
              <span>Chăm Sóc Ba Mẹ Bé</span>
            </h4>
            <div className="space-y-2.5 text-xs text-cute-brown-light dark:text-cute-muted">
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-cute-pink-400 flex-shrink-0 mt-0.5" />
                <span>Giờ hỗ trợ: {info.support_hours}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-cute-pink-400 flex-shrink-0 mt-0.5" />
                <span>Hotline / Zalo: <strong className="text-cute-brown dark:text-cute-cream">{info.phone}</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-cute-pink-400 flex-shrink-0 mt-0.5" />
                <span>Email phản hồi: {info.email}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cute-pink-400 flex-shrink-0 mt-0.5" />
                <span>Địa chỉ xưởng: {info.address}</span>
              </p>
            </div>
          </div>

          {/* Col 4: Social Media Connection */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <span>Nhắn Tin Cho Shop Nhé</span>
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted">
              Theo dõi những video in 3D và feedback đáng yêu nhất từ các bé cún khắp cả nước:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">f</span> Facebook Fanpage
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              )}
              {socials.tiktok && (
                <a
                  href={socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>🎵</span> TikTok Cún Xinh
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>📷</span> Instagram Gallery
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-cute-border-light/70 dark:border-cute-border-dark flex flex-col sm:flex-row items-center justify-between text-xs text-cute-brown-light dark:text-cute-muted gap-3">
          <p>© {new Date().getFullYear()} {info.shop_name}. Tất cả sản phẩm được thiết kế và in 3D với trọn vẹn tình thương 🐾.</p>
          <div className="flex gap-4">
            <span>Bảo hành form dáng 6 tháng</span>
            <span>•</span>
            <span>Đổi mới nếu lỗi in ấn</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

