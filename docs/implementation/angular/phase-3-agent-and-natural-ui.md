# KẾ HOẠCH TRIỂN KHAI ANGULAR UI - GIAI ĐOẠN 3: TRỢ LÝ AI ĐIỀU PHỐI & TRÒ CHUYỆN TỰ NHIÊN (CONVERSATIONAL AGENT COORDINATOR & NATURAL UI)

> **Tài liệu:** `docs/implementation/angular/phase-3-agent-and-natural-ui.md`  
> **Mục tiêu:** Xây dựng trung tâm điều phối trợ lý AI (Agent Coordinator) dưới dạng **Tab màn hình chuyên biệt** (full-height workspace, không dùng bong bóng chat nổi), tích hợp SSE real-time stream, kiểm tra bắt buộc cấu hình BYOK (AI Settings) trước khi chat, đính kèm Tag Note theo ngữ cảnh, Human-In-The-Loop (HITL) security approval gate và Executive Daily Briefing.  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC HẠNG MỤC CẦN THI CÔNG

| Mã Task | Hạng mục | Vị trí tệp tin | Backend Endpoints Tương Ứng |
| :--- | :--- | :--- | :--- |
| **TASK-3.1** | SSE Chat Stream Engine & State Store | `src/app/features/agent/services/agent-chat.service.ts`<br/>`src/app/features/agent/models/agent.models.ts` | `POST /api/v1/workspaces/{id}/agent/chat`<br/>`GET /api/v1/workspaces/{id}/agent/chat/stream`<br/>`GET /api/v1/workspaces/{id}/conversations` |
| **TASK-3.2** | Giao diện Tab Điều phối Agent (Full-page Workspace) | `src/app/features/agent/pages/agent-coordinator/*`<br/>`src/app/features/agent/components/chat-window/*`<br/>`src/app/features/agent/components/conversation-sidebar/*` | `GET /api/v1/workspaces/{id}/agent/history`<br/>`GET /api/v1/workspaces/{id}/conversations/{id}/turns` |
| **TASK-3.3** | Kiểm tra BYOK Key Guard & Cảnh báo trước khi Chat | `src/app/features/agent/guards/ai-config.guard.ts`<br/>`src/app/features/agent/components/byok-warning-banner/*` | `GET /api/v1/workspaces/{id}/agent/ai-config` |
| **TASK-3.4** | Ô nhập liệu Thông minh & Đính kèm Tag Note | `src/app/features/agent/components/chat-input-area/*`<br/>`src/app/features/agent/components/note-mention-picker/*` | `GET /api/v1/workspaces/{id}/notes`<br/>Context Injection Payload |
| **TASK-3.5** | Human-in-the-Loop (HITL) Gate | `src/app/features/agent/components/approval-banner/*`<br/>`src/app/features/agent/components/approval-modal/*` | `POST /api/v1/workspaces/{id}/agent/approve` |
| **TASK-3.6** | Cấu hình BYOK & AI Provider Vault (Đặt tại Settings) | `src/app/features/settings/components/ai-config-panel/*`<br/>`src/app/features/settings/services/ai-settings.service.ts` | `GET /api/v1/workspaces/{id}/agent/ai-config`<br/>`PUT /api/v1/workspaces/{id}/agent/ai-config` |
| **TASK-3.7** | Bản tin Điều hành Hàng ngày (Executive Daily Briefing) | `src/app/features/agent/components/executive-briefing/*` | `GET /api/v1/workspaces/{id}/executive/briefing/today`<br/>`POST /api/v1/workspaces/{id}/executive/briefing/generate` |

---

## 2. CHI TIẾT TỪNG HẠNG MỤC THI CÔNG

### Task 3.1: Cơ chế Xử lý Luồng Stream SSE & Signal State (Agent Chat Engine)
- **Vị trí tệp:**
  - `src/app/features/agent/services/agent-chat.service.ts`
  - `src/app/features/agent/models/agent.models.ts`
- **Các bước thực hiện:**
  1. Định nghĩa cấu trúc dữ liệu hoàn chỉnh:
     ```typescript
     export interface ChatMessage {
       id: string;
       sender: 'user' | 'agent' | 'system';
       content: string;
       timestamp: Date;
       status: 'sending' | 'streaming' | 'done' | 'error';
       attachedNotes?: { id: string; title: string }[];
       toolCall?: {
         toolName: string;
         arguments: Record<string, any>;
         approvalRequired: boolean;
         approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
         result?: any;
       };
     }

     export interface Conversation {
       id: string;
       title: string;
       updatedAt: string;
       turnCount?: number;
     }

     export interface AiConfig {
       provider: string; // 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'CUSTOM'
       apiKey?: string;
       hasSavedKey: boolean;
       baseUrl?: string;
       model: string;
       temperature?: number;
       maxOutputTokens?: number;
     }
     ```
  2. Triển khai `AgentChatService` với Angular Signals:
     - `conversations = signal<Conversation[]>([])`
     - `activeConversationId = signal<string | null>(null)`
     - `messages = signal<ChatMessage[]>([])`
     - `isStreaming = signal<boolean>(false)`
     - `isThinking = signal<boolean>(false)`
     - `isConfigured = signal<boolean>(false)` (Trạng thái đã có API Key chưa)
     - `pendingApproval = signal<ChatMessage | null>(null)`
  3. Kết nối SSE Stream: Đọc từng chunk delta token từ endpoint `GET .../agent/chat/stream`, tự động ghép nối mượt mà vào tin nhắn đang stream và cập nhật giao diện thời gian thực.
- **Tiêu chí nghiệm thu:**
  - Chữ hiển thị mượt mà từng token, duy trì 60 FPS, không xung đột khi đổi session chat.

---

### Task 3.2: Giao diện Tab Điều Phối Agent Toàn Màn Hình (Full-page Workspace Layout)
- **Vị trí tệp:**
  - `src/app/features/agent/pages/agent-coordinator/agent-coordinator.component.ts`
  - `src/app/features/agent/pages/agent-coordinator/agent-coordinator.component.html`
  - `src/app/features/agent/pages/agent-coordinator/agent-coordinator.component.scss`
  - `src/app/features/agent/components/chat-window/chat-window.component.ts`
  - `src/app/features/agent/components/conversation-sidebar/conversation-sidebar.component.ts`
- **Các bước thực hiện:**
  1. **Định dạng Layout:** Là **Tab chính `/agent`** trên Sidebar điều hướng (Workspace full-height 100%), **tuyệt đối không dùng widget bong bóng chat tròn nổi**.
  2. **Cấu trúc 2 cột linh hoạt:**
     - **Cột trái (Sidebar 200px - 240px):** Danh sách các phiên trò chuyện (`ConversationSidebar`), nút `+ Cuộc trò chuyện mới`, nút xóa phiên.
     - **Cột phải (Chat Canvas chính):** Header điều khiển (Nút Bản tin điều hành, Shortcut cấu hình AI Key, Toggle SSE/REST), Cửa sổ cuộn tin nhắn (`ChatWindow`), và Thanh nhập liệu gắn Tag Note ở đáy.
  3. Render nội dung Markdown an toàn với cú pháp Code highlighting, bảng biểu, trích dẫn, và avatar trợ lý Kyros.
  4. Auto-scroll thông minh: Tự cuộn khi có token mới, tạm dừng khi người dùng chủ động cuộn lên xem lịch sử.
- **Tiêu chí nghiệm thu:**
  - Không gian làm việc chuyên nghiệp, thoáng đãng, mang phong cách Natural UI ấm áp và hiện đại.

---

### Task 3.3: Tự động Kiểm tra BYOK Key & Cảnh báo Chặn Chat (AI Key Guard)
- **Vị trí tệp:**
  - `src/app/features/agent/components/byok-warning-banner/byok-warning-banner.component.ts`
  - `src/app/features/agent/components/byok-warning-banner/byok-warning-banner.component.html`
  - `src/app/features/agent/components/byok-warning-banner/byok-warning-banner.component.scss`
- **Các bước thực hiện:**
  1. Khi màn hình `/agent` khởi tạo (OnInit) hoặc khi đổi Workspace:
     - Tự động gọi `GET /api/v1/workspaces/{id}/agent/ai-config` để kiểm tra trạng thái cấu hình AI Provider.
     - Kiểm tra cờ `hasSavedKey` và `model`.
  2. Nếu **chưa có API Key (`hasSavedKey === false`)**:
     - Hiển thị Banner cảnh báo màu vàng/cam nổi bật ngay trên đầu khung chat: *"Chưa cấu hình API Key cho Trợ lý AI trong Workspace này. Vui lòng thiết lập API Key cá nhân để bắt đầu trò chuyện."*
     - **Khóa (disable) ô nhập chat (`ChatInputArea`)** và nút gửi tin nhắn.
     - Nút hành động nhanh: **"Đến trang Cài đặt cấu hình"** $\rightarrow$ điều hướng mượt sang `/settings?tab=ai` hoặc mở dialog cấu hình tức thì.
  3. Khi đã có API Key $\rightarrow$ mở khóa toàn bộ tính năng trò chuyện bình thường.
- **Tiêu chí nghiệm thu:**
  - Người dùng luôn biết rõ lý do tại sao Agent chưa thể phản hồi và được hướng dẫn trực tiếp đến nơi cấu hình Key.

---

### Task 3.4: Ô Nhập Liệu Đa Năng & Đính Kèm Thẻ Tag Note (Context Mention)
- **Vị trí tệp:**
  - `src/app/features/agent/components/chat-input-area/chat-input-area.component.ts`
  - `src/app/features/agent/components/chat-input-area/chat-input-area.component.html`
  - `src/app/features/agent/components/chat-input-area/chat-input-area.component.scss`
  - `src/app/features/agent/components/note-mention-picker/note-mention-picker.component.ts`
- **Các bước thực hiện:**
  1. **Textarea tự co giãn chiều cao:** Tự động tăng chiều cao từ 1 dòng đến tối đa 6 dòng theo lượng nội dung nhập (`auto-resize`).
  2. **Hỗ trợ đính kèm Tag Note (Knowledge Reference):**
     - Nút icon `Tag Note / FileText` hoặc gõ ký tự `@` để mở bộ chọn Note (`NoteMentionPicker`).
     - Tải danh sách ghi chú từ `GET /api/v1/workspaces/{id}/notes`.
     - Cho phép chọn 1 hoặc nhiều ghi chú; hiển thị dưới dạng các **Tag Chip màu xanh nhạt** nằm ngay trên ô nhập liệu (kèm nút `x` để gỡ tag).
     - Khi gửi tin nhắn, đính kèm ID các ghi chú được chọn vào payload request để Backend nạp ngữ cảnh vào LLM prompt.
  3. Phím tắt: `Enter` để gửi, `Shift + Enter` để xuống dòng.
- **Tiêu chí nghiệm thu:**
  - Gắn và gỡ Tag Note nhanh chóng, truyền đầy đủ ngữ cảnh ghi chú vào câu hỏi cho AI Agent.

---

### Task 3.5: Cơ chế Phê duyệt Hành động Nhạy cảm (Human-in-the-Loop Security Gate)
- **Vị trí tệp:**
  - `src/app/features/agent/components/approval-banner/approval-banner.component.ts`
  - `src/app/features/agent/components/approval-banner/approval-banner.component.html`
  - `src/app/features/agent/components/approval-banner/approval-banner.component.scss`
- **Các bước thực hiện:**
  1. Khi Agent phát hiện hành động có rủi ro cao (Tool Call xóa task, hủy lịch họp, gửi email):
     - Hiển thị Banner Phê duyệt an toàn ở đáy khung chat với viền cảnh báo màu hổ phách/xanh.
     - Hiển thị rõ: Tên công cụ (Tool Name), Tham số chi tiết (Arguments Diff: Ngày giờ, Người nhận, Tiêu đề).
  2. 2 Lựa chọn rõ ràng:
     - Nút **"Phê duyệt & Thực thi"** (màu xanh lá): Gửi `POST .../agent/approve` với `decision: "APPROVE"`.
     - Nút **"Từ chối"** (màu đỏ nhẹ): Gửi `POST .../agent/approve` với `decision: "REJECT"`.
  3. Cập nhật ngay trạng thái của tin nhắn thành công hoặc bị hủy bỏ.
- **Tiêu chí nghiệm thu:**
  - Bảo vệ 100% dữ liệu của người dùng, không để Agent tự ý xóa sửa thông tin mà chưa được duyệt.

---

### Task 3.6: Cấu hình BYOK & AI Provider Vault (Đặt tại Trang Cài Đặt Settings)
- **Vị trí tệp:**
  - `src/app/features/settings/components/ai-config-panel/ai-config-panel.component.ts`
  - `src/app/features/settings/components/ai-config-panel/ai-config-panel.component.html`
  - `src/app/features/settings/components/ai-config-panel/ai-config-panel.component.scss`
  - `src/app/features/settings/services/ai-settings.service.ts`
- **Các bước thực hiện:**
  1. Nằm trong trang **Settings (`/settings`) $\rightarrow$ Tab "AI Provider & Vault"** (`activeSubTab = 'ai'`).
  2. Hỗ trợ các Presets phổ biến:
     - **Google Gemini:** `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`
     - **OpenAI:** `gpt-4o`, `gpt-4o-mini`, `o1-mini`
     - **Anthropic Claude:** `claude-3-5-sonnet`, `claude-3-haiku`
     - **Custom Endpoint (Ollama / LocalAI / LiteLLM)**
  3. Ô nhập API Key bảo mật:
     - Nếu đã có key trong Vault $\rightarrow$ hiển thị trạng thái `🔒 ••••••••••••••••` kèm huy hiệu *"Backend AES-256 Vault Encrypted"* và nút "Thay đổi Key".
     - Hỗ trợ nút mắt ẩn/hiện (`eye` / `eye-off`).
  4. Lưu cấu hình qua `PUT /api/v1/workspaces/{id}/agent/ai-config` và thông báo toast thành công tức thì.
- **Tiêu chí nghiệm thu:**
  - Lưu và mã hóa an toàn API Key, cập nhật ngay lập tức sang màn hình Chat mà không cần reload app.

---

### Task 3.7: Báo cáo Điều hành Hàng ngày (Executive Daily Briefing Dashboard)
- **Vị trí tệp:**
  - `src/app/features/agent/components/executive-briefing/executive-briefing-modal.component.ts`
  - `src/app/features/agent/components/executive-briefing/executive-briefing-modal.component.html`
  - `src/app/features/agent/components/executive-briefing/executive-briefing-modal.component.scss`
- **Các bước thực hiện:**
  1. Nút *"Bản tin điều hành"* trên header của Chat kích hoạt mở Modal Briefing.
  2. Gọi `GET /api/v1/workspaces/{id}/executive/briefing/today`:
     - **Lịch trình trọng tâm trong ngày:** Sự kiện họp, mốc giờ quan trọng.
     - **Nhiệm vụ ưu tiên cao (P1/P2):** Các công việc cần giải quyết trước.
     - **Lời khuyên năng suất từ AI:** Đề xuất phân bổ thời gian và giải quyết xung đột.
  3. Nút *"Tạo mới / Tổng hợp lại"* gọi `POST /api/v1/workspaces/{id}/executive/briefing/generate`.
- **Tiêu chí nghiệm thu:**
  - Modal hiển thị trực quan, hỗ trợ copy nhanh bản tin tóm tắt vào clipboard.

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 3

- [ ] Khi chưa cấu hình API Key $\rightarrow$ Tab Chat hiển thị Banner cảnh báo và khóa ô nhập tin nhắn.
- [ ] Bấm nút chuyển sang Settings $\rightarrow$ Lưu API Key thành công $\rightarrow$ Quay lại Chat mở khóa tức thì.
- [ ] Gửi câu hỏi kèm đính kèm Tag Note $\rightarrow$ Agent phản hồi chính xác dựa trên nội dung Note.
- [ ] Thử nghiệm Tool Call nhạy cảm $\rightarrow$ Banner HITL xuất hiện $\rightarrow$ Bấm Phê duyệt hoặc Từ chối hoạt động chính xác.
- [ ] Bản tin điều hành mở mượt mà và tổng hợp đầy đủ tasks, calendar của workspace hiện tại.
- [ ] Toàn bộ components tuân thủ OnPush, Standalone, tách file `.ts`/`.html`/`.scss` và hỗ trợ Dark Mode 100%.
