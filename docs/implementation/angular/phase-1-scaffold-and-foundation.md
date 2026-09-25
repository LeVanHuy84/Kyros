# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 1: KHỞI TẠO DỰ ÁN & NỀN TẢNG CỐT LÕI (SCAFFOLD & CORE FOUNDATION)

> **Tài liệu:** `docs/implementation/angular/phase-1-scaffold-and-foundation.md`  
> **Mục tiêu:** Khởi tạo workspace Angular 18/19 Standalone, thiết lập hệ thống Design Tokens tự nhiên (Natural UI / Organic Warm Theme), cấu hình HTTP Interceptors (`X-Workspace-Id`, Auth Bearer), SSE stream adapter, layout shell và thư viện UI Kit dùng chung.  
> **Ước lượng thời gian:** 1 - 2 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| **TASK-1.1** | Khởi tạo Angular Workspace | `frontend-angular/` | Khởi tạo dự án Angular Standalone với SCSS, Vite-based builder, strict TypeScript và path aliases. |
| **TASK-1.2** | Design Tokens & Natural Theme | `src/styles/*` | Thiết lập bảng màu hữu cơ (Organic Warm Palette), hiệu ứng Frosted Glass (mờ kính), Typography, animations và theme dark/light. |
| **TASK-1.3** | Core Interceptors & Client Services | `src/app/core/*` | Xây dựng `auth.interceptor.ts`, `workspace.interceptor.ts`, `error.interceptor.ts`, `api.service.ts` và `sse.service.ts`. |
| **TASK-1.4** | App Shell & Navigation Layout | `src/app/core/layout/*` | Layout tổng thể: TopNav đa năng, Sidebar thu gọn mượt mà, Breadcrumbs, khu vực gắn Tenant Selector và Command Palette (`Ctrl+K`). |
| **TASK-1.5** | Bộ Shared UI Kit & Utilities | `src/app/shared/*` | Components dùng chung: Avatar, Button, Modal, Card, Skeleton shimmer, Markdown Viewer an toàn và Toast notifications. |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 1.1: Khởi tạo Angular Workspace & Cấu hình Build
- **Vị trí tệp:**
  - `frontend-angular/angular.json`
  - `frontend-angular/tsconfig.json`
  - `frontend-angular/package.json`
- **Các bước thực hiện:**
  1. Khởi tạo dự án bằng Angular CLI:
     ```bash
     npx @angular/cli new frontend-angular --routing --style=scss --ssr=false --skip-git
     ```
  2. Cấu hình `tsconfig.json` với Strict Type Checking và Path Aliases:
     ```json
     {
       "compilerOptions": {
         "strict": true,
         "noImplicitOverride": true,
         "noPropertyAccessFromIndexSignature": true,
         "noImplicitReturns": true,
         "noFallthroughCasesInSwitch": true,
         "paths": {
           "@core/*": ["src/app/core/*"],
           "@shared/*": ["src/app/shared/*"],
           "@features/*": ["src/app/features/*"],
           "@env/*": ["src/environments/*"]
         }
       }
     }
     ```
  3. Cài đặt các thư viện bổ trợ giao diện tự nhiên: `lucide-angular` (icon tối giản), `marked` & `dompurify` (render markdown an toàn), `date-fns`.
- **Tiêu chí nghiệm thu:**
  - Lệnh `npm start` khởi động dev server mượt mà tại `http://localhost:4200`.
  - TypeScript build không có bất kỳ warning/error nào.

---

### Task 1.2: Xây dựng Design Tokens & Hệ thống Theme Tự Nhiên (Natural UI)
- **Vị trí tệp:**
  - `src/styles/_variables.scss`
  - `src/styles/_mixins.scss`
  - `src/styles/_animations.scss`
  - `src/styles/styles.scss`
- **Các bước thực hiện:**
  1. Định nghĩa CSS Variables cho màu sắc ấm cúng, tự nhiên (ấm, dịu mắt, không tạo cảm giác máy móc):
     ```scss
     :root {
       --bg-canvas: #fbfbf9;
       --bg-surface: #ffffff;
       --bg-surface-glass: rgba(255, 255, 255, 0.75);
       --text-primary: #1e2022;
       --text-secondary: #636b74;
       --accent-primary: #2d6a4f; /* Xanh lá thẫm tự nhiên */
       --accent-warm: #d4a373;    /* Nâu be ấm */
       --border-subtle: #eae8e1;
       --shadow-soft: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
       --radius-natural: 14px;
     }

     [data-theme="dark"] {
       --bg-canvas: #121314;
       --bg-surface: #1a1c1e;
       --bg-surface-glass: rgba(26, 28, 30, 0.75);
       --text-primary: #e3e5e8;
       --text-secondary: #9ea4ac;
       --border-subtle: #2b2e33;
     }
     ```
  2. Tạo mixin `glassmorphism` với `backdrop-filter: blur(12px)`.
  3. Xây dựng animation cho tin nhắn xuất hiện, typing pulse và chuyển cảnh mượt (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Tiêu chí nghiệm thu:**
  - Giao diện có khả năng chuyển đổi tức thì Dark/Light theme qua Signal State mà không reload trang.

---

### Task 1.3: Core Interceptors & Networking Adapters
- **Vị trí tệp:**
  - `src/app/core/interceptors/auth.interceptor.ts`
  - `src/app/core/interceptors/workspace.interceptor.ts`
  - `src/app/core/interceptors/error.interceptor.ts`
  - `src/app/core/services/sse.service.ts`
  - `src/app/core/services/api.service.ts`
- **Các bước thực hiện:**
  1. `workspace.interceptor.ts`: Đọc Signal `activeWorkspaceId` từ `WorkspaceStateService` và tự động gắn header `X-Workspace-Id: <id>`.
  2. `auth.interceptor.ts`: Tự động gắn Bearer Token và xử lý refresh token khi nhận status `401 Unauthorized`.
  3. `sse.service.ts`: Xây dựng generic EventSource / Fetch-based SSE adapter hỗ trợ tự động reconnect, phân rã chunk stream và bắt lỗi kết nối.
- **Tiêu chí nghiệm thu:**
  - Mọi request HTTP từ Angular đều mang đầy đủ `X-Workspace-Id` và Bearer Token theo chuẩn bảo mật đa người dùng (Multi-tenancy AD-002).

---

### Task 1.4: App Shell & Responsive Layout
- **Vị trí tệp:**
  - `src/app/core/layout/app-layout.component.ts`
  - `src/app/core/layout/sidebar.component.ts`
  - `src/app/core/layout/top-nav.component.ts`
- **Các bước thực hiện:**
  1. Tạo `AppLayoutComponent` quản lý layout khung tổng thể với `router-outlet`.
  2. Tạo `SidebarComponent` hỗ trợ thu nhỏ dạng icon bar hoặc mở rộng full menu, lưu trạng thái thu gọn vào LocalStorage.
  3. Tạo `TopNavComponent` chứa breadcrumbs, nút chuyển đổi theme, trigger danh sách thông báo và khu vực Tenant Switcher.
- **Tiêu chí nghiệm thu:**
  - Layout hiển thị đáp ứng mượt mà trên cả Desktop, Tablet và Mobile.

---

### Task 1.5: Reusable UI Kit (Shared Components)
- **Vị trí tệp:**
  - `src/app/shared/components/button/button.component.ts`
  - `src/app/shared/components/modal/modal.component.ts`
  - `src/app/shared/components/toast/toast-container.component.ts`
  - `src/app/shared/components/skeleton/skeleton-loader.component.ts`
  - `src/app/shared/components/markdown/markdown-viewer.component.ts`
- **Các bước thực hiện:**
  1. Tất cả Shared Components phải là **Standalone** và cấu hình `ChangeDetectionStrategy.OnPush`.
  2. `MarkdownViewerComponent`: Sử dụng `marked` kết hợp `DOMPurify` để render markdown bảo mật, định dạng code block có nút Copy Code một chạm.
  3. `ToastService`: Quản lý danh sách toast thông báo nổi (Success, Info, Warning, Error) với Angular Signals.
- **Tiêu chí nghiệm thu:**
  - Bộ component đạt chuẩn Null-Safety, không có memory leak, hoạt động độc lập và tái sử dụng dễ dàng.
