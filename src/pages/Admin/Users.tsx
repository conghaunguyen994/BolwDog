import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Ban,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { authService, isOwnerAdminEmail } from '../../services/authService';
import { settingsService } from '../../services/settingsService';
import { ShopSettings, BlockedClientRule } from '../../types/settings';
import { defaultShopSettings } from '../../constants/defaultSettings';
import { UserManagementProfile } from '../../types/user';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserManagementProfile[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultShopSettings);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Modal Block User State
  const [selectedUser, setSelectedUser] = useState<UserManagementProfile | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState(
    'Có hành vi spam đơn hàng, click liên tục hoặc có dấu hiệu phá hoại hệ thống.'
  );
  const [processing, setProcessing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Quick Block Value (Số điện thoại / Email bất kỳ)
  const [quickBlockType, setQuickBlockType] = useState<'phone' | 'email'>('phone');
  const [quickBlockVal, setQuickBlockVal] = useState('');
  const [quickBlockReason, setQuickBlockReason] = useState('Phát hiện spam phá website');

  const loadAll = async () => {
    setLoading(true);
    setFeedbackNotice(null);
    try {
      const [userList, shopSet] = await Promise.all([
        authService.getAllUsers(),
        settingsService.getSettings(),
      ]);
      setUsers(userList);
      setSettings(shopSet);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openBlockModal = (user: UserManagementProfile) => {
    if (isOwnerAdminEmail(user.email)) {
      alert('⚠️ Không thể chặn tài khoản của Chủ sở hữu (Admin)!');
      return;
    }
    setSelectedUser(user);
    setBlockReason('Có hành vi spam đơn hàng, click liên tục hoặc phá hoại website.');
    setIsBlockModalOpen(true);
  };

  const handleConfirmToggleBlock = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      const willBlock = !selectedUser.is_blocked;
      await authService.setBlockUser(selectedUser.id, willBlock, blockReason);

      // Đồng bộ vào blocked_rules trong shop_settings
      const currentRules = settings.blocked_rules || [];
      let nextRules: BlockedClientRule[];

      if (willBlock) {
        const newRule: BlockedClientRule = {
          id: `rule-${Date.now()}`,
          type: 'email',
          value: selectedUser.email.toLowerCase(),
          reason: blockReason,
          blocked_at: new Date().toISOString(),
        };
        nextRules = [...currentRules.filter((r) => r.value.toLowerCase() !== selectedUser.email.toLowerCase()), newRule];
      } else {
        nextRules = currentRules.filter((r) => r.value.toLowerCase() !== selectedUser.email.toLowerCase());
      }

      const updatedSettings: ShopSettings = {
        ...settings,
        blocked_rules: nextRules,
      };
      await settingsService.updateSettings(updatedSettings);
      setSettings(updatedSettings);

      setFeedbackNotice(
        willBlock
          ? `🚫 Đã chặn thành công người dùng "${selectedUser.fullName || selectedUser.email}". Người này sẽ bị chặn ngay lập tức và không thể vào lại website!`
          : `✅ Đã gỡ bỏ chặn cho người dùng "${selectedUser.fullName || selectedUser.email}".`
      );

      setIsBlockModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddQuickBlockRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = quickBlockVal.trim().toLowerCase();
    if (!cleanVal) return;

    setProcessing(true);
    try {
      const currentRules = settings.blocked_rules || [];
      const newRule: BlockedClientRule = {
        id: `rule-${Date.now()}`,
        type: quickBlockType,
        value: cleanVal,
        reason: quickBlockReason.trim() || 'Phát hiện spam phá website',
        blocked_at: new Date().toISOString(),
      };

      const updatedSettings: ShopSettings = {
        ...settings,
        blocked_rules: [...currentRules.filter((r) => r.value.toLowerCase() !== cleanVal), newRule],
      };

      await settingsService.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      setQuickBlockVal('');
      setFeedbackNotice(`🚫 Đã thêm "${cleanVal}" vào danh sách ĐEN (Blacklist)! Bất kỳ ai dùng thông tin này sẽ bị chặn khỏi website.`);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveQuickBlockRule = async (ruleId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn bỏ chặn cho mục này?')) return;
    setProcessing(true);
    try {
      const currentRules = settings.blocked_rules || [];
      const updatedSettings: ShopSettings = {
        ...settings,
        blocked_rules: currentRules.filter((r) => r.id !== ruleId),
      };
      await settingsService.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      setFeedbackNotice('✅ Đã gỡ bỏ chặn khỏi danh sách ĐEN thành công.');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);

    if (!matchSearch) return false;
    if (statusFilter === 'blocked') return u.is_blocked;
    if (statusFilter === 'active') return !u.is_blocked;
    return true;
  });

  const totalBlocked = users.filter((u) => u.is_blocked).length + (settings.blocked_rules || []).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
              Quản Lý Người Dùng & Chặn Phá Hoại
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              {totalBlocked} đối tượng bị chặn
            </span>
          </div>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Theo dõi danh sách khách hàng, lịch sử đặt đơn và khóa/chặn ngay những ai có hành vi phá web
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          isLoading={loading}
          leftIcon={<Sparkles className="w-4 h-4 text-cute-pink-500" />}
        >
          Làm mới danh sách
        </Button>
      </div>

      {feedbackNotice && (
        <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border-2 border-cute-pink-300 shadow-cute text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center justify-between">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-cute-brown-light hover:text-rose-500">
            ✕
          </button>
        </div>
      )}

      {/* Box Chặn Nhanh Bằng Số Điện Thoại / Email Phá Hoại */}
      <div className="cute-card p-5 sm:p-6 border-2 border-rose-200 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/50 via-white to-cute-peach/20 dark:from-cute-surface-dark space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-cute-brown dark:text-cute-cream">
              Chặn Nhanh Đối Tượng Phá Hoại (Khóa Trực Tiếp Không Cho Vào Web)
            </h3>
            <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
              Nhập SĐT hoặc Email của kẻ phá hoại. Hệ thống sẽ khóa màn hình người này ngay lập tức.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddQuickBlockRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <select
            value={quickBlockType}
            onChange={(e) => setQuickBlockType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark font-semibold text-cute-brown dark:text-cute-cream"
          >
            <option value="phone">Chặn theo Số điện thoại</option>
            <option value="email">Chặn theo Email</option>
          </select>

          <input
            type="text"
            required
            placeholder={quickBlockType === 'phone' ? 'Ví dụ: 0987654321' : 'Ví dụ: spammer@gmail.com'}
            value={quickBlockVal}
            onChange={(e) => setQuickBlockVal(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
          />

          <input
            type="text"
            placeholder="Lý do chặn (VD: Đặt đơn ảo phá shop)"
            value={quickBlockReason}
            onChange={(e) => setQuickBlockReason(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
          />

          <Button type="submit" variant="primary" size="sm" isLoading={processing} leftIcon={<Ban className="w-3.5 h-3.5" />}>
            Chặn Truy Cập Ngay
          </Button>
        </form>

        {/* Danh sách các rule chặn hiện có */}
        {settings.blocked_rules && settings.blocked_rules.length > 0 && (
          <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/30 space-y-2">
            <span className="text-[11px] font-bold text-cute-brown dark:text-cute-cream block">
              Danh sách chặn riêng lẻ ({settings.blocked_rules.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {settings.blocked_rules.map((rule) => (
                <span
                  key={rule.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs font-bold border border-rose-300"
                >
                  <span>
                    {rule.type === 'phone' ? '📞' : '✉️'} {rule.value} ({rule.reason})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuickBlockRule(rule.id)}
                    className="p-0.5 hover:text-rose-600 rounded"
                    title="Gỡ chặn"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="cute-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc SĐT người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-2xl border border-cute-border-light bg-cute-cream/40 focus:outline-none"
          />
          <Search className="w-4 h-4 text-cute-brown-light absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-cute-pink text-cute-brown shadow-sm'
                : 'bg-cute-cream/50 text-cute-brown-light hover:bg-cute-cream'
            }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-cute-cream/50 text-cute-brown-light hover:bg-cute-cream'
            }`}
          >
            Bình thường ({users.filter((u) => !u.is_blocked).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'blocked'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-cute-cream/50 text-cute-brown-light hover:bg-cute-cream'
            }`}
          >
            Đang bị chặn ({users.filter((u) => u.is_blocked).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="cute-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cute-cream/60 border-b border-cute-border-light text-cute-brown-light uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3 font-bold">Người dùng</th>
                <th className="py-3.5 px-3 font-bold">Liên hệ</th>
                <th className="py-3.5 px-3 font-bold">Vai trò</th>
                <th className="py-3.5 px-3 font-bold">Số đơn hàng</th>
                <th className="py-3.5 px-3 font-bold">Tổng chi tiêu</th>
                <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                <th className="py-3.5 px-3 font-bold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cute-border-light/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-cute-brown-light">
                    {loading ? 'Đang tải danh sách người dùng...' : 'Không tìm thấy người dùng nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = isOwnerAdminEmail(u.email);
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-cute-cream/30 transition-colors ${
                        u.is_blocked ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isOwner
                                ? 'bg-purple-600 text-white'
                                : u.is_blocked
                                ? 'bg-rose-500 text-white'
                                : 'bg-cute-pink/60 text-cute-brown'
                            }`}
                          >
                            {isOwner ? '👑' : u.is_blocked ? '🚫' : '🐾'}
                          </div>
                          <div>
                            <span className="font-bold text-cute-brown dark:text-cute-cream block">
                              {u.fullName}
                            </span>
                            <span className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                              Tham gia: {formatDate(u.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Mail className="w-3 h-3 text-cute-pink-500" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="flex items-center gap-1 text-[11px] text-cute-brown-light">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isOwner ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Chủ Tiệm (Admin)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cute-cream text-cute-brown">
                            Khách hàng
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-cute-pink-400" />
                          {u.total_orders || 0} đơn
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold text-rose-500 whitespace-nowrap">
                        {formatVND(u.total_spent || 0)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {u.is_blocked ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                              <Ban className="w-3 h-3" /> Đã bị chặn
                            </span>
                            {u.blocked_reason && (
                              <span className="text-[10px] text-rose-600 block max-w-xs truncate" title={u.blocked_reason}>
                                {u.blocked_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isOwner ? (
                          <span className="text-[11px] text-cute-brown-light italic">Chủ tiệm</span>
                        ) : u.is_blocked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBlockModal(u)}
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px]"
                          >
                            Mở chặn lại
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openBlockModal(u)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[11px]"
                            leftIcon={<Ban className="w-3 h-3" />}
                          >
                            Chặn người này
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal xác nhận Chặn / Mở Chặn */}
      {isBlockModalOpen && selectedUser && (
        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          title={selectedUser.is_blocked ? 'Mở Khóa Cho Người Dùng' : 'Xác Nhận Chặn Người Dùng Phá Hoại'}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {selectedUser.is_blocked
                  ? 'Gỡ bỏ lệnh chặn để khách vào lại web'
                  : 'Người này sẽ bị đá văng ra và chặn toàn bộ website ngay lập tức!'}
              </span>
              <p className="text-[11px] leading-relaxed">
                Tài khoản: <strong>{selectedUser.fullName}</strong> ({selectedUser.email})
              </p>
            </div>

            {!selectedUser.is_blocked && (
              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">
                  Lý do chặn (Hiển thị cho người dùng khi cố truy cập):
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none resize-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-cute-border-light">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsBlockModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={processing}
                onClick={handleConfirmToggleBlock}
                className={selectedUser.is_blocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {selectedUser.is_blocked ? 'Xác nhận mở chặn' : 'Chặn truy cập ngay'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

