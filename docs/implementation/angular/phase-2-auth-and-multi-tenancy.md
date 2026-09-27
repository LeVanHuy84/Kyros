# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 2: XÁC THỰC & ĐA NGƯỜI DÙNG (AUTHENTICATION & MULTI-TENANCY)

> **Tài liệu:** `docs/implementation/angular/phase-2-auth-and-multi-tenancy.md`  
> **Mục tiêu:** Xây dựng toàn diện luồng đăng ký, đăng nhập, xác thực kích hoạt tài khoản qua liên kết Email Token (kèm form Fallback gửi lại link), quản lý phiên làm việc JWT và cơ chế chuyển đổi Workspace (Tenant Isolation AD-002).  
> **Ước lượng thời gian:** 1 - 2 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-2.1** | Auth State & Token Management | `src/app/core/auth/services/auth.service.ts` | `POST /api/auth/login`<br/>`POST /api/auth/refresh`<br/>`POST /api/auth/logout` |
| **TASK-2.2** | Giao diện Đăng nhập & Đăng ký | `src/app/features/auth/pages/login/*`<br/>`src/app/features/auth/pages/register/*` | `POST /api/auth/register`<br/>`POST /api/auth/login` |
| **TASK-2.3** | Màn hình Xác thực Link Email & Fallback Resend | `src/app/features/auth/pages/verify/*` | `POST /api/auth/verify`<br/>`POST /api/auth/resend-verification` |
| **TASK-2.4** | Quản lý Workspace & Tenant Selector | `src/app/core/workspace/*`<br/>`src/app/shared/components/tenant-selector/*` | `GET /api/workspaces`<br/>`POST /api/workspaces`<br/>`GET /api/workspaces/primary`<br/>`POST /api/workspaces/primary/{id}` |
| **TASK-2.5** | Route Guards & Security Checks | `src/app/core/guards/auth.guard.ts`<br/>`src/app/core/guards/workspace.guard.ts` | Client Routing Protection |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 2.1: Quản lý Trạng thái Xác thực (Auth Service & Signal Store)
- **Vị trí tệp:**
  - `src/app/core/auth/services/auth.service.ts`
  - `src/app/core/auth/models/auth.models.ts`
- **Các bước thực hiện:**
  1. Định nghĩa Data Models:
     ```typescript
     export interface User {
       id: string;
       email: string;
       fullName: string;
       avatarUrl?: string;
       roles: string[];
     }

     export interface AuthTokens {
       accessToken: string;
       refreshToken: string;
       expiresIn: number;
     }

     export interface AuthResponse {
       user: User;
       tokens: AuthTokens;
       primaryWorkspaceId?: string;
     }
     ```
  2. Xây dựng `AuthService` với Angular Signals:
     - `currentUser = signal<User | null>(null)`
     - `isAuthenticated = computed(() => !!this.currentUser())`
     - Lưu trữ Access Token trong bộ nhớ và Refresh Token an toàn (HttpOnly Cookie hoặc Storage được bảo vệ).
     - Triển khai cơ chế Silent Refresh trước khi Access Token hết hạn.
- **Tiêu chí nghiệm thu:**
  - `AuthService` phản ứng lập tức với việc thay đổi trạng thái người dùng trên toàn bộ ứng dụng mà không cần reload trang.

---

### Task 2.2: Giao diện Đăng nhập & Đăng ký (Conversational & Natural UX)
- **Vị trí tệp:**
  - `src/app/features/auth/pages/login/login.component.ts`
  - `src/app/features/auth/pages/register/register.component.ts`
- **Các bước thực hiện:**
  1. Thiết kế Form với Reactive Forms (`NonNullableFormBuilder`) có validate trực tiếp (Email định dạng chuẩn, mật khẩu tối thiểu 8 ký tự kèm chữ hoa, số và ký tự đặc biệt).
  2. Hiệu ứng Micro-interaction:
     - Nút đăng nhập chuyển sang trạng thái spinner mượt khi đang xử lý.
     - Hiển thị lỗi inline nhẹ nhàng dưới từng ô input thay vì popup báo lỗi giật cục.
  3. Gợi ý chuyển đổi nhanh giữa Đăng nhập $\leftrightarrow$ Đăng ký với animation trượt nhẹ.
- **Tiêu chí nghiệm thu:**
  - Đăng nhập thành công sẽ lưu thông tin user, nạp Workspace mặc định và chuyển hướng mượt vào `/agent`.

---

### Task 2.3: Màn hình Xác thực Link Email & Fallback Gửi Lại Link (Verify Component)
- **Vị trí tệp:**
  - `src/app/features/auth/pages/verify/verify.component.ts`
  - `src/app/features/auth/pages/verify/verify.component.html`
  - `src/app/features/auth/pages/verify/verify.component.scss`
- **Các bước thực hiện:**
  1. Trích xuất Token từ URL query parameter:
     - Đọc `token` từ `ActivatedRoute.queryParamMap` (route `/auth/verify?token=...` hoặc `/verify?token=...`).
     - Nếu không tìm thấy `token`, chuyển ngay state sang `'error'` với thông báo yêu cầu mã token hợp lệ.
  2. Gọi Backend API kích hoạt tài khoản:
     - Gửi request `POST /api/auth/verify` với body `{ token }`.
     - Áp dụng in-flight guard / request deduplication để tránh trigger trùng lặp request khi component khởi tạo.
  3. Quản lý 3 trạng thái giao diện trực quan (Signals Reactive State):
     - **`loading` (Đang xử lý):** Hiển thị spinner chuyển động cùng thông điệp *"Đang xác thực liên kết đăng ký với Kyros..."* (`auth.verify.verifying`).
     - **`success` (Thành công):** Icon tròn xanh lá `<app-icon name="mail-check">`, tiêu đề *"Email Đã Được Xác Thực!"* (`auth.verify.success_title`), nội dung hướng dẫn và nút *"Vào trang chủ / Đăng nhập"* (`auth.verify.go_home`).
     - **`error` (Thất bại / Hết hạn):** Icon tròn đỏ `<app-icon name="x-circle">`, tiêu đề *"Xác thực không thành công"* (`auth.verify.failed_title`), hiển thị chi tiết lỗi RFC 7807 từ backend (`detail`).
  4. Form Fallback gửi lại liên kết xác thực (Resend Verification Link):
     - Hiển thị form nhập email ngay dưới thông báo lỗi: *"Cần một liên kết xác thực mới?"* (`auth.verify.need_new_link`).
     - Gửi request `POST /api/auth/resend-verification` với body `{ email }`.
     - Hiển thị trạng thái loading spinner trên nút Resend và thông báo màu xanh khi link mới đã được gửi thành công (`auth.verify.resend_success`).
- **Tiêu chí nghiệm thu:**
  - Tự động kích hoạt tài khoản mượt mà khi người dùng nhấp link trong email.
  - Xử lý đầy đủ, thân thiện các trường hợp token hết hạn, sai token hoặc gửi lại email xác thực.
  - Tuân thủ 100% OnPush, Standalone, tách file `.ts`/`.html`/`.scss`, dùng icon chuẩn từ `<app-icon>` và cấu hình song ngữ đầy đủ trong `vi.json` / `en.json`.

---

### Task 2.4: Quản lý Workspace & Bộ Chuyển đổi Không Gian Làm Việc (Tenant Selector)
- **Vị trí tệp:**
  - `src/app/core/workspace/services/workspace.service.ts`
  - `src/app/core/workspace/models/workspace.models.ts`
  - `src/app/shared/components/tenant-selector/tenant-selector.component.ts`
  - `src/app/shared/components/tenant-selector/create-workspace-modal.component.ts`
- **Các bước thực hiện:**
  1. Tạo `WorkspaceService` quản lý danh sách Workspace và Signal `activeWorkspaceId`:
     - Khi người dùng chọn workspace mới, cập nhật `activeWorkspaceId` và lưu vào `localStorage`.
     - Tự động nạp lại dữ liệu của các màn hình đang mở (Chat, Tasks, Calendar) theo ngữ cảnh workspace mới.
  2. Thiết kế `TenantSelectorComponent` đặt trên TopNav:
     - Hiển thị Icon và Tên Workspace hiện tại.
     - Dropdown danh sách các Workspace kèm badge chỉ định "Primary Workspace".
     - Nút "+ Tạo Workspace mới" mở `CreateWorkspaceModalComponent`.
- **Tiêu chí nghiệm thu:**
  - Khi chuyển Workspace, toàn bộ các HTTP request kế tiếp lập tức mang `X-Workspace-Id` của workspace mới mà không bị xung đột cache.

---

### Task 2.5: Thiết lập Route Guards
- **Vị trí tệp:**
  - `src/app/core/guards/auth.guard.ts`
  - `src/app/core/guards/workspace.guard.ts`
  - `src/app/core/guards/guest.guard.ts`
- **Các bước thực hiện:**
  1. `authGuard`: Chặn người dùng chưa đăng nhập truy cập các route nội bộ (chuyển hướng về `/auth/login` kèm query parameter `returnUrl`).
  2. `guestGuard`: Chặn người dùng đã đăng nhập vào lại các trang `/auth/login`, `/auth/register`.
  3. `workspaceGuard`: Đảm bảo luôn có ít nhất 1 Workspace được kích hoạt trước khi vào các trang chức năng.
- **Tiêu chí nghiệm thu:**
  - Hệ thống route được bảo vệ chặt chẽ, không bị hở route bảo mật hoặc lọt màn hình trắng khi chưa chọn workspace.
