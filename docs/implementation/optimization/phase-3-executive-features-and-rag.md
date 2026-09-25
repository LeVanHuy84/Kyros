# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 3: TÍNH NĂNG TRỢ LÝ ĐIỀU HÀNH CAO CẤP & VECTOR RAG

> **Tài liệu:** `docs/implementation/optimization/phase-3-executive-features-and-rag.md`  
> **Mục tiêu:** Nâng tầm ứng dụng thành Trợ Lý Điều Hành Chuyên Nghiệp (Executive Assistant) với các tính năng tự động hóa cao cấp: Bản tin tổng hợp sáng/tối (Daily Executive Briefing), Bộ nhớ ngữ nghĩa Vector RAG thực thụ (pgvector), Tự động tổng hợp thói quen người dùng, và Quản lý thời gian tập trung (Focus / Deep Work).  
> **Ước lượng thời gian:** 3 - 5 ngày làm việc.

---

## 1. TỔNG QUAN TÍNH NĂNG MỤC TIÊU

```
+---------------------------------------------------------------------------------------+
|                       HỆ SINH THÁI TÍNH NĂNG ĐIỀU HÀNH CAO CẤP                       |
+---------------------------------------------------------------------------------------+
|  1. Daily Executive Briefing : Tự động tạo bản tin sáng (7:30) & tổng kết ngày (18:00)|
|  2. True Vector RAG Memory   : PgVector + Embeddings (Tìm kiếm tri thức chính xác 100%)|
|  3. Auto Memory Synthesis    : Tự động trích xuất thói quen & sự kiện vào MemoryEntry  |
|  4. Workspace Doc Ingestion  : Upload tài liệu (PDF, Word, MD) và Chat hỏi đáp với Doc|
|  5. Time Tracking & Focus    : Chế độ làm việc sâu (Deep Work) & đo lường năng suất  |
+---------------------------------------------------------------------------------------+
```

---

## 2. CHI TIẾT TỪNG HẠNG MỤC PHÁT TRIỂN

### Task 3.1: Hệ Thống Bản Tin Điều Hành Tự Động (Daily Executive Briefing & Wrap-up)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/ExecutiveBriefingService.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/scheduler/ExecutiveBriefingScheduler.java` (tạo mới)
  - `backend/modules/kernel/src/main/java/com/assistant/kernel/util/KyrosEmailTemplate.java`
- **Nghiệp vụ chi tiết:**
  1. **Morning Briefing (Chạy lúc 07:30 mỗi sáng - Giờ địa phương)**:
     - Quét toàn bộ: Lịch họp trong ngày + Top 3 task ưu tiên cao nhất cần hoàn thành + Các ghi chú liên quan.
     - Dùng LLM với prompt chuyên biệt để viết một bản tin tổng hợp ngắn gọn, phong cách trợ lý riêng:  
       *"Chào bạn, hôm nay bạn có 2 cuộc họp quan trọng (bắt đầu lúc 9h30). Hãy chú ý hoàn thành task 'Nộp báo cáo Q3' trước 17h. Chúc bạn một ngày làm việc hiệu quả!"*
     - Đẩy qua In-App Notification (Urgency: Normal) và gửi Email HTML đẹp mắt.
  2. **Evening Wrap-up (Chạy lúc 18:00 mỗi chiều)**:
     - Tổng kết số task đã hoàn thành trong ngày, số task bị trễ hạn cần dời sang ngày mai.
- **Tiêu chí nghiệm thu:**
  - Người dùng nhận được email và in-app notification tóm tắt lịch trình tự động vào mỗi buổi sáng.

---

### Task 3.2: Tích Hợp Vector RAG Thực Thụ (PgVector & Embeddings)
- **Vị trí tệp:**
  - `backend/modules/memory/src/main/java/com/assistant/memory/infrastructure/persistence/SpringDataMemoryEntryRepository.java`
  - `backend/modules/memory/src/main/java/com/assistant/memory/infrastructure/vector/PgVectorMemoryStore.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/SemanticSearchToolAdapter.java` (tạo mới)
- **Mô tả kỹ thuật:**
  1. Bật extension `vector` trong PostgreSQL (hoặc Spring AI VectorStore).
  2. Bổ sung cột `embedding vector(1536)` (OpenAI) hoặc `vector(768)` (Ollama nomic-embed-text) vào bảng `memory_entries` và `notes`.
  3. Khi tạo/sửa Note hoặc MemoryEntry, tự động sinh embedding vector bất đồng bộ.
  4. Thay thế câu truy vấn SQL LIKE bằng câu lệnh Cosine Similarity:
     ```sql
     SELECT id, content, (1 - (embedding <=> :queryVector)) AS similarity
     FROM memory_entries
     WHERE workspace_id = :workspaceId AND (1 - (embedding <=> :queryVector)) > 0.75
     ORDER BY similarity DESC
     LIMIT :limit;
     ```
- **Tiêu chí nghiệm thu:**
  - Tìm kiếm ngữ nghĩa trả về đúng thông tin ngay cả khi từ khóa tìm kiếm không trùng khớp chữ cái nào (ví dụ: query *"vấn đề tài chính công ty"* tìm được note *"Báo cáo thu chi tháng 8 thiếu hụt ngân sách"*).

---

### Task 3.3: Tự Động Trích Xuất Trí Nhớ & Thói Quen (Auto Memory Synthesis)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/MemorySynthesisService.java` (tạo mới)
  - `backend/modules/bootstrap/src/main/java/com/assistant/bootstrap/listener/MemorySynthesisEventListener.java` (tạo mới)
- **Nghiệp vụ chi tiết:**
  - Lắng nghe event `MemoryEvents.ConversationTurnAppended`.
  - Sau mỗi phiên hội thoại (hoặc định kỳ mỗi 5 turns), chạy background task gọi model LLM nhỏ để rút trích các sự thật (Facts) và thói quen mới của người dùng:
    - *"User prefers meetings before 11 AM"*
    - *"User is working on Project Kyros with lead developer Nam"*
  - Tự động lưu vào `MemoryEntry` với confidence score cao và gắn tag phân loại.
- **Tiêu chí nghiệm thu:**
  - Sau khi chat chia sẻ thông tin cá nhân/công việc, trang **Memory** tự động hiển thị các Facts mới được trích xuất mà người dùng không cần nhập tay.

---

### Task 3.4: Tra Cứu Tri Thức Từ Tài Liệu Đính Kèm (Document Ingestion RAG)
- **Vị trí tệp:**
  - `backend/modules/workspace/src/main/java/com/assistant/workspace/application/services/DocumentIngestionService.java` (tạo mới)
  - `backend/modules/workspace/src/main/java/com/assistant/workspace/presentation/DocumentController.java` (tạo mới)
- **Nghiệp vụ chi tiết:**
  1. Cho phép upload file PDF, DOCX, TXT, Markdown vào Workspace.
  2. Tách nhỏ văn bản thành các đoạn (chunking 500-1000 tokens với overlap 100 tokens).
  3. Đánh index vector cho từng chunk.
  4. Cung cấp Tool `search_documents` cho Agent để tra cứu tài liệu khi user hỏi: *"Trong file hợp đồng đối tác A có điều khoản bảo hành nào?"*.
- **Tiêu chí nghiệm thu:**
  - AI Agent trả lời chính xác các câu hỏi dựa trên nội dung tệp tài liệu PDF đính kèm trong workspace kèm trích dẫn nguồn.

---

### Task 3.5: Time Tracking & Chế Độ Làm Việc Tập Trung (Focus & Productivity Mode)
- **Vị trí tệp:**
  - `backend/modules/todo/src/main/java/com/assistant/todo/application/service/TaskTimeTrackingService.java` (tạo mới)
  - `backend/modules/todo/src/main/java/com/assistant/todo/presentation/TaskTimeTrackingController.java` (tạo mới)
- **Nghiệp vụ chi tiết:**
  1. Cung cấp API Start / Pause / Stop Timer cho từng Task (kết hợp đồng hồ Pomodoro 25 phút).
  2. Lưu lại `actualDurationMinutes` của từng task khi hoàn thành.
  3. Tính toán tỷ lệ chênh lệch giữa `estimatedDurationMinutes` và `actualDurationMinutes`.
  4. Cung cấp dữ liệu này cho `AutoSchedulingService` để tự động điều chỉnh thời gian dự kiến cho các task tương tự trong tương lai.
- **Tiêu chí nghiệm thu:**
  - Người dùng có thể bấm chạy timer trực tiếp trên task và xem báo cáo tổng thời gian tập trung trong tuần.

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 3

- [ ] Morning Briefing Scheduler chạy đúng 7:30 sáng và gửi bản tin tổng hợp chính xác.
- [ ] Truy vấn PgVector Cosine Similarity cho kết quả tìm kiếm ngữ nghĩa vượt trội hơn SQL LIKE.
- [ ] Fact Synthesis tự động tạo MemoryEntry từ hội thoại chat.
- [ ] Document Ingestion đọc và index thành công file PDF/Markdown.
- [ ] Time Tracking ghi nhận chính xác thời gian thực thi task.
