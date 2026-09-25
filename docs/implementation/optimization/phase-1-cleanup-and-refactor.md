# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 1: FIX "LỎ" & REFACTOR KIẾN TRÚC KỸ THUẬT

> **Tài liệu:** `docs/implementation/optimization/phase-1-cleanup-and-refactor.md`  
> **Mục tiêu:** Xử lý triệt để toàn bộ các điểm sơ sài, hardcoded values, reflection hacks, đảm bảo Type-Safety theo chuẩn Hexagonal Architecture và ổn định luồng xử lý SSE / Async.  
> **Ước lượng thời gian:** 1 - 2 ngày làm việc.

---

## 1. TỔNG QUAN CÁC VẤN ĐỀ CẦN GIẢI QUYẾT

| Mã vấn đề | Module | Hiện trạng "Lỏ" | Giải pháp chuẩn hóa |
| :--- | :--- | :--- | :--- |
| **ISSUE-1.1** | `agent` | `TaskToolAdapter`, `CalendarToolAdapter`, `NoteToolAdapter` dùng `applicationContext.getBean()` và `Method.invoke()` (Reflection). | Inject trực tiếp Inbound Ports (`TodoPort`, `CalendarPort`, `NoteService`) qua constructor DI. |
| **ISSUE-1.2** | `agent` | `planActions` hardcode mốc ngày giờ `2026-09-18T14:00:00Z` khi tạo sự kiện fallback. | Tính toán thời gian động theo `ZonedDateTime.now(ZoneId)` và cấu hình mặc định. |
| **ISSUE-1.3** | `calendar` | `AutoSchedulingService` fix cứng giờ làm việc `08:30 - 17:30` và ZoneId hệ thống. | Tích hợp đọc `UserPreferences` (múi giờ, giờ làm việc, buffer time) từ `memory` module. |
| **ISSUE-1.4** | `notification` | `SseNotificationRegistry` lưu Static Map trong RAM, không có Heartbeat ping định kỳ dẫn đến rớt kết nối ngầm. | Bổ sung Scheduled Heartbeat Ping (mỗi 25 giây) và dọn dẹp các Emitter đã đóng/lỗi. |
| **ISSUE-1.5** | `notification` | Dispatching Email & Slack chạy đồng bộ (Synchronous) trên HTTP thread chính của request. | Cấu hình `@Async("notificationExecutor")` cho luồng gửi ngoại vi (Email/Slack). |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 1.1: Chuẩn hóa Dependency Injection & Xóa bỏ Reflection trong Agent Tools
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/TaskToolAdapter.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/CalendarToolAdapter.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/ListTasksToolAdapter.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/ListEventsToolAdapter.java`
- **Các bước thực hiện:**
  1. Thay thế `ApplicationContext` và `Class.forName(...)` bằng cách inject trực tiếp `TodoPort`, `CalendarPort`, `NoteService` (hoặc định nghĩa Inbound Ports nếu cần).
  2. Map arguments từ JSON Schema sang DTO/Domain objects có type-check rõ ràng.
  3. Bắt lỗi ValidationException cụ thể và trả về `ToolExecutionResult.error(...)` có thông điệp tường minh.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Không còn bất kỳ câu lệnh `Method.invoke()`, `Class.forName()`, `getBean()` nào trong module `agent`.
  - Toàn bộ unit test của Tool Adapters chạy thành công mà không cần mock Reflection.

---

### Task 1.2: Xóa bỏ Hardcoded Datetime & Cải tiến ReAct Fallback Planner
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/ReActOrchestratorService.java`
- **Các bước thực hiện:**
  1. Thay mốc giờ cố định `2026-09-18T14:00:00Z` bằng logic tính toán thời gian động:
     - Lấy `ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))`.
     - Nếu user hẹn "chiều nay" $\rightarrow$ lấy ngày hôm nay lúc 14:00 (nếu đã qua 14:00 thì lấy `now.plusHours(1)`).
     - Nếu user hẹn "sáng mai" $\rightarrow$ lấy ngày mai lúc 09:00.
  2. Bổ sung `currentLocalTime` vào ngữ cảnh mặc định của Agent khi xử lý Prompt.
- **Tiêu chí nghiệm thu:**
  - Khi không dùng Custom LLM Key (fallback mode), câu lệnh *"Họp chiều nay"* sẽ tạo event với ngày hiện tại của hệ thống, không còn bị văng về ngày cũ trong quá khứ.

---

### Task 1.3: Cá nhân hóa Luật Xếp Lịch trong AutoSchedulingService
- **Vị trí tệp:**
  - `backend/modules/calendar/src/main/java/com/assistant/calendar/application/service/AutoSchedulingService.java`
- **Các bước thực hiện:**
  1. Nạp `UserPreferences` của user/workspace (thông qua `MemoryStorePort` hoặc port tương ứng).
  2. Sử dụng `UserPreferences.getTimezone()` thay vì `ZoneId.systemDefault()`.
  3. Cho phép cấu hình khoảng giờ làm việc linh hoạt (mặc định 08:30 - 17:30 nếu user chưa cài đặt).
  4. Bổ sung Buffer Time (thời gian nghỉ 10-15 phút giữa các slot công việc).
- **Tiêu chí nghiệm thu:**
  - Task tự động xếp vào calendar tuân thủ đúng múi giờ và thời gian rảnh thực tế của user.

---

### Task 1.4: SSE Heartbeat Ping & Quản lý Kết nối Notification Bền vững
- **Vị trí tệp:**
  - `backend/modules/notification/src/main/java/com/assistant/notification/presentation/SseNotificationRegistry.java`
  - `backend/modules/notification/src/main/java/com/assistant/notification/presentation/NotificationController.java`
- **Các bước thực hiện:**
  1. Thêm Scheduled Task `@Scheduled(fixedRate = 25000)` để broadcast heartbeat ping:
     ```java
     emitter.send(SseEmitter.event().name("ping").data("keep-alive"));
     ```
  2. Bắt `IOException` khi ping để tự động gỡ bỏ các stale / dead emitter khỏi `ConcurrentHashMap`.
  3. Xử lý trường hợp 1 user mở nhiều tab trình duyệt: Hỗ trợ `Map<String, Set<SseEmitter>>` theo từng `workspaceId:userId`.
- **Tiêu chí nghiệm thu:**
  - Giữ kết nối SSE mở liên tục trên trình duyệt qua 1 tiếng mà không bị đóng ngầm bởi timeout của browser hay proxy.

---

### Task 1.5: Bất đồng bộ hóa (Async) Luồng Gửi Email / Slack
- **Vị trí tệp:**
  - `backend/modules/notification/src/main/java/com/assistant/notification/application/service/NotificationApplicationService.java`
  - `backend/modules/bootstrap/src/main/java/com/assistant/bootstrap/config/AsyncConfig.java`
- **Các bước thực hiện:**
  1. Cấu hình ThreadPoolExecutor chuyên dụng cho Notification (`corePoolSize = 4`, `maxPoolSize = 16`).
  2. Tách việc gọi `emailDispatcher.sendEmail(...)` và `slackDispatcher.postMessage(...)` thành các method `@Async`.
  3. Bổ sung retry logic cơ bản (hoặc catch exception an toàn không làm rollback transaction chính).
- **Tiêu chí nghiệm thu:**
  - Các thao tác tạo Reminder/Event hoặc Dispatch Notification không bị block khi server SMTP gửi mail chậm (trễ 2-3s).

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 1

- [ ] Chạy toàn bộ test suite hiện có: `./gradlew test` pass 100%.
- [ ] Chạy test `ReActOrchestratorServiceTest` xác nhận không còn reflection.
- [ ] Kiểm thử SSE stream trên frontend: thông báo realtime nhảy ngay lập tức và kết nối duy trì ổn định.
- [ ] Kiểm thử tạo Task và Calendar qua Agent ở chế độ fallback không còn lỗi hardcode date.
