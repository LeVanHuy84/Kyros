# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 6: KHO TRI THỨC, THÔNG BÁO THỜI GIAN THỰC & HOÀN THIỆN HỆ THỐNG (KNOWLEDGE VAULT, NOTIFICATIONS & SYSTEM POLISH)

> **Tài liệu:** `docs/implementation/angular/phase-6-memory-notes-and-notifications.md`  
> **Mục tiêu:** Xây dựng trình soạn thảo ghi chú Markdown chuyên sâu, Kho lưu trữ ký ức dài hạn của AI (Memory Vault), Trung tâm thông báo đẩy thời gian thực qua SSE, Cá nhân hóa người dùng và Tối ưu hóa hiệu năng tổng thể ứng dụng.  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-6.1** | Trình Soạn Thảo Ghi Chú Markdown | `src/app/features/notes/pages/*`<br/>`src/app/features/notes/components/*` | `GET / POST / PUT / DELETE .../notes` |
| **TASK-6.2** | Kho Ký Ức Dài Hạn (Memory Vault) | `src/app/features/memory/components/memory-vault/*` | `GET / POST / PUT / DELETE .../memory-entries` |
| **TASK-6.3** | Nhật Ký Lượt Hội Thoại (Turns Audit) | `src/app/features/memory/components/turns-modal/*` | `GET .../conversations`<br/>`GET .../turns`<br/>`POST .../clear` |
| **TASK-6.4** | Trung Tâm Thông Báo Đẩy SSE | `src/app/features/notifications/components/*` | `GET .../notifications`<br/>`GET .../notifications/stream`<br/>`POST .../notifications/{id}/read` |
| **TASK-6.5** | Cài Đặt Hồ Sơ & Sở Thích Cá Nhân | `src/app/features/settings/pages/*`<br/>`src/app/features/settings/components/*` | `GET / PUT .../notification-profile`<br/>`GET / PUT .../preferences` |
| **TASK-6.6** | Tối Ưu Hiệu Năng & Kiểm Thử Toàn Diện | Toàn bộ dự án Angular | Code splitting, OnPush audit, Build optimization |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 6.1: Trình Soạn Thảo Ghi Chú Markdown Chia Cột (Split-Pane Notes Editor)
- **Vị trí tệp:**
  - `src/app/features/notes/pages/notes-management.component.ts`
  - `src/app/features/notes/components/note-list-panel/note-list-panel.component.ts`
  - `src/app/features/notes/components/note-form-editor/note-form-editor.component.ts`
  - `src/app/features/notes/components/note-detail-view/note-detail-view.component.ts`
- **Các bước thực hiện:**
  1. Giao diện 2 cột tinh tế:
     - **Cột trái:** Danh sách ghi chú có tìm kiếm nhanh, gắn dấu sao (Pinned notes), phân loại theo danh mục.
     - **Cột phải:** Trình soạn thảo hoặc chế độ xem chi tiết.
  2. Tính năng soạn thảo: Hỗ trợ cú pháp Markdown tiêu chuẩn, phím tắt in đậm (`Ctrl+B`), in nghiêng (`Ctrl+I`), chèn bảng và chèn code.
  3. Tự động lưu bản nháp (Auto-save debounce 500ms) để không bị mất nội dung khi đang viết.
- **Tiêu chí nghiệm thu:**
  - Soạn thảo và render Markdown tức thì với hiệu ứng cuộn đồng bộ mượt mà.

---

### Task 6.2: Kho Ký Ức Dài Hạn Của Trợ Lý (Memory Vault)
- **Vị trí tệp:**
  - `src/app/features/memory/components/memory-vault/memory-vault-panel.component.ts`
  - `src/app/features/memory/services/memory.service.ts`
- **Các bước thực hiện:**
  1. Hiển thị danh sách các mảnh thông tin (Semantic & Episodic Memory) mà Trợ lý AI đã ghi nhớ tự động trong quá trình trò chuyện (sở thích ăn uống, thói quen làm việc, danh sách dự án quan trọng).
  2. Cho phép người dùng:
     - Thêm thủ công một ký ức mới cho AI.
     - Chỉnh sửa nội dung ký ức bị ghi nhớ sai lệch.
     - Xóa vĩnh viễn ký ức mà người dùng không muốn AI lưu trữ.
- **Tiêu chí nghiệm thu:**
  - Người dùng có toàn quyền kiểm soát dữ liệu ký ức (Data Privacy & Transparency).

---

### Task 6.3: Kiểm Toán Lượt Hội Thoại Của Agent (Conversations & Turns Audit)
- **Vị trí tệp:**
  - `src/app/features/memory/components/conversations-directory/conversations-directory-panel.component.ts`
  - `src/app/features/memory/components/turns-modal/turns-modal.component.ts`
- **Các bước thực hiện:**
  1. Liệt kê các phiên hội thoại trong quá khứ (`GET .../conversations`).
  2. Mở `TurnsModalComponent` để xem chi tiết từng lượt hội thoại (Turn):
     - Prompt gốc của User.
     - Trạng thái suy nghĩ nội tâm của Agent (Chain-of-thought).
     - Danh sách Tool đã gọi kèm thời gian thực thi và phản hồi của hệ thống.
  3. Nút **"Xóa sạch lịch sử phiên"** (`POST .../clear`).
- **Tiêu chí nghiệm thu:**
  - Giúp lập trình viên và người dùng dễ dàng kiểm tra, debug luồng suy luận của AI Assistant.

---

### Task 6.4: Trung Tâm Thông Báo Đẩy Thời Gian Thực (Real-time SSE Notification Center)
- **Vị trí tệp:**
  - `src/app/features/notifications/components/notifications-dropdown/notifications-dropdown.component.ts`
  - `src/app/features/notifications/services/notifications.service.ts`
- **Các bước thực hiện:**
  1. Kết nối với kênh `GET .../notifications/stream` qua SSE:
     - Nhận sự kiện thời gian thực khi có Task mới được giao, sự kiện lịch sắp diễn ra hoặc Agent cần phê duyệt.
     - Badge đỏ trên TopNav nhảy số lượng thông báo chưa đọc.
  2. Menu Dropdown thông báo:
     - Phân loại theo tab: *Tất cả*, *Công việc*, *Lịch biểu*, *Hệ thống*.
     - Đánh dấu đã đọc từng thông báo hoặc nút **"Đọc tất cả"** (`POST .../read-all`).
     - Bỏ qua / Xóa thông báo (`POST .../dismiss`).
- **Tiêu chí nghiệm thu:**
  - Thông báo xuất hiện tức thì trong vòng 100ms kể từ khi backend phát sinh sự kiện.

---

### Task 6.5: Cài Đặt Hồ Sơ Thông Báo & Tùy Biến Trợ Lý (Preferences & Profiles)
- **Vị trí tệp:**
  - `src/app/features/settings/pages/settings.component.ts`
  - `src/app/features/settings/components/notification-settings-panel/notification-settings-panel.component.ts`
  - `src/app/features/settings/components/preferences-panel/preferences-panel.component.ts`
- **Các bước thực hiện:**
  1. Cấu hình Hồ sơ Thông báo:
     - Bật/Tắt chế độ Không Làm Phiền (Do Not Disturb - DND).
     - Thiết lập khung giờ yên tĩnh (Quiet Hours: vd 22:00 - 07:00).
     - Bật/Tắt âm thanh thông báo.
  2. Cài đặt Tùy biến Trợ lý (User Preferences):
     - Lựa chọn phong cách trả lời của AI: *Ngắn gọn, súc tích* $\leftrightarrow$ *Chi tiết, phân tích sâu*.
     - Cài đặt Múi giờ mặc định (Timezone) và Giờ làm việc tiêu chuẩn (để phục vụ AI xếp lịch).
- **Tiêu chí nghiệm thu:**
  - Các thay đổi cấu hình được lưu tức thì xuống backend và áp dụng ngay cho toàn bộ các module.

---

### Task 6.6: Tối Ưu Hiệu Năng & Đóng Gói Ứng Dụng (Performance Audit & Final Polish)
- **Vị trí tệp:**
  - `src/app/app.routes.ts`
  - `frontend-angular/angular.json`
- **Các bước thực hiện:**
  1. Cấu hình **Lazy Loading** cho 100% các Route chức năng qua `loadComponent: () => import(...)`.
  2. Kiểm tra lại toàn bộ component đảm bảo kích hoạt `ChangeDetectionStrategy.OnPush` và sử dụng Angular Signals để loại bỏ tình trạng re-render thừa.
  3. Tối ưu bundle size, bật nén Gzip/Brotli trong cấu hình build production.
- **Tiêu chí nghiệm thu:**
  - Lệnh `npm run build` tạo bundle tối ưu, tốc độ tải trang lần đầu (FCP) dưới 1.2 giây và điểm Lighthouse > 90.
