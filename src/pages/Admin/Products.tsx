import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Search,
  Check,
  X,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product, Category, ProductVariant } from '../../types/product';
import { formatVND } from '../../utils/currency';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPrice, setFormPrice] = useState(100000);
  const [formStock, setFormStock] = useState(20);
  const [formDescription, setFormDescription] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

  // New variant helper inputs
  const [newVarName, setNewVarName] = useState('Kích thước');
  const [newVarVal, setNewVarVal] = useState('');
  const [newVarExtra, setNewVarExtra] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getProducts({ activeOnly: false }),
        productService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategoryId(categories[0]?.id || 'cat-bowls');
    setFormPrice(250000);
    setFormStock(30);
    setFormDescription('');
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormImageUrl('https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop');
    setFormVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormCategoryId(p.category_id);
    setFormPrice(p.price);
    setFormStock(p.stock_quantity);
    setFormDescription(p.description);
    setFormIsFeatured(p.is_featured);
    setFormIsActive(p.is_active);
    setFormImageUrl(p.images[0]?.image_url || '');
    setFormVariants(p.variants || []);
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!newVarVal.trim()) return;
    const v: ProductVariant = {
      id: `var-${Date.now()}`,
      product_id: editingProduct?.id || 'new',
      variant_name: newVarName,
      variant_value: newVarVal.trim(),
      additional_price: Number(newVarExtra) || 0,
      stock_quantity: 50,
    };
    setFormVariants([...formVariants, v]);
    setNewVarVal('');
    setNewVarExtra(0);
  };

  const handleRemoveVariant = (id: string) => {
    setFormVariants(formVariants.filter((v) => v.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert('Vui lòng nhập tên sản phẩm');
    setSaving(true);
    try {
      const generatedSlug = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      await productService.saveProduct({
        id: editingProduct?.id,
        name: formName,
        slug: generatedSlug,
        category_id: formCategoryId,
        price: Number(formPrice),
        stock_quantity: Number(formStock),
        description: formDescription,
        is_featured: formIsFeatured,
        is_active: formIsActive,
        images: [
          {
            id: `img-${Date.now()}`,
            product_id: editingProduct?.id || 'new',
            image_url: formImageUrl,
            display_order: 1,
            is_primary: true,
          },
        ],
        variants: formVariants,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi tiệm?`)) return;
    try {
      await productService.deleteProduct(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
            Quản Lý Sản Phẩm In 3D
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Tạo mới, chỉnh sửa thông tin, giá bán, tồn kho và các phân loại in riêng cho bé
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Thêm mẫu sản phẩm mới
        </Button>
      </div>

      {/* Search Bar */}
      <div className="cute-card p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-2xl border border-cute-border-light bg-cute-cream/40 focus:outline-none"
          />
          <Search className="w-4 h-4 text-cute-brown-light absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Products Table */}
      <div className="cute-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cute-cream/60 border-b border-cute-border-light text-cute-brown-light uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3 font-bold">Hình ảnh</th>
                <th className="py-3.5 px-3 font-bold">Tên sản phẩm</th>
                <th className="py-3.5 px-3 font-bold">Danh mục</th>
                <th className="py-3.5 px-3 font-bold">Giá bán</th>
                <th className="py-3.5 px-3 font-bold">Tồn kho</th>
                <th className="py-3.5 px-3 font-bold">Nổi bật</th>
                <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                <th className="py-3.5 px-3 font-bold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cute-border-light/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-cute-cream/30 transition-colors">
                  <td className="py-3 px-3">
                    <img
                      src={p.images[0]?.image_url || 'https://via.placeholder.com/80'}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-cute-pink"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-cute-brown dark:text-cute-cream max-w-xs">
                    <div className="line-clamp-2">{p.name}</div>
                    <span className="text-[10px] text-cute-brown-light block font-mono">/{p.slug}</span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {p.category?.name || 'Chung'}
                  </td>
                  <td className="py-3 px-3 font-bold text-rose-500 whitespace-nowrap">
                    {formatVND(p.price)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`font-bold ${p.stock_quantity < 10 ? 'text-rose-500' : 'text-cute-brown'}`}>
                      {p.stock_quantity} món
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {p.is_featured ? (
                      <span className="text-rose-500 font-bold">★ Nổi bật</span>
                    ) : (
                      <span className="text-cute-brown-light">Thường</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.is_active ? 'Đang bán' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-xl bg-cute-pink/40 hover:bg-cute-pink text-cute-brown transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-600 transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Product Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Chỉnh Sửa Sản Phẩm In 3D' : 'Thêm Mới Sản Phẩm In 3D'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">Đường dẫn slug</label>
                <input
                  type="text"
                  placeholder="Tuỳ chọn tự động tạo từ tên"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">Danh mục</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">Giá bán (VND) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none font-bold text-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cute-brown mb-1">Số lượng tồn kho *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">URL ảnh sản phẩm</label>
              <input
                type="url"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Mô tả sản phẩm</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cute-border-light text-xs bg-white focus:outline-none resize-none"
              />
            </div>

            {/* Variants Manager */}
            <div className="p-3 rounded-2xl bg-cute-cream/50 border border-cute-border-light space-y-3">
              <span className="text-xs font-bold text-cute-brown block">
                Phân loại sản phẩm (Sizes / Màu sắc):
              </span>
              <div className="flex flex-wrap gap-2">
                {formVariants.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-cute-pink text-xs font-semibold"
                  >
                    <span>{v.variant_name}: {v.variant_value} (+{formatVND(v.additional_price)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 items-center pt-1 text-xs">
                <input
                  type="text"
                  placeholder="Loại (vd: Size, Màu)"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="w-24 px-2.5 py-1.5 rounded-xl border border-cute-border-light bg-white"
                />
                <input
                  type="text"
                  placeholder="Giá trị (vd: Size S, Hồng)"
                  value={newVarVal}
                  onChange={(e) => setNewVarVal(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-xl border border-cute-border-light bg-white"
                />
                <input
                  type="number"
                  placeholder="+ tiền"
                  value={newVarExtra}
                  onChange={(e) => setNewVarExtra(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-xl border border-cute-border-light bg-white"
                />
                <Button type="button" variant="soft" size="sm" onClick={handleAddVariant}>
                  Thêm
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-cute-brown cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="rounded text-cute-pink-500 focus:ring-cute-pink-300 w-4 h-4"
                />
                <span>Đánh dấu sản phẩm NỔI BẬT trang chủ</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-cute-brown cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-cute-pink-500 focus:ring-cute-pink-300 w-4 h-4"
                />
                <span>Đang kinh doanh (Active)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-cute-border-light">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={saving}>
                Lưu sản phẩm
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

