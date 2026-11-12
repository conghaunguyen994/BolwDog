import React, { useState } from 'react';
import { ShieldAlert, Phone, Mail, RotateCcw } from 'lucide-react';
import { setLocalBlockedStatus } from '../../utils/securityGuard';
import { Button } from '../common/Button';

interface BlockedScreenProps {
  reason?: string;
  onRefresh?: () => void;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({
  reason = 'Thiết bị hoặc tài khoản của bạn đã bị Quản trị viên (Admin) chặn truy cập do phát hiện hành vi spam, click liên tục hoặc dấu hiệu phá hoại hệ thống.',
  onRefresh,
}) => {
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] text-white flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#1C1C20] border-2 border-rose-500/60 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-3xl sm:text-4xl text-rose-500 animate-pulse">
          🚫
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-black uppercase tracking-wider inline-block">
            Truy cập bị từ chối (403 Forbidden)
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white font-sans">
            Bạn Đã Bị Chặn Khỏi Website
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pt-1">
            {reason}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-neutral-300 space-y-2 text-left">
          <span className="font-bold text-white block flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Nếu bạn cho rằng đây là nhầm lẫn:
          </span>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Vui lòng liên hệ trực tiếp với Chủ tiệm qua Hotline/Zalo bên dưới để được kiểm tra và gỡ bỏ lệnh chặn:
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="https://zalo.me/0345553913"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0068FF] text-white font-bold text-xs hover:bg-[#0052cc] transition-colors"
            >
              <span>Nhắn Zalo: 0345.553.913</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Mở Zalo</span>
            </a>
            <a
              href="tel:0345553913"
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
            >
              <span>Gọi Hotline: 0345.553.913</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Gọi điện</span>
            </a>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckAgain}
            isLoading={checking}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Thử tải lại trang
          </Button>
        </div>
      </div>
    </div>
  );
};

