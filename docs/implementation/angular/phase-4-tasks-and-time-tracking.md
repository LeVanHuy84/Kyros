# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 4: QUẢN LÝ CÔNG VIỆC & THEO DÕI NĂNG SUẤT (SMART TASKS & TIME TRACKING)

> **Tài liệu:** `docs/implementation/angular/phase-4-tasks-and-time-tracking.md`  
> **Mục tiêu:** Xây dựng trung tâm quản lý công việc thông minh (Todo / Kanban Board), bộ đếm thời gian tập trung Pomodoro, cơ chế lặp lại định kỳ (Recurrence Engine), thùng rác khôi phục trong 2 giờ (Soft Delete AD-003) và biểu đồ năng suất làm việc.  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-4.1** | Task State Service & Store | `src/app/features/tasks/services/tasks.service.ts` | `GET / POST / PUT / DELETE .../tasks`<br/>`POST .../tasks/{id}/complete`<br/>`POST .../tasks/{id}/reopen` |
| **TASK-4.2** | Danh sách & Bảng Kanban Tasks | `src/app/features/tasks/components/task-list/*`<br/>`src/app/features/tasks/components/task-board/*`<br/>`src/app/features/tasks/components/task-card/*` | Task View Rendering & Drag-and-drop |
| **TASK-4.3** | Modal Tạo & Sửa Công Việc | `src/app/features/tasks/components/task-form-modal/*` | `POST / PUT .../tasks` |
| **TASK-4.4** | Focus Timer Pomodoro & Thống kê | `src/app/features/tasks/components/focus-timer/*`<br/>`src/app/features/tasks/components/productivity-metrics/*` | `POST .../timer/start`<br/>`POST .../timer/stop`<br/>`GET .../productivity/stats` |
| **TASK-4.5** | Thiết lập Công việc Định kỳ | `src/app/features/tasks/components/recurrence-modal/*` | `GET / PUT .../tasks/{id}/recurrence`<br/>`POST .../recurrence/pause / resume / stop` |
| **TASK-4.6** | Khay Khôi phục Soft Delete (2H) | `src/app/features/tasks/components/trash-recovery-drawer/*` | `GET .../tasks/deleted`<br/>`POST .../tasks/{id}/recover` |
| **TASK-4.7** | Quản lý Nhãn (Tags Management) | `src/app/features/tasks/components/tag-manager/*`<br/>`src/app/features/tasks/components/tag-picker/*` | `GET / POST / PUT / DELETE .../tags` |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 4.1: Quản lý Trạng thái Công việc (Task State Service & Signals)
- **Vị trí tệp:**
  - `src/app/features/tasks/services/tasks.service.ts`
  - `src/app/features/tasks/models/task.models.ts`
- **Các bước thực hiện:**
  1. Định nghĩa Models:
     ```typescript
     export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
     export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

     export interface TaskItem {
       id: string;
       title: string;
       description?: string;
       status: TaskStatus;
       priority: TaskPriority;
       dueDate?: string;
       estimatedMinutes?: number;
       tags: string[];
       hasRecurrence: boolean;
       deletedAt?: string;
       createdAt: string;
       updatedAt: string;
     }
     ```
  2. Tạo `TasksService` với Optimistic Updates: Khi người dùng bấm check hoàn thành task, cập nhật UI ngay lập tức trước khi server phản hồi để đảm bảo cảm giác tức thì (Zero-latency feeling).
- **Tiêu chí nghiệm thu:**
  - Danh sách task tự động lọc theo trạng thái, nhãn (tag), độ ưu tiên và từ khóa tìm kiếm một cách mượt mà.

---

### Task 4.2: Giao diện Danh Sách & Bảng Kanban (Dual View)
- **Vị trí tệp:**
  - `src/app/features/tasks/components/task-list/task-list.component.ts`
  - `src/app/features/tasks/components/task-board/task-board.component.ts`
  - `src/app/features/tasks/components/task-card/task-card.component.ts`
- **Các bước thực hiện:**
  1. Cho phép người dùng chuyển đổi linh hoạt giữa 2 chế độ xem: **List View** (tối ưu quản lý nhanh) và **Kanban Board** (kéo thả các cột trạng thái).
  2. Thiết kế `TaskCardComponent`:
     - Huy hiệu mức độ ưu tiên với màu ấm nhẹ (Đỏ nhạt cho Urgent, Cam cho High, Xanh lam cho Medium, Xám cho Low).
     - Hiển thị ngày đến hạn (Due Date) với cảnh báo đỏ khi quá hạn.
     - Chip nhãn tag có thể nhấn vào để lọc nhanh.
     - Nút Quick Action: Bắt đầu Focus Timer, Sửa, Lặp lại, Xóa vào thùng rác.
- **Tiêu chí nghiệm thu:**
  - Giao diện trực quan, hỗ trợ phím tắt và thao tác mượt mà không bị giật lag.

---

### Task 4.3: Modal Tạo & Chỉnh Sửa Task Toàn Diện
- **Vị trí tệp:**
  - `src/app/features/tasks/components/task-form-modal/task-form-modal.component.ts`
- **Các bước thực hiện:**
  1. Form nhập liệu đầy đủ: Tiêu đề (bắt buộc), mô tả chi tiết, độ ưu tiên, ngày & giờ hết hạn, ước lượng thời gian (phút), gắn nhãn tag.
  2. Tích hợp trực tiếp bộ chọn `TagPickerComponent` để chọn tag sẵn có hoặc gõ để tạo tag mới ngay trong form.
- **Tiêu chí nghiệm thu:**
  - Validate dữ liệu chặt chẽ, hỗ trợ phím `Ctrl + Enter` để lưu nhanh task.

---

### Task 4.4: Bộ Đếm Tập Trung Pomodoro & Thống Kê Năng Suất (Focus Timer)
- **Vị trí tệp:**
  - `src/app/features/tasks/components/focus-timer/focus-timer-modal.component.ts`
  - `src/app/features/tasks/components/productivity-metrics/productivity-metrics.component.ts`
- **Các bước thực hiện:**
  1. Xây dựng `FocusTimerModalComponent`:
     - Đồng hồ đếm ngược vòng tròn 25 phút (hoặc tùy chỉnh) gắn liền với task đang thực thi.
     - Nút **Bắt đầu**, **Tạm dừng**, **Kết thúc phiên** tương ứng với các API `POST .../timer/start` và `stop`.
     - Âm thanh chuông nhẹ nhàng khi hết phiên tập trung.
  2. Xây dựng `ProductivityMetricsComponent`:
     - Biểu đồ thời gian tập trung trong ngày / tuần.
     - Số lượng task hoàn thành và tỷ lệ hoàn thành đúng hạn.
- **Tiêu chí nghiệm thu:**
  - Phiên làm việc được ghi nhận chính xác vào cơ sở dữ liệu và hiển thị ngay trên bảng thống kê.

---

### Task 4.5: Cấu Hình Công Việc Lặp Lại (Recurrence Engine)
- **Vị trí tệp:**
  - `src/app/features/tasks/components/recurrence-modal/recurrence-modal.component.ts`
- **Các bước thực hiện:**
  1. Modal thiết lập tần suất lặp lại: Hàng ngày, Hàng tuần (chọn các thứ trong tuần: Thứ 2, Thứ 4...), Hàng tháng hoặc Tùy chỉnh (mỗi X ngày/tuần).
  2. Các nút điều khiển chu kỳ:
     - **Tạm dừng chu kỳ** (`POST .../recurrence/pause`)
     - **Tiếp tục chu kỳ** (`POST .../recurrence/resume`)
     - **Hủy bỏ vĩnh viễn** (`POST .../recurrence/stop`)
- **Tiêu chí nghiệm thu:**
  - Biểu tượng lặp lại (🔄) hiển thị rõ ràng trên thẻ task để phân biệt task đơn lẻ và task định kỳ.

---

### Task 4.6: Khay Khôi Phục Thùng Rác (Soft Delete Recovery Drawer - AD-003)
- **Vị trí tệp:**
  - `src/app/features/tasks/components/trash-recovery-drawer/trash-recovery-drawer.component.ts`
- **Các bước thực hiện:**
  1. Khay trượt bên phải hiển thị danh sách các task bị xóa trong vòng 2 giờ qua (`GET .../tasks/deleted`).
  2. Đếm ngược thời gian còn lại trước khi task bị ẩn hoàn toàn (ví dụ: *"Còn 1 giờ 15 phút để khôi phục"*).
  3. Nút **"Khôi phục"** (`POST .../tasks/{id}/recover`) đưa task trở lại danh sách hoạt động ngay lập tức.
- **Tiêu chí nghiệm thu:**
  - Người dùng có thể tự cứu các thao tác lỡ tay xóa nhầm trong cửa sổ an toàn 2 giờ.

---

### Task 4.7: Quản Lý Nhãn Hệ Thống (Workspace Tag Manager)
- **Vị trí tệp:**
  - `src/app/features/tasks/components/tag-manager/tag-manager-modal.component.ts`
  - `src/app/features/tasks/components/tag-picker/tag-picker.component.ts`
- **Các bước thực hiện:**
  1. Quản lý danh sách tag của workspace: Tạo mới tên tag, chọn bảng màu tag tự nhiên (Pastel colors: Sage, Terracotta, Ochre, Slate...).
  2. Hỗ trợ chỉnh sửa và xóa tag với cảnh báo nếu tag đang được gắn cho nhiều task.
- **Tiêu chí nghiệm thu:**
  - Bảng màu nhãn đồng bộ trên toàn bộ thẻ task và bộ lọc.
