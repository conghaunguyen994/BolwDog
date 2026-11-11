# 🐾 BolwDog Studio – Cute 3D Pet Shop E-commerce

Website thương mại điện tử chuyên nghiệp, phong cách **Cute, Soft & Delicate** dành riêng cho tiệm đồ in 3D thú cưng (bát ăn in 3D cá nhân hóa tên bé, móc khóa 3D hình thú cưng, thẻ tên dạ quang chống lạc).

---

## 🌸 Tính Năng Nổi Bật

1. **Thiết kế phong cách Pet Boutique**:
   - Tông màu pastel dịu ngọt (Hồng phấn `#F8DDE5`, Kem sữa `#FFF9F2`, Tím lavender `#EAE3F8`, Cam đào `#F9E6D7`, Nâu ấm `#6B514A`).
   - Hỗ trợ đầy đủ **Giao diện Ngày & Đêm (Dark Mode / Light Mode)** với nút chuyển đổi êm ái, lưu trạng thái vào localStorage.
   - Microcopy tiếng Việt siêu đáng yêu:
     - Thêm vào giỏ hàng ➔ **"Thêm bé vào giỏ"**
     - Mua ngay ➔ **"Đón bé về nhà"**
     - Giỏ hàng ➔ **"Giỏ nhà bé"**
     - Đặt hàng ➔ **"Hoàn tất đơn yêu thương"**
     - Giỏ trống ➔ **"Giỏ đang đợi những bé xinh"**
     - Hết hàng ➔ **"Bé đang tạm hết hàng"**
     - Liên hệ ➔ **"Nhắn tin cho shop nhé"**

2. **Tùy biến in 3D trực quan (Live Customization)**:
   - Nhập tên bé cún hiển thị mô phỏng khắc nổi 3D theo thời gian thực.
   - Nhập tuổi, sinh nhật, ghi chú riêng cho nghệ nhân in 3D và tải ảnh tham khảo màu lông.
   - Tùy chọn kiểu dáng móc khóa (khoen vàng hồng, càng cua trái tim, dây chuông).

3. **Mua hàng ẩn danh (Guest Checkout) bảo mật**:
   - **Tuyệt đối KHÔNG ép buộc khách hàng phải đăng ký hay đăng nhập** mới được mua hàng.
   - Xác thực biểu mẫu chặt chẽ với **Zod** & **React Hook Form**.
   - Lưu trữ giỏ hàng bền vững với **Redux Toolkit** và `localStorage`.

4. **Thanh toán đặt cọc chuyển khoản VietQR chuẩn quốc gia**:
   - Tự động sinh mã VietQR động tích hợp tên ngân hàng, chủ tài khoản, số tiền cọc (50%) và cú pháp đơn `BD-YYYYMMDD-XXXXX`.
   - Nút sao chép số tài khoản & nội dung tiện lợi.
   - Upload ảnh biên lai chuyển tiền để tiệm kiểm duyệt.
   - **Bảo mật tuyệt đối**: Hệ thống KHÔNG tự động chuyển trạng thái đơn sang đã trả tiền nếu chỉ mới quét QR hay upload ảnh, tránh giả mạo bằng chứng thanh toán.

5. **Cổng Quản Trị Admin (`/admin`)**:
   - Thống kê thời gian thực: Đơn hôm nay, doanh thu cọc nhận hôm nay, đơn chờ duyệt cọc, sản phẩm sắp hết hàng.
   - **Quản lý đơn hàng**: Tìm kiếm theo mã/SĐT, lọc theo trạng thái đơn & thanh toán, xem chi tiết tùy biến tên bé, duyệt cọc, chuyển trạng thái in 3D và giao hàng.
   - **Quản lý sản phẩm**: Thêm mới, chỉnh sửa, xóa có xác nhận, quản lý phân loại size/màu sắc, cấu hình sản phẩm nổi bật.
   - **Cài đặt tiệm**: Cập nhật thông tin hotline, địa chỉ, link mạng xã hội (Facebook, TikTok, Instagram), số tài khoản ngân hàng và % tiền cọc.

6. **Tra cứu đơn hàng (`/track`)**:
   - Khách mua ẩn danh có thể tra cứu nhanh chỉ với mã đơn + số điện thoại mà không cần đăng nhập.
   - Hiển thị thanh tiến độ 5 bước: *Chờ xác nhận ➔ Đã duyệt cọc ➔ Đang in 3D ➔ Đang giao hàng ➔ Hoàn tất*.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 19** + **Vite 8** + **TypeScript**
- **Redux Toolkit** (Quản lý trạng thái giỏ hàng, bộ lọc, xác thực & theme)
- **Tailwind CSS** (Design system cute với token tùy biến)
- **React Router v7**
- **React Hook Form** + **Zod** (Kiểm tra dữ liệu form)
- **Lucide React** (Bộ biểu tượng hiện đại)
- **Canvas Confetti** (Hiệu ứng pháo giấy dễ thương khi hoàn tất đơn)

### Backend & Database (Supabase)
- **PostgreSQL Database** với Row Level Security (RLS)
- **Supabase Authentication**
- **Supabase Storage** cho ảnh sản phẩm và biên lai cọc
- **PostgreSQL RPCs**:
  - `create_secure_order`: Tính toán giá tiền và lưu đơn hàng nguyên tử (atomic), chống gian lận giá từ phía client.
  - `get_guest_order`: Tra cứu đơn hàng an toàn chỉ với mã đơn và số điện thoại, chặn tuyệt đối việc crawler quét toàn bộ đơn hàng khách khác.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Chạy Ngay Lập Tức (Chế Độ Demo Sẵn Có)
Dự án được tích hợp sẵn **Kiến trúc Dual-Mode**, bạn có thể chạy và trải nghiệm ngay toàn bộ tính năng (giỏ hàng, checkout, đặt cọc QR, quản trị admin) mà **chưa cần cấu hình Supabase**:

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy dev server
npm run dev
```

Mở trình duyệt tại: `http://localhost:5173`

#### Tài khoản Admin thử nghiệm nhanh:
- Bấm vào mục **Admin** trên thanh menu hoặc vào `/login`.
- Nhấn nút màu tím: **"Đăng Nhập Nhanh Với Tư Cách Admin 🐾"** (hoặc dùng `admin@bowldog.vn` / `admin123`).

---

## 🗄️ Hướng Dẫn Kết Nối Supabase Thực Tế

Khi bạn đã sẵn sàng sử dụng cơ sở dữ liệu Supabase thực tế:

### Bước 1: Khởi tạo Project trên Supabase
1. Đăng nhập [https://supabase.com](https://supabase.com) và tạo một Project mới.
2. Vào **Project Settings** ➔ **API** và sao chép:
   - `Project URL`
   - `anon public key` (chỉ dùng anon key, **tuyệt đối KHÔNG dùng service_role key**)

### Bước 2: Điền biến môi trường `.env`
Mở file `.env` và điền:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
```

### Bước 3: Chạy SQL Migrations trong SQL Editor của Supabase
Trong trang quản trị Supabase, vào mục **SQL Editor** và lần lượt chạy nội dung 3 file trong thư mục `supabase/`:
1. `supabase/migrations/20261111000000_init_schema.sql` (Tạo bảng, ENUMs và khóa ngoại)
2. `supabase/migrations/20261111000001_security_and_rls.sql` (Bật RLS, phân quyền và các hàm RPC bảo mật)
3. `supabase/seed.sql` (Nạp dữ liệu mẫu ban đầu: danh mục, sản phẩm in 3D, cài đặt ngân hàng)

### Bước 4: Tạo tài khoản Admin trên Supabase
1. Vào **Authentication** ➔ **Users** ➔ Thêm người dùng với email mong muốn (ví dụ: `admin@bowldog.vn`).
2. Vào **SQL Editor** và gán quyền admin cho tài khoản đó:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@bowldog.vn');
```

---

## 🔒 Kiến Trúc Bảo Mật & Phòng Chống Gian Lận

| Rủi ro / Tấn công | Giải pháp bảo mật của BolwDog |
|---|---|
| **Sửa đổi giá sản phẩm từ Client** | Hàm RPC `create_secure_order` trên PostgreSQL tự động truy vấn giá thực tế trong bảng `products` để tính tổng tiền và tiền cọc. Mọi dữ liệu giá từ trình duyệt đều bị bỏ qua. |
| **Leo thang đặc quyền (Privilege Escalation)** | Trigger PostgreSQL `tr_protect_profile_role` chặn người dùng tự cập nhật cột `role` trong bảng `profiles`. Quyền Admin được kiểm tra bằng hàm `is_admin()` (`SECURITY DEFINER`). |
| **Thu thập trái phép đơn hàng của khách khác** | Bảng `orders` được kích hoạt RLS. Người dùng ẩn danh không thể chạy `SELECT * FROM orders`. Khách mua chỉ có thể tra cứu đơn của mình thông qua RPC yêu cầu đồng thời Mã đơn ngẫu nhiên (`BD-YYYYMMDD-XXXXX`) và Số điện thoại đặt hàng. |
| **Giả mạo trạng thái đã thanh toán** | Khách hàng chỉ có quyền tải ảnh biên lai lên bảng `payments` ở trạng thái `pending_verification`. Chỉ tài khoản có `role = 'admin'` mới có quyền cập nhật `order_status` sang `confirmed` và `payment_status` sang `partially_paid` / `paid`. |

---

## 🐾 Cấu Trúc Thư Mục

```
BolwDog/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 20261111000000_init_schema.sql
│   │   └── 20261111000001_security_and_rls.sql
│   └── seed.sql
└── src/
    ├── app/               # Redux store & typed hooks
    ├── components/
    │   ├── common/        # Button, Badge, Modal, ThemeToggle
    │   ├── layout/        # Header, Footer, MobileNav, MainLayout, AdminLayout
    │   ├── products/      # ProductCard, CustomizationForm
    │   ├── cart/          # CartDrawer
    │   └── checkout/      # BankTransferQRModal, OrderSuccessModal
    ├── features/          # Redux slices: cart, auth, theme, filters
    ├── pages/             # Home, Products, ProductDetail, Cart, Checkout, OrderTracking, Admin
    ├── routes/            # AppRouter, AdminRoute guard
    ├── schemas/           # Zod validation schemas
    ├── services/          # Dual-mode service layer (Supabase + Mock fallback)
    ├── types/             # TypeScript models
    └── utils/             # formatVND, qrGenerator, dates
```

---

*BolwDog – Sản phẩm in 3D cá nhân hóa gửi trọn tình thương cho bé yêu!*
