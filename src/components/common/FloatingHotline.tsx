import React, { useState } from 'react';
import { Phone, MessageCircle, X, Sparkles } from 'lucide-react';

interface FloatingHotlineProps {
  phone?: string;
  zaloPhone?: string;
}

export const FloatingHotline: React.FC<FloatingHotlineProps> = ({
  phone = '0345553913',
  zaloPhone = '0345553913',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanPhone = phone.replace(/\s+/g, '');
  const cleanZalo = zaloPhone.replace(/\s+/g, '');
  const zaloUrl = `https://zalo.me/${cleanZalo}`;
  const telUrl = `tel:${cleanPhone}`;

  return (
    <div className="fixed bottom-20 md:bottom-7 right-4 z-40 flex flex-col items-end gap-2.5 select-none print:hidden">
      {/* Popover chi tiết khi bấm vào hoặc mở rộng */}
      {isExpanded && (
        <div className="cute-card p-4 rounded-3xl shadow-2xl border-2 border-cute-pink-300 dark:border-cute-pink-500/50 bg-white/95 dark:bg-cute-surface-dark/95 backdrop-blur-md w-72 max-w-[85vw] space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-cute-border-light dark:border-cute-border-dark">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🐾</span>
              <span className="text-xs font-black text-cute-brown dark:text-cute-cream">
                Hỗ trợ tư vấn in 3D 24/7
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-6 h-6 rounded-full bg-cute-cream dark:bg-cute-cream-dark text-cute-brown flex items-center justify-center hover:bg-rose-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
            Ba mẹ cần tư vấn chọn size bát, phối màu theo bé hoặc gửi hình mẫu riêng cứ nhắn xưởng ngay nhé!
          </p>

          <div className="space-y-2 pt-1">
            {/* Zalo Button */}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#0068FF] hover:bg-[#0052cc] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-black text-[13px] tracking-tight">
                  Zalo
                </div>
                <div className="text-left">
                  <div className="text-[10px] opacity-90 leading-tight">Nhắn Zalo tư vấn</div>
                  <div className="text-xs font-extrabold tracking-wide">{phone}</div>
                </div>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold group-hover:bg-white group-hover:text-[#0068FF] transition-colors">
                Chat ngay
              </span>
            </a>

            {/* Gọi điện trực tiếp */}
            <a
              href={telUrl}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white animate-bounce" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] opacity-90 leading-tight">Gọi Hotline trực tiếp</div>
                  <div className="text-xs font-extrabold tracking-wide">{phone}</div>
                </div>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold group-hover:bg-white group-hover:text-emerald-700 transition-colors">
                Gọi
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Pill */}
      <div className="flex items-center gap-2">
        {/* Quick Zalo Direct Pill */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat Zalo 0345553913"
          className="group flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-gradient-to-r from-[#0068FF] to-[#0084FF] text-white font-black text-xs shadow-cute-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/80 ring-2 ring-blue-300/40"
        >
          <span className="w-6 h-6 rounded-full bg-white text-[#0068FF] flex items-center justify-center text-[11px] font-black shadow-sm group-hover:rotate-12 transition-transform">
            Z
          </span>
          <span className="flex flex-col text-left leading-tight">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              Zalo Hỗ Trợ <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </span>
            <span className="text-xs font-black tracking-wide">{phone}</span>
          </span>
        </a>

        {/* Nút Call / Mở menu liên hệ tròn có hiệu ứng nhấp nháy phát sáng */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Hotline tư vấn"
          title="Bấm để xem Hotline & Zalo"
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-rose-500 via-cute-pink-500 to-amber-400 text-white flex items-center justify-center shadow-cute-lg hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white focus:outline-none"
        >
          {/* Vòng lan tỏa (Pulse Wave) */}
          <span className="absolute -inset-1 rounded-full bg-rose-400/50 animate-ping pointer-events-none" />
          <span className="absolute -inset-1.5 rounded-full border-2 border-cute-pink-400/40 animate-pulse-gentle pointer-events-none" />

          {isExpanded ? (
            <X className="w-5 h-5 text-white relative z-10" />
          ) : (
            <Phone className="w-5 h-5 text-white relative z-10 animate-bounce" />
          )}
        </button>
      </div>
    </div>
  );
};

