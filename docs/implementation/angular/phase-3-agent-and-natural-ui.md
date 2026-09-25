# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 3: TRỢ LÝ AI TRÒ CHUYỆN TỰ NHIÊN (CONVERSATIONAL AI AGENT & NATURAL UI)

> **Tài liệu:** `docs/implementation/angular/phase-3-agent-and-natural-ui.md`  
> **Mục tiêu:** Xây dựng trung tâm điều phối trợ lý AI (Agent Coordinator) với luồng hội thoại tự nhiên mượt mà, phản hồi realtime qua SSE stream, Human-In-The-Loop (HITL) security approval gate, Executive Daily Briefing và cấu hình BYOK (Bring Your Own Key).  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-3.1** | SSE Chat Stream Engine | `src/app/features/agent/services/agent-chat.service.ts` | `POST .../agent/chat`<br/>`GET .../agent/chat/stream` |
| **TASK-3.2** | Giao diện Khung chat Tự nhiên | `src/app/features/agent/components/chat-window/*`<br/>`src/app/features/agent/components/chat-bubble/*` | `GET .../agent/history` |
| **TASK-3.3** | Ô nhập liệu Thông minh & Gợi ý | `src/app/features/agent/components/chat-input-area/*` | User Input & Prompt suggestions |
| **TASK-3.4** | Human-in-the-Loop (HITL) Gate | `src/app/features/agent/components/approval-banner/*`<br/>`src/app/features/agent/components/approval-modal/*` | `POST .../agent/approve` |
| **TASK-3.5** | Executive Daily Briefing | `src/app/features/agent/components/executive-briefing/*` | `GET .../executive/briefing/today`<br/>`POST .../executive/briefing/generate` |
| **TASK-3.6** | Cấu hình BYOK & AI Settings | `src/app/features/agent/components/byok-config-modal/*` | `GET .../agent/ai-config`<br/>`PUT .../agent/ai-config` |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 3.1: Cơ chế Xử lý Luồng Stream SSE & Signal State (Agent Chat Engine)
- **Vị trí tệp:**
  - `src/app/features/agent/services/agent-chat.service.ts`
  - `src/app/features/agent/models/agent.models.ts`
- **Các bước thực hiện:**
  1. Định nghĩa cấu trúc Message:
     ```typescript
     export interface ChatMessage {
       id: string;
       sender: 'user' | 'agent' | 'system';
       content: string;
       timestamp: Date;
       status: 'sending' | 'streaming' | 'done' | 'error';
       toolCall?: {
         toolName: string;
         arguments: Record<string, any>;
         approvalRequired: boolean;
         approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
         result?: any;
       };
     }
     ```
  2. Triển khai `AgentChatService` với Signals:
     - `messages = signal<ChatMessage[]>([])`
     - `isStreaming = signal<boolean>(false)`
     - `pendingApprovals = computed(() => this.messages().filter(m => m.toolCall?.approvalStatus === 'PENDING'))`
  3. Kết nối SSE Stream: Đọc từng chunk delta ký tự từ backend, tự động nối chuỗi vào tin nhắn `streaming` cuối cùng và kích hoạt render mượt mà.
- **Tiêu chí nghiệm thu:**
  - Chữ hiển thị mượt theo thời gian thực (token-by-token) mà không bị giật lag khung hình (duy trì 60 FPS).

---

### Task 3.2: Giao diện Khung Chat Tự Nhiên & Bong bóng Tin nhắn (Natural UI Bubbles)
- **Vị trí tệp:**
  - `src/app/features/agent/components/chat-window/chat-window.component.ts`
  - `src/app/features/agent/components/chat-bubble/chat-bubble.component.ts`
- **Các bước thực hiện:**
  1. Xây dựng Bong bóng Tin nhắn Người dùng & Trợ lý với phong cách ấm áp:
     - Avatar bo tròn mềm mại, badge trạng thái Online.
     - Hiệu ứng xuất hiện mượt với CSS translateY và fade-in.
     - Render nội dung markdown an toàn, hỗ trợ syntax highlighting cho code block và bảng biểu.
  2. Auto-scroll thông minh: Tự động cuộn xuống cuối khi có tin nhắn mới, nhưng tạm dừng auto-scroll nếu người dùng chủ động cuộn lên xem lịch sử.
  3. Typing Indicator: Hiệu ứng 3 chấm nảy nhịp nhàng khi Agent đang suy nghĩ trước khi stream.
- **Tiêu chí nghiệm thu:**
  - Giao diện mang lại cảm giác đối thoại gần gũi như trò chuyện với trợ lý riêng, không bị đơ giật.

---

### Task 3.3: Ô Nhập Liệu Đa Năng & Thẻ Gợi ý Nhanh (Smart Input Area)
- **Vị trí tệp:**
  - `src/app/features/agent/components/chat-input-area/chat-input-area.component.ts`
- **Các bước thực hiện:**
  1. Textarea tự động co giãn chiều cao theo nội dung người dùng nhập (từ 1 dòng đến tối đa 6 dòng).
  2. Hỗ trợ phím tắt: `Enter` để gửi tin nhắn, `Shift + Enter` để xuống dòng, `Esc` để hủy focus.
  3. Thẻ gợi ý câu lệnh mẫu (Quick Prompt Chips) hiển thị trên ô nhập:
     - *"Tóm tắt lịch trình hôm nay"*
     - *"Tạo task chuẩn bị báo cáo quý 3"*
     - *"Tìm khoảng trống họp 30 phút ngày mai"*
- **Tiêu chí nghiệm thu:**
  - Nhập liệu trực quan, dễ dùng trên cả bàn phím máy tính và bàn phím ảo điện thoại.

---

### Task 3.4: Cơ chế Phê duyệt Hành động Nhạy cảm (Human-in-the-Loop Security Gate)
- **Vị trí tệp:**
  - `src/app/features/agent/components/approval-banner/approval-banner.component.ts`
  - `src/app/features/agent/components/approval-modal/approval-modal.component.ts`
- **Các bước thực hiện:**
  1. Khi Agent quyết định thực thi các Tool quan trọng (như xóa task, gửi email, hủy cuộc họp), backend sẽ yêu cầu phê duyệt (`approvalRequired: true`).
  2. Hiển thị Card Phê duyệt nổi bật trong luồng chat:
     - Tên công cụ (Tool Name), mục đích hành động.
     - Bảng tham số chi tiết (Arguments Diff: ngày giờ, tiêu đề, đối tượng bị tác động).
     - 2 nút hành động rõ ràng: **"Phê duyệt & Thực thi"** (màu xanh lá) và **"Từ chối"** (màu đỏ nhẹ).
  3. Gửi request `POST /agent/approve` với `decision: "APPROVE" | "REJECT"` và cập nhật trạng thái UI tức thì.
- **Tiêu chí nghiệm thu:**
  - Không có hành động phá hủy dữ liệu nào của Agent được chạy ngầm mà thiếu sự xác nhận từ người dùng.

---

### Task 3.5: Báo cáo Điều hành Hàng ngày (Executive Daily Briefing Dashboard)
- **Vị trí tệp:**
  - `src/app/features/agent/components/executive-briefing/executive-briefing-modal.component.ts`
- **Các bước thực hiện:**
  1. Tích hợp API `GET /executive/briefing/today` khi người dùng nhấn nút *"Executive Briefing"* trên thanh công cụ.
  2. Hiển thị tổng quan 3 phần chính:
     - **Lịch trình trọng tâm trong ngày:** Các cuộc họp và sự kiện quan trọng.
     - **Tasks ưu tiên cao (P1/P2):** Cần hoàn thành hôm nay.
     - **Gợi ý của AI Assistant:** Đề xuất tối ưu hóa năng suất và cảnh báo xung đột thời gian.
  3. Nút *"Tạo mới / Cập nhật lại"* gọi `POST /executive/briefing/generate` để Agent tổng hợp lại dữ liệu mới nhất.
- **Tiêu chí nghiệm thu:**
  - Modal mở lên mượt mà, hỗ trợ in hoặc sao chép bản tóm tắt nhanh vào clipboard.

---

### Task 3.6: Cấu hình Tự mang API Key (BYOK & AI Provider Settings)
- **Vị trí tệp:**
  - `src/app/features/agent/components/byok-config-modal/byok-config-modal.component.ts`
- **Các bước thực hiện:**
  1. Giao diện cấu hình LLM cho phép người dùng nhập API Key riêng (Google Gemini, OpenAI GPT-4o, Anthropic Claude).
  2. Điều chỉnh tham số:
     - Model selector (vd: `gemini-1.5-pro`, `gpt-4o-mini`, ...).
     - Temperature slider (`0.0` - Chính xác, logic đến `1.0` - Sáng tạo).
     - Max Output Tokens.
  3. Kiểm tra tính hợp lệ của API Key trước khi lưu xuống backend (`PUT /agent/ai-config`).
- **Tiêu chí nghiệm thu:**
  - API Key được che dấu dưới dạng mật khẩu (`••••••••`), hiển thị trạng thái *"Đã cấu hình"* an toàn.
