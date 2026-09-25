# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 2: NÂNG CẤP AI AGENT, STREAMING & NLP TIẾNG VIỆT

> **Tài liệu:** `docs/implementation/optimization/phase-2-agent-streaming-and-nlp.md`  
> **Mục tiêu:** Nâng cấp AI Agent thành trợ lý điều hành thông minh: Hỗ trợ True Token Streaming (SSE), phân tích ngôn ngữ tự nhiên tiếng Việt cho thời gian/lịch trình, thực thi chuỗi công cụ phức tạp (Multi-tool execution) và tự sửa lỗi khi gọi tool.  
> **Ước lượng thời gian:** 2 - 3 ngày làm việc.

---

## 1. TỔNG QUAN CÁC TÍNH NĂNG CẦN PHÁT TRIỂN

```
+---------------------------------------------------------------------------------------+
|                                LUỒNG XỬ LÝ AGENT MỚI                                  |
+---------------------------------------------------------------------------------------+
|  User Prompt ("Chiều mai 14h họp team và tạo task chuẩn bị slide trước 12h")         |
|                                       │                                               |
|                                       ▼                                               |
|                 [1. Vietnamese NLP Pre-processor]                                     |
|                 (Chuẩn hóa mốc thời gian ISO-8601 theo múi giờ VN)                    |
|                                       │                                               |
|                                       ▼                                               |
|                 [2. LLM Streaming Client (stream=true)]                               |
|                 (Token-by-token đẩy qua SSE Emitter tới Client: TTFT < 300ms)         |
|                                       │                                               |
|                                       ▼                                               |
|                 [3. Multi-tool Execution & Self-Correction]                           |
|                 (Thực thi song song/chuỗi: upsert_events + upsert_tasks)              |
|                                       │                                               |
|                                       ▼                                               |
|                 [4. Feedback & Completion Event]                                      |
+---------------------------------------------------------------------------------------+
```

---

## 2. CHI TIẾT CÁC HẠNG MỤC PHÁT TRIỂN

### Task 2.1: Real-time Token Streaming cho LLM Client
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/domain/llm/LlmPort.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/llm/OpenAiCompatibleLlmClient.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/ReActOrchestratorService.java`
- **Mô tả kỹ thuật:**
  - Hiện tại: Client đợi toàn bộ HTTP POST response trả về đầy đủ JSON rồi mới cắt theo dòng đẩy qua SSE.
  - Cải tiến: Kích hoạt `"stream": true` trong OpenAI payload.
  - Sử dụng Java `HttpClient.sendAsync(..., HttpResponse.BodyHandlers.ofLines())` để đọc từng dòng `data: {"choices":[{"delta":{"content":"..."}}]}`.
  - Đẩy ngay lập tức token nhận được về `SseEmitter.send(SseEmitter.event().name("chunk").data(token))` để giao diện người dùng hiển thị hiệu ứng gõ chữ mượt mà.
- **Tiêu chí nghiệm thu:**
  - Time-To-First-Token (TTFT) giảm từ 3-5 giây xuống dưới 300ms khi dùng Groq hoặc Local Ollama.

---

### Task 2.2: Bộ Xử Lý Ngôn Ngữ Tự Nhiên Tiếng Việt cho Ngày & Giờ (Vietnamese DateTime NLP)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/domain/nlp/VietnameseDateTimeParser.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/CalendarToolAdapter.java`
- **Các mẫu câu cần hỗ trợ:**
  1. **Mốc tương đối**:
     - *"sáng mai"*, *"chiều mai"*, *"tối mai"* $\rightarrow$ ngày $D+1$ vào các khung giờ chuẩn (09:00, 14:00, 19:30).
     - *"thứ 6 tuần tới"*, *"thứ 2 tuần sau"* $\rightarrow$ tính đúng ngày trong tuần kế tiếp.
     - *"sau 3 ngày nữa"*, *"cuối tuần này"* $\rightarrow$ tính đúng thứ 7 / chủ nhật gần nhất.
  2. **Khoảng thời gian**:
     - *"từ 14h đến 15h30 chiều nay"* $\rightarrow$ `startTime: today 14:00`, `endTime: today 15:30`.
     - *"họp 45 phút"* $\rightarrow$ `endTime = startTime + 45m`.
- **Cơ chế hoạt động:**
  - Kết hợp Regex Pattern Matching hiệu năng cao cho các cấu trúc chuẩn và Inject Context thời gian hiện tại vào System Prompt của LLM để LLM sinh đúng ISO-8601 string.
- **Tiêu chí nghiệm thu:**
  - Kiểm thử 20 mẫu câu hẹn lịch tự nhiên phổ biến bằng tiếng Việt đều parse chính xác ra `Instant` tương ứng theo múi giờ `Asia/Ho_Chi_Minh`.

---

### Task 2.3: Hỗ Trợ Kế Hoạch Đa Công Cụ (Multi-Tool Execution Planning)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/ReActOrchestratorService.java`
- **Nghiệp vụ:**
  - Khi user yêu cầu một nhiệm vụ phức hợp:  
    *Ví dụ:* *"Lên kế hoạch tổ chức sự kiện ra mắt sản phẩm: tạo 3 task chuẩn bị và đặt lịch họp kick-off lúc 9h sáng thứ 2."*
  - LLM có thể trả về **nhiều tool calls trong cùng 1 turn** (`tool_calls` array chứa cả `upsert_tasks` và `upsert_events`).
  - `ReActOrchestratorService` xử lý tuần tự hoặc song song các tool calls, gom kết quả quan sát (`observation`) của từng tool và gửi bản tóm tắt mạch lạc về cho user.
- **Tiêu chí nghiệm thu:**
  - Thực thi thành công các câu lệnh kết hợp cả tạo việc lẫn đặt lịch chỉ trong 1 lần gửi prompt của user.

---

### Task 2.4: Cơ Chế Tự Phục Hồi & Sửa Lỗi Khi Gọi Tool (Tool Error Self-Correction)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/ReActOrchestratorService.java`
- **Nghiệp vụ:**
  - Nếu một Tool thực thi thất bại (ví dụ: định dạng ngày sai, thiếu tham số bắt buộc, trùng lịch bị chặn):
    - Trả kết quả lỗi chi tiết dạng JSON vào ngữ cảnh hội thoại:  
      `{"status": "ERROR", "tool": "upsert_events", "reason": "StartTime must be before EndTime"}`.
    - Cho phép LLM thực hiện lượt (turn) tiếp theo để tự điều chỉnh lại tham số và gọi lại tool thay vì dừng ngay lập tức và báo lỗi cho người dùng.
- **Tiêu chí nghiệm thu:**
  - Khi tham số bị lỗi nhỏ, Agent tự điều chỉnh và hoàn thành yêu cầu thành công trong tối đa 3 turns.

---

### Task 2.5: Cải Tiến Giao Thức Duyệt Thao Tác Nguy Hiểm (Interactive Action Approval)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/presentation/AgentChatController.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/presentation/dto/AgentApproveRequest.java`
- **Nghiệp vụ:**
  - Khi Agent phát hiện thao tác xóa dữ liệu hàng loạt hoặc cập nhật quan trọng:
    - Gửi SSE event `approval` kèm theo danh sách chi tiết các item sẽ bị ảnh hưởng (ID, Tiêu đề, Thời gian).
    - Cung cấp endpoint POST `/agent/approve` cho phép người dùng bấm **Xác nhận** hoặc **Hủy bỏ** trực tiếp trên UI.
- **Tiêu chí nghiệm thu:**
  - Thao tác xóa task/lịch bắt buộc phải có bước xác nhận rõ ràng, hiển thị đúng preview item trên frontend trước khi xóa thật.

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 2

- [ ] SSE Token Streaming hiển thị mượt mà trên UI.
- [ ] Parse chính xác các mẫu câu tiếng Việt về thời gian.
- [ ] Agent gọi được nhiều tool liên tiếp trong một phiên hội thoại phức tạp.
- [ ] Tự sửa lỗi thành công khi tham số tool ban đầu không hợp lệ.
