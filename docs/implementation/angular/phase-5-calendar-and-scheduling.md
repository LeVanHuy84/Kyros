# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 5: QUẢN LÝ LỊCH BIỂU & TỰ ĐỘNG XẾP LỊCH (CALENDAR & SMART SCHEDULING)

> **Tài liệu:** `docs/implementation/angular/phase-5-calendar-and-scheduling.md`  
> **Mục tiêu:** Xây dựng giao diện lịch biểu tương tác đa chế độ (Tháng, Tuần, Ngày, Lịch trình), cơ chế AI tự động xếp lịch (Auto-Scheduling), phát hiện và giải quyết xung đột thời gian (Conflict Resolution) và quản lý nhắc hẹn với chức năng Báo lại (Snooze).  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-5.1** | Calendar State & Event Service | `src/app/features/calendar/services/calendar.service.ts` | `GET / POST / PATCH / DELETE .../calendar/events` |
| **TASK-5.2** | Lưới Lịch Biểu Đa Chế Độ | `src/app/features/calendar/components/calendar-grid/*` | Multi-view calendar rendering |
| **TASK-5.3** | Modal Tạo Sự Kiện & Chi Tiết | `src/app/features/calendar/components/event-editor/*`<br/>`src/app/features/calendar/components/event-drawer/*` | `POST / PATCH .../calendar/events`<br/>`POST .../events/{id}/reschedule` |
| **TASK-5.4** | AI Tự Động Xếp Lịch & Tìm Slot | `src/app/features/calendar/components/auto-schedule/*`<br/>`src/app/features/calendar/components/slot-picker/*` | `GET .../availability/slots`<br/>`POST .../auto-schedule` |
| **TASK-5.5** | Xử Lý Xung Đột Lịch Biểu | `src/app/features/calendar/components/conflict-resolver/*` | `POST .../resolve-conflicts` |
| **TASK-5.6** | Thông Báo Nhắc Hẹn & Báo Lại | `src/app/features/calendar/components/reminder-toasts/*` | `POST .../reminders/{id}/snooze`<br/>`POST .../reminders/{id}/dismiss` |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 5.1: Quản lý Trạng thái Lịch Biểu (Calendar State & Event Service)
- **Vị trí tệp:**
  - `src/app/features/calendar/services/calendar.service.ts`
  - `src/app/features/calendar/models/calendar.models.ts`
- **Các bước thực hiện:**
  1. Định nghĩa Models:
     ```typescript
     export interface CalendarEvent {
       id: string;
       title: string;
       description?: string;
       location?: string;
       startTime: string; // ISO 8601 UTC
       endTime: string;
       isAllDay: boolean;
       category?: string;
       color?: string;
       attendees?: string[];
       reminders: EventReminder[];
     }

     export interface EventReminder {
       id: string;
       minutesBefore: number;
       triggerTime: string;
       status: 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED';
     }
     ```
  2. Tự động tính toán khung thời gian (Start/End Date range) khi người dùng chuyển trang hoặc đổi view (Tháng/Tuần/Ngày) để gọi API nạp dữ liệu sự kiện tương ứng.
- **Tiêu chí nghiệm thu:**
  - Chuyển đổi mượt mà giữa các tháng/tuần, nạp sự kiện nhanh chóng và lưu cache cục bộ trong Signal Store.

---

### Task 5.2: Giao diện Lưới Lịch Biểu Tương Tác (Calendar Grid Views)
- **Vị trí tệp:**
  - `src/app/features/calendar/components/calendar-grid/calendar-grid.component.ts`
  - `src/app/features/calendar/components/calendar-grid/month-view.component.ts`
  - `src/app/features/calendar/components/calendar-grid/week-view.component.ts`
  - `src/app/features/calendar/components/calendar-grid/day-view.component.ts`
- **Các bước thực hiện:**
  1. Hỗ trợ 4 chế độ hiển thị:
     - **Tháng (Month View):** Lưới 7x5 ngày, hiển thị các viên sự kiện (event pills) và chỉ báo ngày hiện tại (Current Day highlight).
     - **Tuần (Week View):** Cột thời gian 24 giờ với lưới 7 ngày, thể hiện trực quan độ dài sự kiện theo khoảng thời gian.
     - **Ngày (Day View):** Chi tiết từng khung giờ trong ngày, tối ưu để xem sự kiện dày đặc.
     - **Lịch trình (Agenda View):** Danh sách theo thứ tự thời gian, phù hợp cho giao diện mobile.
  2. Thao tác nhấp chuột vào ô trống để tạo nhanh sự kiện tại khung giờ đó.
- **Tiêu chí nghiệm thu:**
  - Lưới lịch hiển thị chính xác theo múi giờ địa phương của người dùng, không bị lệch ngày do UTC.

---

### Task 5.3: Trình Chỉnh Sửa Sự Kiện & Ngăn Chi Tiết (Event Drawer)
- **Vị trí tệp:**
  - `src/app/features/calendar/components/event-editor/event-editor-modal.component.ts`
  - `src/app/features/calendar/components/event-drawer/event-details-drawer.component.ts`
- **Các bước thực hiện:**
  1. Form tạo & sửa sự kiện: Tiêu đề, địa điểm (kèm link meeting nếu có), thời gian bắt đầu & kết thúc, danh sách người tham gia, cài đặt nhắc nhở (15 phút trước, 1 giờ trước...).
  2. `EventDetailsDrawerComponent`: Ngăn trượt bên phải hiển thị chi tiết khi bấm vào sự kiện, cung cấp nút **"Dời lịch nhanh"** (`POST .../reschedule`), **"Chỉnh sửa"** và **"Hủy sự kiện"**.
- **Tiêu chí nghiệm thu:**
  - Cập nhật thông tin sự kiện diễn ra trơn tru, có hộp thoại xác nhận khi hủy cuộc họp.

---

### Task 5.4: AI Tự Động Xếp Lịch & Gợi Ý Khung Giờ (Auto-Scheduling)
- **Vị trí tệp:**
  - `src/app/features/calendar/components/auto-schedule/auto-schedule-modal.component.ts`
  - `src/app/features/calendar/components/slot-picker/slot-picker.component.ts`
- **Các bước thực hiện:**
  1. Khi người dùng cần tìm lịch họp cho 1 tác vụ hoặc cuộc gặp:
     - Nhập thời lượng dự kiến (vd: 45 phút) và khoảng ngày mong muốn.
     - Gọi `GET .../availability/slots` để nạp danh sách các khoảng trống phù hợp dựa trên lịch làm việc cá nhân.
  2. Nhấn nút **"AI Auto-Schedule"** (`POST .../auto-schedule`) để trợ lý tự động chọn slot tối ưu nhất và tạo sự kiện vào lịch.
- **Tiêu chí nghiệm thu:**
  - Tự động tránh các khoảng thời gian bận và tôn trọng thời gian nghỉ (Buffer Time) giữa các sự kiện.

---

### Task 5.5: Giải Quyết Xung Đột Trùng Lịch (Conflict Resolution UI)
- **Vị trí tệp:**
  - `src/app/features/calendar/components/conflict-resolver/conflict-resolver-modal.component.ts`
- **Các bước thực hiện:**
  1. Khi có 2 hay nhiều sự kiện bị đè thời gian lên nhau, hiển thị cảnh báo viền đỏ trên lưới lịch.
  2. Mở `ConflictResolverModalComponent`:
     - Trình bày sơ đồ so sánh trực quan các sự kiện bị đè giờ.
     - Hiển thị 2 phương án giải quyết đề xuất từ AI: Dời sự kiện mức ưu tiên thấp hơn sang slot trống tiếp theo, hoặc rút ngắn thời lượng.
     - Nút **"Áp dụng giải pháp 1 chạm"** (`POST .../resolve-conflicts`).
- **Tiêu chí nghiệm thu:**
  - Xử lý xung đột xong, lịch trình được sắp xếp lại gọn gàng, không còn sự kiện đè lấn.

---

### Task 5.6: Toast Nhắc Hẹn Thời Gian Thực & Báo Lại (Reminder Toasts)
- **Vị trí tệp:**
  - `src/app/features/calendar/components/reminder-toasts/reminder-toasts.component.ts`
- **Các bước thực hiện:**
  1. Khi đến giờ nhắc sự kiện, hiển thị thẻ Toast nổi trên góc màn hình kèm âm thanh báo nhẹ.
  2. Cung cấp các hành động nhanh:
     - **Báo lại sau 5 phút** (`POST .../snooze?minutes=5`)
     - **Báo lại sau 15 phút** (`POST .../snooze?minutes=15`)
     - **Bỏ qua / Đã xem** (`POST .../dismiss`)
- **Tiêu chí nghiệm thu:**
  - Người dùng không bao giờ bị bỏ lỡ cuộc họp quan trọng ngay cả khi đang ở tab màn hình khác trong ứng dụng.
