# 🐾 BolwDog – Tài Liệu Tổng Hợp Toàn Bộ Kiến Trúc & Mã Nguồn (Single Source of Truth)

> **Mục đích của tài liệu này:**  
> Đây là file tổng hợp duy nhất (**Master Codebase Reference**) mô tả đầy đủ kiến trúc, luồng nghiệp vụ, cấu trúc Database/RPC Supabase, kiểu dữ liệu (`types`), dịch vụ (`services`), bảo mật (`securityGuard`), Redux state (`features`) và danh mục toàn bộ các file trong dự án **BolwDog**.  
> Khi phát triển tính năng mới hoặc bảo trì, **chỉ cần đọc file này** là nắm được 100% hệ thống mà không cần đọc lại từng file code.

---

## 1. Tổng Quan Dự Án & Công Nghệ Sử Dụng (Tech Stack)

- **Tên dự án:** **BolwDog** – Cửa hàng Bát Ăn Chống Gù & Chống Kiến In 3D Cá Nhân Hóa Cho Thú Cưng.
- **Frontend Framework:** React 19 + TypeScript + Vite 6.
- **Quản lý State:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) + `localStorage` persistence cho giỏ hàng & giao diện Sáng/Tối.
- **Routing:** `react-router-dom` v7 (Lazy-loaded pages + Protected `AdminRoute`).
- **Styling:** Tailwind CSS 3 (Custom bảng màu Pastel/Cute: `cute-pink`, `cute-cream`, `cute-brown`, `cute-mint`, hỗ trợ Dark Mode `class`).
- **Form & Validation:** `react-hook-form` + `zod` v4 + `@hookform/resolvers`.
- **Backend / Database / Auth:** Supabase (`@supabase/supabase-js` v2) – PostgreSQL + Row Level Security (RLS) + Security Definer RPC Functions + Supabase Auth.
- **Unit Testing:** Vitest + `@testing-library/react` + `jsdom`.
- **Deployment:** Vercel (`vercel.json` cấu hình SPA rewrite + Security Headers: CSP, HSTS, X-Frame-Options, Referrer-Policy).

---

## 2. Nguyên Tắc Bất Di Bất Dịch Của Dự Án (Core Constraints)

1. **Không dùng file `.env` lưu trên ổ đĩa:**
   - Tuyệt đối không tạo/lưu `.env` chứa Secret Key hay Service Role Key ở máy hay repo.
   - Kết nối Supabase dùng `DEFAULT_SUPABASE_URL` và `DEFAULT_SUPABASE_PUBLISHABLE_KEY` (Anon/Publishable Key an toàn cho trình duyệt, bảo vệ bằng RLS + RPC trên PostgreSQL) trong `src/services/supabase/client.ts`.
   - Cấu hình Email Webhook / EmailJS / Ngân hàng được lưu trong bảng `public.shop_settings` trên Database và quản lý tại `/admin/settings`.
2. **Không dùng Mock Data (`mockData.ts` đã xóa bỏ hoàn toàn):**
   - 100% sản phẩm, đơn hàng, hồ sơ người dùng và cài đặt cửa hàng đều đọc/ghi trực tiếp từ PostgreSQL trên Supabase.
3. **Bảo mật cổng Admin tuyệt đối (`/admin/*`):**
2   - Chỉ tài khoản chủ sở hữu nằm trong danh sách `ALLOWED_ADMIN_EMAILS = ['conghaunguyen994@gmail.com', 'conghaunguyen994@gmail.com.vn', 'haudev99@gmail.com.vn', 'haudev99@gmail.com']` **VÀ** có `role = 'admin'` trong bảng `public.profiles` trên Supabase mới truy cập được `/admin/*`.
   - Cơ chế bảo vệ đa lớp: Xác thực server session thực với Supabase Auth, trigger Database `protect_profile_role` chặn người dùng tự nâng quyền hoặc tự gỡ trạng thái chặn (`is_blocked`).
4. **Ngôn ngữ hiển thị 100% Tiếng Việt:**
   - Mọi trạng thái đơn hàng (`order_status`), trạng thái thanh toán (`payment_status`), trạng thái duyệt mẫu 3D (`demoPreview.status`) đều hiển thị Tiếng Việt qua `src/utils/statusLabels.ts`.

---

## 3. Sơ Đồ Cấu Trúc Thư Mục & Vai Trò Từng File

```text
BolwDog/
├── PROJECT_ARCHITECTURE.md                  # [FILE NÀY] Tài liệu tổng hợp toàn bộ dự án
├── README.md                                # Hướng dẫn chạy dự án nhanh
├── vercel.json                              # Cấu hình SPA Rewrite & HTTP Security Headers (CSP, HSTS, Anti-Clickjacking)
├── tailwind.config.js                       # Cấu hình màu sắc cute-pink, cute-brown, cute-cream, animations
├── vite.config.ts / vitest.config.ts        # Cấu hình bundler Vite (chia vendor chunks) & Vitest
│
├── scripts/
│   └── patch-vite.cjs                       # Polyfill Node 16 cho Vite 6 / Vitest (constants, getRandomValues, isBuiltin, availableParallelism)
│
├── supabase/                                # Toàn bộ SQL Schema, RLS, Trigger & RPC trên Supabase
│   ├── FIX_AUTH_AND_SEED_DB.sql             # [QUAN TRỌNG NHẤT] Script tổng hợp chạy 1 lần: sửa lỗi Auth, tạo bảng, RLS, RPC & nạp dữ liệu gốc
│   ├── FINANCE_MANAGEMENT.sql               # Bảng workshop_expenses & manual_orders quản lý chi phí xưởng in & đơn Zalo/FB
│   ├── seed.sql                             # Dữ liệu sản phẩm chuẩn Bâu Shop & cài đặt mẫu ban đầu
│   └── migrations/
│       ├── 20261111000000_init_schema.sql   # Khởi tạo bảng products, profiles, orders, order_items, shop_settings
│       └── 20261111000001_security_and_rls.sql # Chính sách RLS bảo mật & RPC chống quét đơn
│
└── src/
    ├── main.tsx                             # Điểm khởi chạy ứng dụng React + Redux Provider
    ├── App.tsx                              # Khởi tạo Auth session listener (`onAuthStateChange`), Theme & AppRouter
    ├── index.css                            # CSS toàn cục, class tiện ích `.cute-card`, `.cute-input`, thanh cuộn
    │
    ├── app/                                 # Cấu hình Redux Store
    │   ├── store.ts                         # Kết hợp 4 reducers: `cart`, `filter`, `theme`, `auth`
    │   └── hooks.ts                         # Typed hooks: `useAppDispatch`, `useAppSelector`
    │
    ├── types/                               # Định nghĩa TypeScript Interfaces toàn cục
    │   ├── product.ts                       # `Product`, `ProductCategory`, `ProductSizeOption`, `ProductCustomizationConfig`
    │   ├── cart.ts                          # `CartItem`, `CartItemCustomization` (màu thân, màu đế, tên bé, icon, ngày sinh, ghi chú)
    │   ├── order.ts                         # `Order`, `OrderItem`, `OrderStatus`, `PaymentStatus`, `Demo3DPreview`, `CreateOrderPayload`
    │   ├── finance.ts                       # `ExpenseRecord`, `ManualOrderRecord`, `MonthlyFinancialSummary`, `ExpenseCategory`
    │   └── settings.ts                      # `ShopSettings`, `BankAccountConfig`, `DepositConfig`, `EmailNotificationConfig`
    │
    ├── constants/
    │   └── defaultSettings.ts               # Giá trị mặc định cho `ShopSettings` (Ngân hàng, Cọc 50%, Email Admin)
    │
    ├── features/                            # Redux Slices
    │   ├── auth/authSlice.ts                # Lưu `user`, `isAdmin`, `loading`; kiểm tra whitelist `ALLOWED_ADMIN_EMAILS`
    │   ├── cart/cartSlice.ts                # Giỏ hàng (thêm/sửa/xóa/tính tổng tiền + đồng bộ `localStorage`)
    │   ├── products/filterSlice.ts          # Bộ lọc danh mục, từ khóa tìm kiếm, khoảng giá, sắp xếp
    │   └── theme/themeSlice.ts              # Chế độ Sáng/Tối (`light` / `dark`)
    │
    ├── services/                            # Tầng giao tiếp Backend (Supabase & Email)
    │   ├── supabase/client.ts               # Khởi tạo `supabase` client (không cần `.env`)
    │   ├── authService.ts                   # Đăng ký, Đăng nhập, Đăng xuất, quản lý block user, kiểm tra quyền Admin
    │   ├── productService.ts                # Dữ liệu sản phẩm & 5 kích thước chuẩn Bâu Shop (S: 199K, M: 229K, L: 259K, XL: 300K, XXL: 350K)
    │   ├── orderService.ts                  # Tạo đơn (`create_secure_order`), tra cứu đơn bảo mật PII, duyệt cọc, gửi/duyệt Demo 3D
    │   ├── financeService.ts                # Quản lý chi phí xưởng in 3D & đơn ngoài web (Zalo/Facebook), P&L tháng
    │   ├── settingsService.ts               # Đọc/lưu cài đặt cửa hàng (`shop_settings`) trên Supabase DB
    │   └── emailService.ts                  # Gửi Email tự động 2 chiều (Khách hàng ⇄ Admin) qua Webhook / EmailJS / FormSubmit / Gmail
    │
    ├── schemas/                             # Validation Schemas (Zod)
    │   ├── checkoutSchema.ts                # Kiểm tra form Thanh toán (Tên, SĐT VN, Email, Địa chỉ, Honeypot, Chống XSS)
    │   └── customizationSchema.ts           # Kiểm tra form Cá nhân hóa 3D (tên thú cưng, ngày sinh, ký tự hợp lệ, độ dài)
    │
    ├── utils/                               # Các hàm tiện ích dùng chung
    │   ├── securityGuard.ts                 # Chống Spam click, Rate Limit, Chống trùng đơn, Sanitize XSS, CSRF token, Honeypot, Block status
    │   ├── statusLabels.ts                  # Chuyển đổi trạng thái sang Tiếng Việt, trích xuất `Demo3DPreview`, nén ảnh sang DataURL
    │   ├── currency.ts                      # Định dạng tiền tệ VNĐ (`formatVND`) & tính tiền cọc (`calculateDeposit`)
    │   ├── date.ts                          # Định dạng ngày giờ Việt Nam (`formatDate`)
    │   ├── qrGenerator.ts                   # Tạo link ảnh QR VietQR (`img.vietqr.io`) tự động điền số tiền & nội dung chuyển khoản
    │   └── supabase.ts                      # Re-export `supabase` client
    │
    ├── routes/
    │   ├── AppRouter.tsx                    # Định tuyến toàn bộ trang Public & Admin (`/`, `/products`, `/checkout`, `/track`, `/login`, `/admin/*`)
    │   └── AdminRoute.tsx                   # Guard bảo vệ `/admin/*`: chưa đăng nhập -> `/login`, không phải Admin -> Màn hình từ chối
    │
    ├── components/
    │   ├── common/                          # `Button.tsx`, `Badge.tsx`, `Modal.tsx`, `ThemeToggle.tsx`
    │   ├── layout/                          # `Header.tsx`, `Footer.tsx`, `MobileNav.tsx`, `MainLayout.tsx`, `AdminLayout.tsx`
    │   ├── products/                        # `ProductCard.tsx`, `CustomizationForm.tsx`, `BowlDemoPreviewModal.tsx` (Mô phỏng 3D trực tiếp 2 màu, tên bé, icon, ngày sinh)
    │   ├── cart/                            # `CartDrawer.tsx` (Giỏ hàng trượt bên phải)
    │   └── checkout/                        # `BankTransferQRModal.tsx` (Quét VietQR), `OrderSuccessModal.tsx`
    │
    ├── pages/
    │   ├── Home/index.tsx                   # Trang chủ: Hero banner, tính năng nổi bật, danh sách sản phẩm bán chạy
    │   ├── Products/index.tsx               # Trang danh sách sản phẩm + Bộ lọc danh mục & giá
    │   ├── ProductDetail/index.tsx          # Chi tiết sản phẩm + `CustomizationForm` (mô phỏng màu 3D theo thời gian thực)
    │   ├── Cart/index.tsx                   # Trang giỏ hàng chi tiết
    │   ├── Checkout/index.tsx               # Trang đặt hàng & tính tiền cọc + chống spam/bot
    │   ├── OrderTracking/index.tsx          # Tra cứu đơn hàng (chỉ cần Mã đơn HOẶC SĐT) + Xem/Duyệt Demo 3D + Đăng ký Email
    │   ├── Auth/Login.tsx                   # Đăng nhập / Đăng ký tài khoản + Quản lý tài khoản cá nhân
    │   └── Admin/
    │       ├── Dashboard.tsx                # Thống kê doanh thu, tiền cọc, số đơn chờ xử lý, đơn gần đây
    │       ├── Orders.tsx                   # Quản lý đơn hàng, duyệt cọc, tải ảnh Demo 3D gửi khách, thông báo khi khách yêu cầu sửa
    │       ├── Finances.tsx                 # Quản lý tài chính: Chi phí in 3D (nhựa, điện, ads, hao hụt), đơn ngoài web, biểu đồ P&L tháng
    │       ├── Products.tsx                 # Thêm / Sửa / Xóa / Bật tắt tồn kho sản phẩm in 3D
    │       ├── Users.tsx                    # Quản lý người dùng & Chặn tài khoản/SĐT/Email phá hoại
    │       └── Settings.tsx                 # Cấu hình Ngân hàng VietQR, Tỷ lệ cọc, Thông tin shop & Email tự động 2 chiều
    │
    └── tests/                               # Bộ kiểm thử tự động (Vitest)
        ├── cartSlice.test.ts                # Test logic giỏ hàng & tính tiền
        ├── checkoutValidation.test.ts       # Test Zod schema & tính tiền cọc
        ├── financeService.test.ts           # Test tính toán P&L, tỷ lệ hao hụt, doanh thu tổng hợp
        └── securityOrder.test.ts            # Test chống XSS, Rate Limit, Action Lock, Duplicate Order
```

---

## 4. Chi Tiết Cơ Sở Dữ Liệu Supabase (Tables, RLS & RPC Functions)

Toàn bộ cấu trúc DB nằm tại [`supabase/FIX_AUTH_AND_SEED_DB.sql`](file:///c:/Users/nconghau/Desktop/new%20fe/BolwDog/supabase/FIX_AUTH_AND_SEED_DB.sql).

### 4.1. Các Bảng Dữ Liệu (`public.*`)
1. **`public.profiles`**:
   - Cột: `id` (UUID, FK `auth.users`), `email`, `full_name`, `phone`, `role` (`'customer'` | `'admin'`), `is_blocked` (BOOLEAN), `blocked_reason` (TEXT), `blocked_at` (TIMESTAMPTZ), `created_at`, `updated_at`.
   - Trigger `on_auth_user_created` (`public.handle_new_user`): Tự động tạo dòng trong `profiles` khi người dùng đăng ký. Nếu email thuộc danh sách Whitelist Admin chủ shop (`conghaunguyen994@gmail.com`, `conghaunguyen994@gmail.com.vn`, `haudev99@gmail.com.vn`, `haudev99@gmail.com`) thì tự động gán `role = 'admin'`.
   - Trigger `tr_protect_profile_role` (`public.protect_profile_role`): Bảo vệ đa tầng, cấm người dùng thường tự ý đổi `role` hoặc tự gỡ trạng thái chặn (`is_blocked`).
2. **`public.products`**:
   - Cột: `id` (UUID), `name`, `slug` (UNIQUE), `category` (`'bowls'` | `'accessories'` | `'tags'` | `'sanitation'`), `short_description`, `description`, `price` (NUMERIC), `original_price`, `images` (TEXT[]), `video_url`, `rating`, `review_count`, `in_stock` (BOOLEAN), `stock_quantity` (INT), `featured` (BOOLEAN), `is_customizable` (BOOLEAN), `customization_config` (JSONB), `size_options` (JSONB), `specifications` (JSONB), `tags` (TEXT[]).
   - Sản phẩm chủ lực: **BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP** với 5 size chuẩn (S: 199K, M: 229K, L: 259K, XL: 300K, XXL: 350K).
3. **`public.orders`**:
   - Cột: `id` (UUID), `order_reference` (TEXT UNIQUE, VD: `BD-20261112-94A21`), `user_id` (UUID nullable), `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `notes`, `subtotal`, `shipping_fee`, `total_amount`, `deposit_required` (BOOLEAN), `deposit_amount`, `remaining_amount`, `payment_method` (`'bank_transfer_qr'` | `'cod'`), `payment_status` (`'unpaid'` | `'deposit_pending'` | `'partially_paid'` | `'paid'` | `'refunded'`), `order_status` (`'pending'` | `'confirmed'` | `'processing'` | `'shipping'` | `'completed'` | `'cancelled'`), `payment_proof_url`, `created_at`, `updated_at`.
4. **`public.order_items`**:
   - Cột: `id` (UUID), `order_id` (UUID FK `orders`), `product_id` (UUID FK `products`), `product_name`, `product_image`, `size_label`, `quantity`, `unit_price`, `total_price`, `customization_data` (JSONB).
   - **Lưu ý quan trọng về `customization_data` (JSONB):**
     - Lưu thông tin cá nhân hóa của khách (`petName`, `customText`, `selectedColor` [màu thân trên], `baseColor` [màu đế dưới], `fontStyle`, `selectedIcons`, `petBirthday`, `designNotes`), kèm object **`demoPreview`** (`Demo3DPreview`) chứa ảnh bản dựng 3D và trạng thái khách duyệt/yêu cầu sửa.
5. **`public.shop_settings`**:
   - Cột: `id` (INT PK = `1`), `setting_key` (TEXT), `setting_value` (JSONB), `updated_at`.
   - **RLS Policy:** Khách chỉ đọc các cấu hình công khai (ngân hàng VietQR, cọc, hotline shop). Các key nhạy cảm (`workshop_expenses`, `manual_orders`, `financial_reports`) CHỈ Admin mới được xem.
6. **`public.workshop_expenses` & `public.manual_orders`**:
   - Bảng quản lý chi phí xưởng in 3D (nhựa PETG, tiền điện, ads, hao hụt bàn in) & đơn chốt ngoài web (Zalo/Facebook/Offline). Kích hoạt RLS chỉ Admin mới truy cập được.

### 4.2. Các Hàm RPC Bảo Mật (`SECURITY DEFINER`)
Để khách vãng lai (Guest) có thể đặt hàng và tra cứu đơn mà không cần mở quyền `SELECT/UPDATE` công khai trên bảng `orders`:
1. **`public.is_admin()`**:
   - Kiểm tra JWT của user đang đăng nhập có email nằm trong danh sách Admin chính chủ (`conghaunguyen994@gmail.com`, `conghaunguyen994@gmail.com.vn`, `haudev99@gmail.com.vn`, `haudev99@gmail.com`). Đã loại bỏ hoàn toàn các domain sai chính tả.
2. **`public.create_secure_order(...)`**:
   - Nhận thông tin khách hàng và mảng JSON `p_items`.
   - **Tự động đọc giá sản phẩm thực tế từ bảng `public.products` trên Server** để tính `subtotal`, `deposit_amount`, `total_amount` (chống hacker sửa giá ở client).
   - Kiểm tra độ dài hợp lệ, chống XSS SQL regex, chặn đặt trùng đơn liên tiếp trong 45 giây cho cùng SĐT.
   - Tạo mã đơn `BD-YYYYMMDD-XXXXX` và lưu vào `orders` + `order_items`.
3. **`public.get_guest_order(p_order_ref TEXT, p_phone TEXT)`**:
   - Tra cứu đơn hàng an toàn: Bắt buộc khớp chính xác mã đơn (>= 6-8 ký tự) hoặc số điện thoại (>= 9 chữ số). Loại bỏ so khớp mờ `LIKE %...%` để chống hacker quét cạn database.
   - **Che giấu dữ liệu PII (Data Masking):** Khách ngoài chỉ thấy SĐT ẩn `098****231` và địa chỉ ẩn `***, [Quận/Huyện, Tỉnh/Thành]`. Chỉ Admin hoặc chủ sở hữu đăng nhập mới xem được đầy đủ.
   - Giới hạn tối đa 5 đơn gần nhất (`LIMIT 5`).
4. **`public.submit_order_demo_review(...)`**:
   - Duyệt chốt in (`approved`) hoặc yêu cầu chỉnh sửa (`revision_requested`) có xác thực quyền sở hữu đơn hàng (chỉ Admin, chủ tài khoản đăng nhập hoặc người có đúng Mã đơn và Số điện thoại đặt hàng). Kiểm tra chống XSS trong ghi chú phản hồi.

---

## 5. Luồng Nghiệp Vụ Chính (Core Business Workflows)

### 5.1. Luồng Bát Ăn Chống Gù – Chống Kiến Chuẩn Bâu Shop & Mô Phỏng 3D
- **Quy tắc sản phẩm & Bảng giá chuẩn Bâu Shop:**
  - Thiết kế nghiêng **15° chống gù** bảo vệ cột sống cổ thú cưng (size S, M, L).
  - Đế chống kiến với **khoang chứa nước** bảo vệ đồ ăn 100%.
  - Lòng bát Inox 304 tháo rời dễ vệ sinh, thân nhựa sinh học PETG an toàn thực phẩm.
  - **Bát Inox Ø14cm:**
    - Size S : H1: 12 cm - H2: 8cm - D: 18cm ➔ **199.000đ**
    - Size M : H1: 14cm - H2: 10cm - D: 19cm ➔ **229.000đ**
    - Size L : H1: 16cm - H2: 12cm - D: 20cm ➔ **259.000đ**
  - **Bát Inox Ø18-20cm:**
    - Size XL : H1: 15 cm - H2: 15cm - D: 22,5cm ➔ **300.000đ**
    - Size XXL: H1: 17cm - H2: 17cm - D: 25cm ➔ **350.000đ**
- **Cá nhân hóa theo yêu cầu & Xem trước Demo 3D:**
  - Khách tự do chọn **2 màu**: Màu thân ở trên & Màu đế ở dưới.
  - Nhập **Tên thú cưng** in nổi 3D, chọn tối đa **2 icon ngộ nghĩnh**, nhập **Ngày sinh của bé**.
  - **Cửa sổ xem trước mô phỏng 3D (`BowlDemoPreviewModal.tsx`):** Khách có thể bấm nút *"Xem Demo 3D Trước Khi Đặt"* để kiểm tra toàn diện chiếc bát đa góc độ, kiểm tra phối 2 màu, tên nổi, icon và ngày sinh trước khi quyết định bấm đặt hàng.

### 5.2. Luồng Đặt Hàng, Tính Tiền Cọc & VietQR (`Checkout` ➔ `orderService.createOrder`)
- Đơn hàng có sản phẩm in 3D theo yêu cầu (`isCustomized`) hoặc tổng đơn vượt ngưỡng cài đặt (`minOrderValueForDeposit`) sẽ yêu cầu đặt cọc trước (mặc định **50%**).
- Sau khi tạo đơn thành công:
  - Nếu cần đặt cọc hoặc chọn chuyển khoản QR: Mở `BankTransferQRModal` hiển thị mã QR động qua VietQR (`src/utils/qrGenerator.ts`) điền sẵn Số tài khoản, Số tiền cọc và Nội dung chuyển khoản (`BD2026... SDT`).
  - Khách bấm **"Tôi đã chuyển khoản"** ➔ Gọi `orderService.confirmDepositTransferred(orderId)` chuyển `payment_status` sang `'deposit_pending'`.
  - Đồng thời kích hoạt `emailService.notifyOrderCreated(order)` gửi Email báo đơn mới cho Admin và gửi Email xác nhận cho Khách.

### 5.3. Luồng Gửi Bản Demo File 3D & Khách Duyệt Chốt In (`Orders.tsx` ⇄ `OrderTracking/index.tsx`)
1. **Admin gửi Demo 3D (`/admin/orders`):**
   - Sau khi thiết kế xong file 3D trên phần mềm dựng hình, Admin mở chi tiết đơn hàng trong `/admin/orders`.
   - Tại khung **"Gửi Bản Demo File 3D Cho Khách Xem & Chốt In"**, Admin có thể:
     - **Tải ảnh trực tiếp từ máy tính** (hệ thống tự động nén sang WebP/JPEG nét cao qua `compressImageFileToDataUrl` để lưu mượt vào DB mà không cần cấu hình Storage bucket), hoặc dán URL ảnh.
     - Nhập lời nhắn của nghệ nhân (`adminNote`) và Email của khách (`customerEmailInput`).
     - Bấm **"Lưu & Gửi Bản Demo 3D Cho Khách Duyệt"** ➔ Lưu vào `order.items[0].customization_data.demoPreview` với `status = 'pending_review'` và tự động gửi Email cho khách kèm link xem mẫu.
2. **Khách hàng xem & phản hồi trên trang Tra cứu (`/track`):**
   - Khách mở link trong Email hoặc vào `/track` nhập Mã đơn (hoặc SĐT).
   - Khách xem ảnh mô phỏng 3D (hỗ trợ bấm vào ảnh để phóng to Lightbox) và chọn 1 trong 2 nút:
     - **✅ "Ưng Ý 100% – Xác Nhận Chốt In Ngay!"** (`status = 'approved'`): Cập nhật DB + Tự động gửi Email báo Admin bấm máy in 3D.
     - **✏️ "Yêu Cầu Chỉnh Sửa Thêm"** (`status = 'revision_requested'`): Khách nhập chi tiết điểm muốn sửa ➔ Cập nhật DB + Tự động gửi Email báo Admin kèm nội dung cần sửa + Hiển thị Banner cảnh báo màu cam trên đầu trang `/admin/orders` của Admin.

### 5.4. Luồng Gửi Email Tự Động 2 Chiều Không Cần `.env` (`src/services/emailService.ts`)
- Hỗ trợ 4 kênh gửi linh hoạt (ưu tiên từ trên xuống theo cấu hình trong `/admin/settings`):
  1. **Google Apps Script / Custom Webhook (`webhook_url`)**: Gửi trực tiếp từ Gmail của chủ shop tới cả Admin lẫn mọi Email khách hàng (có nút Copy đoạn mã 10 dòng ngay trong `/admin/settings`).
  2. **EmailJS REST API**: Nếu Admin điền `Service ID`, `Template ID`, `Public Key` trong `/admin/settings`.
  3. **FormSubmit.co AJAX Relay**: Hoạt động mặc định cho các thông báo gửi về hộp thư Admin mà không cần cấu hình key.
  4. **Nút "Mở Gmail Gửi Trực Tiếp" (`buildGmailComposeUrl`)**: Luôn sẵn sàng trong Modal đơn hàng để Admin gửi bằng 1 cú click nếu muốn đính kèm thêm file.

---

## 6. Hệ Thống Bảo Mật Đa Tầng (`src/utils/securityGuard.ts`, PostgreSQL RLS & `vercel.json`)

1. **Che Giấu Thông Tin Cá Nhân (PII Data Masking) & Chống Quét Đơn Hàng (Anti-Scraping / IDOR):**
   - Hàm `public.get_guest_order`: Khách vãng lai chỉ thấy SĐT ẩn `098****231` và địa chỉ che số nhà/tên đường `***, [Quận, Thành phố]`. Chỉ Admin hoặc chủ sở hữu đăng nhập mới xem được thông tin gốc.
   - Loại bỏ so khớp mờ `LIKE %...%`, bắt buộc khớp chính xác mã đơn (>= 6 ký tự) hoặc số điện thoại (>= 9 chữ số) và giới hạn `LIMIT 5`.
2. **Chống Leo Thang Đặc Quyền (Privilege Escalation):**
   - Loại bỏ hoàn toàn domain sai chính tả. Whitelist Admin kiểm tra bằng hàm `is_admin()` (`SECURITY DEFINER`) với JWT chính chủ.
   - Trigger Database `protect_profile_role` cấm người dùng thông thường tự ý thay đổi `role`, tự gỡ chặn `is_blocked`, `blocked_reason`, `blocked_at`.
3. **Bảo Vệ Dữ Liệu Tài Chính Xưởng In & Đơn Ngoài Web:**
   - Policy RLS trên `shop_settings` chặn truy cập công khai vào các cấu hình nhạy cảm (`workshop_expenses`, `manual_orders`, `financial_reports`). Chỉ Admin mới được phép đọc và cập nhật.
4. **Bảo Mật Thao Tác Quản Trị & Chống CSRF (`assertCsrfAndSameOrigin`):**
   - Mọi thao tác thêm/sửa/xóa chi phí xưởng, đơn ngoài web và chặn người dùng đều kiểm tra CSRF token và Origin tính hợp lệ.
5. **Chống Spam Click / Double Submit (`withActionLock`):**
   - Khóa bất đồng bộ theo `actionKey` (VD: `create_order`, `submit_payment_proof`, `admin_mutation`), chặn hoàn toàn việc bấm liên tục nhiều lần khi request trước chưa xong + thời gian hồi (cooldown).
6. **Sliding-Window Rate Limiter (`enforceRateLimit`):**
   - Giới hạn tần suất theo cửa sổ trượt lưu kết hợp bộ nhớ & `localStorage`:
     - Đặt đơn hàng: tối đa 3 lần / 15 phút, cooldown 45 giây.
     - Tra cứu đơn hàng: tối đa 10 lần / 60 giây.
     - Thao tác Admin: tối đa 30 lần / 60 giây.
7. **Chống Đặt Trùng Đơn Hàng (`assertNotDuplicateOrder`):**
   - Băm (fingerprint) SĐT + Địa chỉ + Danh sách sản phẩm, chặn tạo đơn y hệt trong vòng 5 phút ở Client và PostgreSQL RPC (`create_secure_order`).
8. **Chống XSS (`containsXssPayload`, `sanitizeText`, `sanitizeObject`):**
   - Tự động phát hiện và loại bỏ các thẻ độc hại (`<script>`, `<iframe>`, `javascript:`, `onerror=`, `onload=`, ...) ở cả tầng Client và tầng Database RPC.
9. **Chống Bot & Honeypot (`assertHumanNotBot`):**
   - Trường bẫy bot ẩn (`honeypot`) trong form Checkout. Nếu bot tự động điền, request bị từ chối ngay lập tức.
10. **HTTP Security Headers (`vercel.json`):**
    - Cấu hình `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`.

---

## 7. Hướng Dẫn Nhanh Khi Muốn Mở Rộng Tính Năng Sau Này

| Khi bạn muốn... | Chỉ cần mở các file sau |
| :--- | :--- |
| **Thêm trường thông tin mới cho Sản phẩm** | 1. `src/types/product.ts`<br>2. `src/pages/Admin/Products.tsx` (Form Admin)<br>3. `src/pages/ProductDetail/index.tsx` (Hiển thị cho khách) |
| **Thêm tùy chọn Cá nhân hóa 3D mới (màu sắc, phụ kiện, kiểu chữ)** | 1. `src/components/products/CustomizationForm.tsx`<br>2. `src/types/cart.ts` (`CartItemCustomization`) |
| **Thêm trạng thái đơn hàng hoặc sửa tên trạng thái Tiếng Việt** | 1. `src/types/order.ts`<br>2. `src/utils/statusLabels.ts` |
| **Sửa giao diện / nội dung Email tự động gửi cho Khách hoặc Admin** | 1. `src/services/emailService.ts`<br>2. `src/pages/Admin/Settings.tsx` |
| **Thêm quyền Admin cho một địa chỉ Email mới** | 1. `src/features/auth/authSlice.ts` (`ALLOWED_ADMIN_EMAILS`)<br>2. `src/services/authService.ts`<br>3. Cập nhật `role = 'admin'` trong bảng `public.profiles` trên Supabase |
| **Điều chỉnh giới hạn chống Spam / Rate Limit** | 1. `src/utils/securityGuard.ts` |

---

## 8. Các Lệnh Chạy & Kiểm Thử Dự Án

```bash
# Chạy máy chủ phát triển (Development Server tại http://localhost:5173)
npm run dev

# Chạy toàn bộ Unit Tests (Vitest - 17 tests bảo mật, giỏ hàng, thanh toán)
npm test -- --run

# Biên dịch kiểm tra TypeScript & đóng gói Production (ra thư mục dist/)
npm run build
```

