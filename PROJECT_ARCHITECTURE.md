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
   - Chỉ tài khoản chủ sở hữu nằm trong danh sách `ALLOWED_ADMIN_EMAILS = ['conghaunguyen994@gmail.com.vn', 'conghaunguyen994@gmail.com']` **VÀ** có `role = 'admin'` trong bảng `public.profiles` trên Supabase mới truy cập được `/admin/*`.
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
├── supabase/                                # Toàn bộ SQL Schema, RLS, Trigger & RPC trên Supabase
│   ├── FIX_AUTH_AND_SEED_DB.sql             # [QUAN TRỌNG NHẤT] Script tổng hợp chạy 1 lần: sửa lỗi Auth, tạo bảng, RLS, RPC & nạp dữ liệu gốc
│   ├── seed.sql                             # Dữ liệu sản phẩm & cài đặt mẫu ban đầu
│   └── migrations/
│       ├── 20261111000000_init_schema.sql   # Khởi tạo bảng products, profiles, orders, order_items, shop_settings
│       └── 20261111000001_security_and_rls.sql # Chính sách RLS & RPC bảo mật
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
    │   ├── cart.ts                          # `CartItem`, `CartItemCustomization` (màu thân, màu đế, tên bé, icon, ghi chú)
    │   ├── order.ts                         # `Order`, `OrderItem`, `OrderStatus`, `PaymentStatus`, `Demo3DPreview`, `CreateOrderPayload`
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
    │   ├── authService.ts                   # Đăng ký, Đăng nhập, Đăng xuất, kiểm tra quyền Admin từ `public.profiles`
    │   ├── productService.ts                # CRUD sản phẩm (`products`) từ Supabase DB
    │   ├── orderService.ts                  # Tạo đơn (`create_secure_order`), tra cứu đơn (`lookup_order_details`), duyệt cọc, gửi/duyệt Demo 3D
    │   ├── settingsService.ts               # Đọc/lưu cài đặt cửa hàng (`shop_settings`) trên Supabase DB
    │   └── emailService.ts                  # Gửi Email tự động 2 chiều (Khách hàng ⇄ Admin) qua Webhook / EmailJS / FormSubmit / Gmail
    │
    ├── schemas/                             # Validation Schemas (Zod)
    │   ├── checkoutSchema.ts                # Kiểm tra form Thanh toán (Tên, SĐT VN, Email, Địa chỉ, Honeypot, Chống XSS)
    │   └── customizationSchema.ts           # Kiểm tra form Cá nhân hóa 3D (tên thú cưng, ký tự hợp lệ, độ dài)
    │
    ├── utils/                               # Các hàm tiện ích dùng chung
    │   ├── securityGuard.ts                 # Chống Spam click, Rate Limit, Chống trùng đơn, Sanitize XSS, CSRF token, Honeypot
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
    │   ├── products/                        # `ProductCard.tsx`, `CustomizationForm.tsx` (Chọn màu thân/đế/icon & xem mô phỏng 3D trực tiếp)
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
    │       ├── Products.tsx                 # Thêm / Sửa / Xóa / Bật tắt tồn kho sản phẩm in 3D
    │       └── Settings.tsx                 # Cấu hình Ngân hàng VietQR, Tỷ lệ cọc, Thông tin shop & Email tự động 2 chiều
    │
    └── tests/                               # Bộ kiểm thử tự động (Vitest)
        ├── cartSlice.test.ts                # Test logic giỏ hàng & tính tiền
        ├── checkoutValidation.test.ts       # Test Zod schema & tính tiền cọc
        └── securityOrder.test.ts            # Test chống XSS, Rate Limit, Action Lock, Duplicate Order
```

---

## 4. Chi Tiết Cơ Sở Dữ Liệu Supabase (Tables, RLS & RPC Functions)

Toàn bộ cấu trúc DB nằm tại [`supabase/FIX_AUTH_AND_SEED_DB.sql`](file:///c:/Users/nconghau/Desktop/new%20fe/BolwDog/supabase/FIX_AUTH_AND_SEED_DB.sql).

### 4.1. Các Bảng Dữ Liệu (`public.*`)
1. **`public.profiles`**:
   - Cột: `id` (UUID, FK `auth.users`), `email`, `full_name`, `phone`, `role` (`'customer'` | `'admin'`), `created_at`, `updated_at`.
   - Trigger `on_auth_user_created` (`public.handle_new_user`): Tự động tạo dòng trong `profiles` khi người dùng đăng ký. Nếu email thuộc chủ shop (`conghaunguyen994@gmail.com.vn` / `conghaunguyen994@gmail.com`) thì tự động gán `role = 'admin'`.
2. **`public.products`**:
   - Cột: `id` (UUID), `name`, `slug` (UNIQUE), `category` (`'bowls'` | `'accessories'` | `'tags'` | `'sanitation'`), `short_description`, `description`, `price` (NUMERIC), `original_price`, `images` (TEXT[]), `video_url`, `rating`, `review_count`, `in_stock` (BOOLEAN), `stock_quantity` (INT), `featured` (BOOLEAN), `is_customizable` (BOOLEAN), `customization_config` (JSONB), `size_options` (JSONB), `specifications` (JSONB), `tags` (TEXT[]).
3. **`public.orders`**:
   - Cột: `id` (UUID), `order_reference` (TEXT UNIQUE, VD: `BD-20261112-94A21`), `user_id` (UUID nullable), `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `notes`, `subtotal`, `shipping_fee`, `total_amount`, `deposit_required` (BOOLEAN), `deposit_amount`, `remaining_amount`, `payment_method` (`'bank_transfer_qr'` | `'cod'`), `payment_status` (`'unpaid'` | `'deposit_pending'` | `'partially_paid'` | `'paid'` | `'refunded'`), `order_status` (`'pending'` | `'confirmed'` | `'processing'` | `'shipping'` | `'completed'` | `'cancelled'`), `payment_proof_url`, `created_at`, `updated_at`.
4. **`public.order_items`**:
   - Cột: `id` (UUID), `order_id` (UUID FK `orders`), `product_id` (UUID FK `products`), `product_name`, `product_image`, `size_label`, `quantity`, `unit_price`, `total_price`, `customization_data` (JSONB).
   - **Lưu ý quan trọng về `customization_data` (JSONB):**
     - Ngoài việc lưu thông tin cá nhân hóa của khách (`petName`, `customText`, `selectedColor` [màu thân], `baseColor` [màu đế], `fontStyle`, `selectedIcons`, `weightEstimate`, `designNotes`), trường này ở `items[0]` còn lưu object **`demoPreview`** (`Demo3DPreview`) chứa ảnh bản dựng 3D và trạng thái khách duyệt/yêu cầu sửa! Nhờ vậy không cần thay đổi schema bảng khi nâng cấp tính năng duyệt file 3D.
5. **`public.shop_settings`**:
   - Cột: `id` (INT PK = `1`), `settings_data` (JSONB), `updated_at`.
   - Lưu cấu hình tài khoản ngân hàng VietQR, cấu hình đặt cọc, thông tin hotline/địa chỉ shop và cấu hình thông báo Email 2 chiều (`email_notifications`).

### 4.2. Các Hàm RPC Bảo Mật (`SECURITY DEFINER`)
Để khách vãng lai (Guest) có thể đặt hàng và tra cứu đơn mà không cần mở quyền `SELECT/UPDATE` công khai trên bảng `orders`:
1. **`public.is_admin()`**:
   - Kiểm tra JWT của user đang đăng nhập có `role = 'admin'` trong `public.profiles` hay không.
2. **`public.create_secure_order(...)`**:
   - Nhận thông tin khách hàng và mảng JSON `p_items`.
   - **Tự động đọc giá sản phẩm thực tế từ bảng `public.products` trên Server** để tính `subtotal`, `deposit_amount`, `total_amount` (chống hacker sửa giá ở client).
   - Chặn đặt trùng đơn liên tiếp trong 20 giây cho cùng SĐT + cùng tổng tiền.
   - Tạo mã đơn `BD-YYYYMMDD-XXXXX` và lưu vào `orders` + `order_items`.
3. **`public.lookup_order_details(p_order_reference TEXT, p_customer_phone TEXT)`**:
   - Cho phép tra cứu linh hoạt **chỉ cần 1 trong 2** (Mã đơn hàng **HOẶC** Số điện thoại). Nếu nhập cả 2 thì khớp cả 2. Trả về danh sách đơn hàng kèm mảng `items`.

---

## 5. Luồng Nghiệp Vụ Chính (Core Business Workflows)

### 5.1. Luồng Cá Nhân Hóa Màu Sắc & Khắc Tên 3D (`CustomizationForm.tsx`)
- Khi khách vào trang Chi tiết sản phẩm (`/products/:slug`), nếu sản phẩm có `is_customizable = true`:
  - Khách chọn **Màu thân bát** (`selectedColor` - 9 màu пластик PLA+ sinh học) và **Màu chân đế chống kiến** (`baseColor`).
  - Khách nhập **Tên thú cưng** (`petName`), chọn **Kiểu chữ 3D** (`fontStyle`), chọn tối đa **2 Icon nổi 3D** (`selectedIcons`).
  - **Mô phỏng trực tiếp (Live 2D/3D Preview):** Hình vẽ mô phỏng chiếc bát đổi màu thân, màu chân đế, hiển thị tên bé theo đúng màu chân đế và hiển thị 2 icon hai bên theo thời gian thực.

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

## 6. Hệ Thống Bảo Mật Đa Tầng (`src/utils/securityGuard.ts` & `vercel.json`)

1. **Chống Spam Click / Double Submit (`withActionLock`):**
   - Khóa bất đồng bộ theo `actionKey` (VD: `checkout_submit`, `add_to_cart`, `demo_review_...`), chặn hoàn toàn việc bấm liên tục nhiều lần khi request trước chưa xong + thời gian hồi (cooldown).
2. **Sliding-Window Rate Limiter (`enforceRateLimit`):**
   - Giới hạn tần suất theo cửa sổ trượt lưu kết hợp bộ nhớ & `sessionStorage`:
     - Đặt hàng: tối đa 3 lần / 60 giây.
     - Tra cứu đơn hàng: tối đa 10 lần / 60 giây.
     - Gửi phản hồi duyệt mẫu 3D: tối đa 5 lần / 60 giây.
3. **Chống Đặt Trùng Đơn Hàng (`assertNotDuplicateOrder`):**
   - Băm (fingerprint) SĐT + Địa chỉ + Danh sách sản phẩm + Tổng tiền, chặn tạo đơn y hệt trong vòng 30 giây ở cả Client và PostgreSQL RPC (`create_secure_order`).
4. **Chống XSS (`containsXssPayload`, `sanitizeText`, `sanitizeObject`):**
   - Tự động phát hiện và loại bỏ các thẻ độc hại (`<script>`, `<iframe>`, `javascript:`, `onerror=`, `onload=`, ...) trong mọi dữ liệu đầu vào trước khi gửi lên Supabase.
5. **Chống Bot & CSRF (`assertHumanNotBot`, `assertCsrfAndSameOrigin`):**
   - Trường bẫy bot ẩn (Honeypot `websiteUrl`) trong form Checkout + kiểm tra thời gian điền form tối thiểu + kiểm tra Origin/CSRF token mỗi phiên.
6. **HTTP Security Headers (`vercel.json`):**
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

