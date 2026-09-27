# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 5: TỰ ĐỘNG TỔNG HỢP TRÍ NHỚ DÀI HẠN & TOÀN DIỆN HÓA CÔNG CỤ AGENT (AUTONOMOUS MEMORY VAULT & AGENT TOOLING ENGINE)

> **Tài liệu:** `docs/implementation/optimization/phase-5-auto-memory-synthesis-and-vault.md`  
> **Mục tiêu:**  
> 1. Hoàn thiện hệ thống **Memory Vault** tự hành: Tự động lắng nghe hội thoại chat, bóc tách Facts/Thói quen, sàng lọc bảo mật, giải quyết mâu thuẫn (Consolidation) và tự động nạp lại trí nhớ liên quan (Dynamic Memory Recall).  
> 2. Hoàn thiện toàn bộ bộ công cụ Agent (**Events, Tasks, Notes, Memory**) với cơ chế **Xác nhận An toàn (Human-in-the-loop Safe Confirmation)** cho các tác vụ phá hủy/xóa (`delete_*`).  
> 3. Chuẩn hóa **System Prompt** và **tối ưu hóa Tool Schemas** (Token-efficient Design) để tiết kiệm token tối đa mà vẫn đảm bảo độ chính xác vượt trội.  
> **Ước lượng thời gian:** 3 - 4 ngày làm việc.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG AGENT & MEMORY

```
+---------------------------------------------------------------------------------------------------+
|                  KIẾN TRÚC AGENT TOÀN DIỆN & TỔNG HỢP TRÍ NHỚ DÀI HẠN TỰ ĐỘNG                     |
+---------------------------------------------------------------------------------------------------+

                          [User Chat Prompt]
                                  │
                                  ▼
      ┌───────────────────────────────────────────────────────────┐
      │               Agent Context Augmentation                  │
      │  • Dynamic Memory Recall (Top 3-5 relevant facts)         │
      │  • Attached Notes (@Note)                                 │
      │  • Pre-parsed Temporal Context (Local Time + NLP Parser)   │
      └───────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
      ┌───────────────────────────────────────────────────────────┐
      │          System Prompt Builder (Token-Optimized)          │
      │  • Unified Multi-Domain Directives (Event, Task, Note)    │
      │  • Compact Tool Registry (Zero-redundancy Schemas)        │
      └───────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │  LLM ReAct Reasoning  │
                      └───────────┬───────────┘
                                  │
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
   [Query / Mutation Tools]                  [Destructive Tools (delete_*)]
   • upsert_events                           • delete_events
   • upsert_tasks                            • delete_tasks
   • upsert_notes (Mới)                      • delete_notes (Mới)
   • save_memory (Mới)                       • delete_memory (Mới)
             │                                         │
             │ (Auto-resolve Workspace & User ID)      ▼
             │                               ┌───────────────────────┐
             │                               │ Safe Approval Guard   │
             │                               │ (Hỏi xác nhận user)   │
             │                               └───────────────────────┘
             ▼
   [Database Persistence]
             │
             ▼ (Event: ConversationTurnAppended)
   ┌───────────────────────────────────────────────────────────┐
   │        Background Autonomous Memory Synthesis Worker       │
   │  1. LLM Fact Extractor -> 2. Sensitive Fact Screening     │
   │  3. PgVector Deduplication & Consolidation -> 4. MemoryDB │
   └───────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG HẠNG MỤC PHÁT TRIỂN

### Task 5.1: Pipeline Tự Động Trích Xuất & Sàng Lọc Trí Nhớ (Autonomous Fact Extraction Pipeline)
- **Vị trí tệp:**
  - `backend/modules/memory/src/main/java/com/assistant/memory/application/service/FactExtractionService.java` (tạo mới)
  - `backend/modules/memory/src/main/java/com/assistant/memory/application/service/SensitiveFactScreeningService.java` (tạo mới)
  - `backend/modules/bootstrap/src/main/java/com/assistant/bootstrap/listener/MemorySynthesisEventListener.java` (tạo mới)
  - `backend/modules/shared-kernel/src/main/java/com/assistant/kernel/event/MemoryEvents.java`
- **Nghiệp vụ chi tiết:**
  1. **Lắng nghe sự kiện bất đồng bộ**:
     - Bắt sự kiện `MemoryEvents.ConversationTurnAppended`.
     - Áp dụng cơ chế **Debounce / Batching**: Trích xuất sau mỗi 2–3 turn hội thoại hoặc khi phiên chat ngưng hoạt động quá 15 giây nhằm tiết kiệm chi phí LLM.
  2. **Prompt trích xuất facts có cấu trúc (Structured Outputs)**:
     - LLM bóc tách thông tin hội thoại thành các danh mục chuẩn:
       - `USER_PREFERENCE`: Thói quen, sở thích cá nhân/công việc.
       - `PROJECT_CONTEXT`: Dự án đang làm, công nghệ, cộng sự.
       - `WORK_RULE`: Quy tắc làm việc (*"Không họp vào chiều thứ Sáu"*).
       - `CONSTRAINT`: Hạn chế, thể trạng, múi giờ.
  3. **Bộ lọc an toàn & quyền riêng tư (Privacy Screening Invariant)**:
     - `SensitiveFactScreeningService` quét Regex & Rule: Chặn tuyệt đối việc lưu mật khẩu, API key, JWT token, thẻ tín dụng, căn cước công dân.
- **Tiêu chí nghiệm thu:**
  - Sau khi chat chia sẻ thông tin, facts được tự động phân tích và sàng lọc an toàn trong nền mà không làm chậm luồng chat chính.

---

### Task 5.2: Cơ Chế Hợp Nhất, Củng Cố & Xử Lý Mâu Thuẫn Trí Nhớ (Memory Consolidation Engine)
- **Vị trí tệp:**
  - `backend/modules/memory/src/main/java/com/assistant/memory/application/service/MemoryConsolidationService.java` (tạo mới)
  - `backend/modules/memory/src/main/java/com/assistant/memory/domain/repository/MemoryEntryRepository.java`
  - `backend/modules/memory/src/main/java/com/assistant/memory/domain/model/MemoryEntry.java`
- **Nghiệp vụ chi tiết:**
  1. **So khớp ngữ nghĩa (Semantic Duplicate Check)**:
     - So sánh Fact mới với các Fact cũ trong Workspace bằng Cosine Similarity (`similarity > 0.80`).
  2. **Xử lý 3 kịch bản hợp nhất**:
     - **Tạo mới (New Fact)**: Fact hoàn toàn mới -> Lưu bản ghi mới với `confidenceScore >= 0.70`.
     - **Củng cố (Reinforce)**: Fact lặp lại thói quen đã có -> Tăng `confidenceScore` (VD: `0.80` -> `0.95`), cập nhật `updatedAt`.
     - **Mâu thuẫn / Cập nhật (Contradiction / Invalidation)**: Người dùng thay đổi sở thích (VD: *"Chuyển họp từ Google Meet sang Zoom"*) -> Tự động gọi `memoryEntry.revise(...)` để cập nhật dữ liệu mới nhất.
- **Tiêu chí nghiệm thu:**
  - Không sinh dữ liệu rác/trùng lặp khi người dùng nhắc lại một thói quen; tự động cập nhật khi sở thích thay đổi.

---

### Task 5.3: Hoàn Thiện Bộ Công Cụ Agent (Notes, Tasks, Events, Memory) & Tối Ưu Hóa Token (Token-Efficient Design)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/NoteToolAdapter.java` (sửa thành `upsert_notes`)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/DeleteNotesToolAdapter.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/SaveMemoryToolAdapter.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/RecallMemoryToolAdapter.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/infrastructure/tools/DeleteMemoryToolAdapter.java` (tạo mới)
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/AgentSystemPromptBuilder.java`
- **Nguyên tắc thiết kế Tối Ưu Hóa Token (Token-Efficient Tooling)**:
  1. **Tự động trích xuất Context nội bộ (Zero-redundancy Schemas)**:
     - **Loại bỏ hoàn toàn** các trường bắt buộc `workspaceId`, `userId` khỏi JSON Schema mà LLM phải truyền vào.
     - Backend Tool Adapters tự động lấy `workspaceId` từ `WorkspaceContextHolder` và `userId` từ `UserContextHolder` (hoặc SecurityContext). Điều này giúp **tiết kiệm ~40% tokens** cho mỗi lượt gọi tool và tránh lỗi khi LLM điền sai UUID.
  2. **Gom nhóm thao tác theo mảng (`upsert_*` Batching Pattern)**:
     - Hỗ trợ tạo/sửa nhiều items trong 1 lần gọi duy nhất:
       - `upsert_events`: Tạo/sửa lịch.
       - `upsert_tasks`: Tạo/sửa công việc.
       - `upsert_notes`: Tạo/sửa ghi chú (`[{"title":"...", "content":"...", "tags":[...]}]`).
       - `save_memory`: Lưu fact/thói quen trực tiếp khi user yêu cầu.
  3. **Chuẩn hóa Schemas siêu gọn gàng**:
     - Sử dụng mô tả ngắn gọn, súc tích trong JSON Schema và System Prompt, loại bỏ văn phong rườm rà.
- **Tiêu chí nghiệm thu:**
  - Agent hỗ trợ đầy đủ 100% 4 phân hệ (Lịch, Task, Ghi chú, Trí nhớ) với dung lượng prompt gọn gàng, giảm thiểu độ trễ và chi phí token.

---

### Task 5.4: Cơ Chế Xác Nhận An Toàn Cho Thao Tác Xóa (Human-in-the-Loop Safe Approval)
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/AgentSafetyGuard.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/domain/model/AgentExecutionResult.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/presentation/dto/AgentApproveRequest.java`
  - `frontend-angular/src/app/features/agent/components/chat-window/chat-window.component.ts`
- **Nghiệp vụ chi tiết:**
  1. **Nguyên tắc an toàn**:
     - Các thao tác đọc (`list_*`, `semantic_search`, `recall_memory`) và tạo/sửa an toàn (`upsert_*`) được thực thi trực tiếp.
     - Mọi thao tác phá hủy / xóa dữ liệu (`delete_events`, `delete_tasks`, `delete_notes`, `delete_memory`) **BẮT BUỘC** phải đi qua `AgentSafetyGuard`.
  2. **Luồng phê duyệt 2 bước (Safe Approval Flow)**:
     - Khi LLM quyết định gọi `delete_*`, hệ thống tạm dừng thực thi và phát sự kiện `SSE approval_required` kèm preview dữ liệu sắp bị xóa.
     - Frontend hiển thị Card cảnh báo xác nhận màu đỏ/cam nổi bật:
       > ⚠️ *Xác nhận xóa: Bạn có chắc chắn muốn xóa Ghi chú "Kế hoạch Q3" (hoặc Task "Review code") không?*  
       > `[Đồng ý Xóa]` | `[Hủy bỏ]`
     - Chỉ khi người dùng bấm **Đồng ý**, Backend mới thực thi xóa dữ liệu trong DB.
- **Tiêu chí nghiệm thu:**
  - Tuyệt đối không xảy ra tình trạng AI tự ý xóa dữ liệu của người dùng mà không có sự đồng ý trực tiếp.

---

### Task 5.5: Chuẩn Hóa Toàn Diện System Prompt & Dynamic Memory Context
- **Vị trí tệp:**
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/AgentSystemPromptBuilder.java`
  - `backend/modules/agent/src/main/java/com/assistant/agent/application/service/AgentContextAugmenter.java`
- **Chi tiết System Prompt chuẩn hóa**:
  - Hướng dẫn rõ ràng ranh giới nghiệp vụ:
    - 📅 **Khi nào tạo Event (`upsert_events`)**: Các sự kiện có khung giờ cụ thể (họp, bay, hẹn gặp, sinh nhật).
    - 🎯 **Khi nào tạo Task (`upsert_tasks`)**: Việc cần làm có hạn chót (deadline, to-do, việc cần hoàn thành).
    - 📝 **Khi nào tạo Note (`upsert_notes`)**: Bản nháp, biên bản họp, ý tưởng, tóm tắt tài liệu, thông tin lưu trữ tự do.
    - 🧠 **Khi nào lưu Memory (`save_memory`)**: Sở thích, quy tắc làm việc dài hạn, thói quen sinh hoạt của người dùng.
  - **Dynamic Memory Recall**: Tự động inject top 3 facts phù hợp nhất vào đầu prompt trước mỗi câu hỏi để AI cá nhân hóa câu trả lời.
- **Tiêu chí nghiệm thu:**
  - AI phân biệt chính xác 100% ngữ cảnh: Người dùng nói *"Hãy nhớ tóm tắt cuộc họp này"* -> tạo Note; *"Tôi phải nộp báo cáo trước 17h"* -> tạo Task; *"Tôi chỉ rảnh sau 16h"* -> lưu Memory.

---

### Task 5.6: Nâng Cấp Giao Diện Angular (Memory Vault Panel & Real-time Synthesis Feedback)
- **Vị trí tệp:**
  - `frontend-angular/src/app/features/memory/components/memory-vault/memory-vault-panel.component.ts`
  - `frontend-angular/src/app/features/memory/components/memory-vault/memory-vault-panel.component.html`
  - `frontend-angular/src/app/features/memory/models/memory.models.ts`
- **Nghiệp vụ chi tiết:**
  1. **Real-time Memory Toast trong Chat**:
     - Hiển thị thông báo nhẹ khi AI vừa học được thói quen mới: *💡 "AI vừa ghi nhận: [Ưu tiên họp buổi sáng]"*.
  2. **Giao diện Vault trực quan**:
     - Tabs phân loại: *Tất cả*, *Thói quen*, *Quy tắc*, *Dự án*, *Khác*.
     - Source Badge: `[🤖 Tự động tổng hợp]` vs `[✍️ Nhập tay]`.
     - Confidence Score Meter (90%+ High, 70-89% Medium).
     - Thao tác 1-Click: Sửa nhanh, gán nhãn hoặc Xóa.
- **Tiêu chí nghiệm thu:**
  - Giao diện trực quan, người dùng có quyền kiểm soát và xem toàn bộ những gì AI đang ghi nhớ về mình.

---

## 3. CHECKLIST KIỂM THỬ GIAI ĐOẠN 5

- [ ] Trích xuất Fact bất đồng bộ từ hội thoại chat hoạt động ổn định, không làm trễ tốc độ stream của chat.
- [ ] `SensitiveFactScreeningService` chặn hoàn toàn mật khẩu, tokens, keys nhạy cảm.
- [ ] So khớp ngữ nghĩa tránh trùng lặp facts và tự động cập nhật khi đổi sở thích.
- [ ] Agent thực thi đầy đủ các lệnh tạo/sửa/xóa cho cả 4 phân hệ: **Events, Tasks, Notes, Memory**.
- [ ] Thao tác xóa (`delete_*`) luôn yêu cầu người dùng xác nhận an toàn (Human-in-the-loop Approval).
- [ ] Tool Schemas được rút gọn, không yêu cầu `workspaceId`/`userId` từ LLM, tối ưu hóa token.
- [ ] System Prompt phân định chính xác giữa Event, Task, Note và Memory.
- [ ] Giao diện Angular hiển thị phân loại rõ ràng, nguồn gốc Auto/Manual và thanh đo Confidence Score.
