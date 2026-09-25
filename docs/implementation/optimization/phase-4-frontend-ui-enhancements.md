# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 4: NÂNG CẤP GIAO DIỆN NGƯỜI DÙNG (FRONTEND UI/UX)

> **Tài liệu:** `docs/implementation/optimization/phase-4-frontend-ui-enhancements.md`  
> **Mục tiêu:** Đồng bộ hóa giao diện người dùng React + Vite với các tính năng backend mới: Hiển thị Token Streaming mượt mà, Visual Thought/Action Timeline, Bản tin Morning Briefing Widget, Pomodoro Time Tracking trên Task Card, và Quản lý tài liệu tri thức (Document Knowledge Base).  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC NÂNG CẤP GIAO DIỆN (UI/UX)

```
+---------------------------------------------------------------------------------------+
|                                CÁC NÂNG CẤP GIAO DIỆN CHÍNH                           |
+---------------------------------------------------------------------------------------+
|  1. Chat & Streaming      : Token-by-token stream rendering + Collapsible Step Logs   |
|  2. Executive Briefing    : Daily Morning Briefing Modal & Widget đầu ngày            |
|  3. Time Tracking & Focus : Pomodoro Mini-widget trên TaskCard & TaskMetrics          |
|  4. Document Knowledge    : Quản lý & đính kèm file (PDF/MD) vào phiên chat (@Doc)    |
|  5. Connection Indicator  : Realtime SSE Status Indicator (Connected / Reconnecting)  |
+---------------------------------------------------------------------------------------+
```

---

## 2. CHI TIẾT TỪNG HẠNG MỤC PHÁT TRIỂN

### Task 4.1: Nâng Cấp Giao Diện Chat & Token Streaming
- **Vị trí tệp:**
  - `frontend/src/hooks/useAgentChat.ts`
  - `frontend/src/components/agent/ChatWindow.tsx`
  - `frontend/src/components/agent/ChatInputArea.tsx`
  - `frontend/src/styles/markdown.css`
- **Chi tiết thực hiện:**
  1. **Token Streaming Rendering**:
     - Cập nhật `useAgentChat.ts` để đọc sự kiện SSE `name: "chunk"` và nối chuỗi từng token theo thời gian thực (Real-time token append) mà không gây giật lag component (sử dụng `useCallback` / throttle render phù hợp).
     - Bổ sung hiệu ứng blinking cursor (con trỏ nhấp nháy) khi Agent đang stream phản hồi.
  2. **Collapsible Thought & Action Steps (Accordion Timeline)**:
     - Gom nhóm các bước `thought` và `observation` vào một khối collapsible có thể đóng/mở ("*Quá trình suy luận của Agent (3 bước)*").
     - Hiển thị badge trực quan cho từng công cụ được gọi: `[Calendar Tool]`, `[Task Tool]`, `[Memory Tool]`.
  3. **Đính kèm tài liệu (@Note, @Doc)**:
     - Nâng cấp `ChatInputArea.tsx` hỗ trợ autocomplete khi gõ `@`: Gợi ý danh sách Note và Document đính kèm vào ngữ cảnh chat.
- **Tiêu chí nghiệm thu:**
  - Chữ hiển thị mượt mà từng từ khi Agent trả lời, không bị giật cuộn (scroll-jumping) hay flicker màn hình.

---

### Task 4.2: Visual Interactive Approval Card (Duyệt Thao Tác Trực Quan)
- **Vị trí tệp:**
  - `frontend/src/components/agent/ApprovalBanner.tsx`
  - `frontend/src/components/agent/ToolApprovalModal.tsx` (tạo mới nếu cần)
- **Chi tiết thực hiện:**
  1. Khi nhận sự kiện SSE `name: "approval"`, hiển thị Interactive Card nổi bật ngay trong dòng hội thoại:
     - Tiêu đề hành động: ⚠️ *Yêu cầu xác nhận xóa dữ liệu*
     - Preview danh sách các sự kiện hoặc task sắp bị xóa (Title, Date, Status).
     - 2 nút bấm tương tác: **Đồng ý thực thi** (Primary) và **Từ chối** (Ghost/Secondary).
  2. Khi bấm **Đồng ý**, gửi POST đến `/api/v1/workspaces/{workspaceId}/agent/approve` và cập nhật trạng thái card thành *"Đã phê duyệt & thực thi thành công"*.
- **Tiêu chí nghiệm thu:**
  - Người dùng có thể duyệt thao tác trực tiếp tại khung chat 1-click mà không bị mất ngữ cảnh trò chuyện.

---

### Task 4.3: Widget Bản Tin Điều Hành Sáng (Daily Executive Briefing Widget)
- **Vị trí tệp:**
  - `frontend/src/components/agent/ExecutiveBriefingModal.tsx` (tạo mới)
  - `frontend/src/pages/AgentCoordinator.tsx`
- **Chi tiết thực hiện:**
  1. Khi mở ứng dụng vào buổi sáng (hoặc có thông báo Daily Briefing mới):
     - Hiển thị một Banner / Floating Card chào buổi sáng nhẹ nhàng:  
       *"Chào buổi sáng! Bạn có 3 cuộc họp và 2 task ưu tiên cao hôm nay. Bấm để xem tóm tắt điều hành."*
     - Khi bấm vào, mở Modal tóm tắt chi tiết:
       - 📅 Lịch trình theo trục thời gian (Timeline).
       - 🎯 Top 3 mục tiêu trọng tâm trong ngày.
       - 💡 Ghi chú hoặc lời nhắc cần lưu ý.
  2. Nút bấm tương tác: *"Bắt đầu ngày mới"* (Đánh dấu đã đọc).
- **Tiêu chí nghiệm thu:**
  - Giao diện tóm tắt trực quan, hỗ trợ responsive trên cả mobile và desktop.

---

### Task 4.4: Bộ Đếm Thời Gian Tập Trung & Focus Mode (Pomodoro Widget)
- **Vị trí tệp:**
  - `frontend/src/components/todo/TaskCard.tsx`
  - `frontend/src/components/todo/FocusTimerModal.tsx` (tạo mới)
  - `frontend/src/components/todo/TaskMetrics.tsx`
  - `frontend/src/hooks/useTasks.ts`
- **Chi tiết thực hiện:**
  1. **Nút Play/Timer trên TaskCard**:
     - Thêm icon ⏱️ bên cạnh task. Bấm vào để kích hoạt Focus Timer (mặc định 25 phút).
     - Hiển thị bộ đếm giờ thu nhỏ (Mini floating timer) ở góc dưới màn hình khi đang làm việc.
  2. **Ghi nhận thời gian thực tế**:
     - Khi bấm *Hoàn thành Task*, tự động lưu `actualDurationMinutes` và so sánh với `estimatedDurationMinutes`.
  3. **Biểu đồ năng suất trong TaskMetrics**:
     - Hiển thị tổng số giờ tập trung trong tuần và tỷ lệ hoàn thành đúng hạn.
- **Tiêu chí nghiệm thu:**
  - Bộ đếm thời gian hoạt động mượt mà, phát âm thanh chuông nhẹ khi hết giờ tập trung.

---

### Task 4.5: Tab Quản Lý Tài Liệu Tri Thức (Knowledge Base Management)
- **Vị trí tệp:**
  - `frontend/src/pages/Settings.tsx`
  - `frontend/src/components/settings/DocumentsTab.tsx` (tạo mới)
  - `frontend/src/services/api-client.ts`
- **Chi tiết thực hiện:**
  1. Thêm tab **"Knowledge Base & Documents"** trong trang Settings (hoặc Sidebar):
     - Khu vực kéo thả file (Drag & Drop) hỗ trợ các định dạng `.pdf`, `.docx`, `.txt`, `.md`.
     - Danh sách các tài liệu đã tải lên kèm trạng thái vector indexing (`Indexing...`, `Ready`, `Error`).
     - Cho phép xem trước nội dung chunk và xóa tài liệu khỏi tri thức của workspace.
- **Tiêu chí nghiệm thu:**
  - Upload file nhanh chóng với progress bar hiển thị tiến độ và thông báo hoàn tất tức thì.

---

### Task 4.6: Chỉ Báo Trạng Thái Kết Nối Realtime (SSE Connection Status)
- **Vị trí tệp:**
  - `frontend/src/components/layout/Header.tsx` (hoặc Sidebar)
  - `frontend/src/hooks/useNotifications.ts`
- **Chi tiết thực hiện:**
  1. Thêm Connection Pill ở góc trên màn hình:
     - 🟢 **Xanh lá**: *Realtime Active* (SSE kết nối bình thường, nhận ping đều đặn).
     - 🟡 **Vàng (Nhấp nháy)**: *Reconnecting...* (Đang tự động kết nối lại khi mất mạng).
     - 🔴 **Đỏ**: *Disconnected* (Mất kết nối hoàn toàn, hiển thị nút "Thử lại").
- **Tiêu chí nghiệm thu:**
  - Người dùng luôn nắm rõ trạng thái kết nối realtime mà không lo bị miss thông báo quan trọng.

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 4

- [ ] Chat stream không bị giật màn hình hoặc đơ UI khi LLM phản hồi dài.
- [ ] Approval Card hiển thị đúng dữ liệu và bấm duyệt thực thi thành công.
- [ ] Pomodoro Timer chạy chính xác và lưu đúng thời gian thực tế vào task.
- [ ] Giao diện responsive 100% trên các độ phân giải: Mobile (375px), Tablet (768px), Laptop/Desktop (1280px+).
- [ ] Không có lỗi console log hoặc memory leak từ SSE event listeners.
