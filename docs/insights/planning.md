Mình sẽ trả lời theo kinh nghiệm làm project dài hạn.

**Đừng bắt đầu bằng code.**

90% project cá nhân chết vì người ta mở IntelliJ lên rồi tạo `UserController`.

Thứ nên làm đầu tiên là **thiết kế sản phẩm**.

---

# Giai đoạn 0 — Xác định "AI làm gì?"

Đây là câu quan trọng nhất.

Ví dụ đừng viết:

> AI Assistant

Quá mơ hồ.

Hãy viết:

> AI có thể:
>
> - lập kế hoạch
> - đọc calendar
> - đọc todo
> - tạo todo
> - tạo event
> - trả lời câu hỏi
> - summarize
> - gọi tool

Đó chính là phạm vi (scope).

---

# Giai đoạn 1 — Viết User Stories

Ví dụ

```
Là một user

Tôi muốn

"Tạo kế hoạch học Spring Boot"

để AI sinh ra:

- Todo
- Calendar
- Reminder
```

---

```
"Tôi có rảnh tuần sau không?"
```

AI sẽ

```
Calendar

↓

Todo

↓

Reasoning
```

---

```
"Review hôm nay"
```

AI

```
Calendar

↓

Todo

↓

GitHub

↓

Summary
```

Viết khoảng **30–50 user stories**.

Sau đó mới code.

---

# Giai đoạn 2 — Thiết kế Domain

Đây là bước quan trọng nhất.

Ví dụ

```
User
```

↓

có

```
Workspace
```

↓

có

```
Calendar
Todo
Note
Workflow
```

↓

Workflow

↓

Trigger

↓

Action

↓

Execution

Agent chỉ là một domain.

Không phải trung tâm.

---

# Giai đoạn 3 — Chia Module

Ví dụ

```
auth

user

workspace

todo

calendar

note

workflow

agent

connector

memory

notification
```

Lúc này mới bắt đầu nghĩ đến package.

---

# Giai đoạn 4 — Thiết kế Connector

Ví dụ

```
interface CalendarProvider
```

Implement

```
Local

Google
```

---

```
interface TodoProvider
```

Implement

```
Local

TickTick
```

---

```
interface NoteProvider
```

Implement

```
Local

Notion
```

Lúc này project rất đẹp.

---

# Giai đoạn 5 — Thiết kế AI

Ví dụ

```
User

↓

Planner

↓

Executor

↓

Tool Registry

↓

Memory

↓

LLM
```

Planner chỉ biết

```
Need calendar

↓

Need todo

↓

Need search
```

Không biết Google.

---

# Giai đoạn 6 — Database

Ví dụ

```
users

workspaces

todos

calendar_events

notes

workflows

executions

memory

chat_message
```

---

# Giai đoạn 7 — API

Ví dụ

```
POST /todos

POST /calendar

POST /chat

POST /workflow

POST /connector/google

POST /connector/github
```

---

# Giai đoạn 8 — Mới tạo project Spring

Đây là lúc tạo

```
Spring Boot

↓

Module

↓

Hexagonal
```

---

# Nếu là mình, roadmap sẽ như thế này

## Tuần 1

Không code.

Chỉ viết tài liệu.

```
Vision

↓

Feature

↓

Architecture

↓

Module

↓

ERD

↓

API
```

---

## Tuần 2

Tạo project.

```
Spring Boot

↓

Hexagonal

↓

Flyway

↓

Docker

↓

JWT
```

Không có business.

---

## Tuần 3

Auth

Workspace

User

---

## Tuần 4

Todo

Calendar

Note

---

## Tuần 5

Workflow

Notification

---

## Tuần 6

Agent

Tool Calling

Streaming

---

## Tuần 7

Memory

RAG

---

## Tuần 8

Google Connector

GitHub Connector

---

# Đây là điều mình khuyên nhất

Thay vì nghĩ:

> "Mình sẽ làm AI Assistant"

hãy nghĩ:

> **"Mình sẽ xây một Agent Platform."**

Ví dụ, trong hệ thống sẽ có các khái niệm cốt lõi:

```text
Agent

↓

Planner

↓

Workflow

↓

Tool Registry

↓

Connector

↓

Execution Engine

↓

Memory
```

Sau đó **Todo, Calendar, GitHub, Gmail, Notion... chỉ là plugin (connector)**.

Điều này có 3 lợi ích rất lớn:

- **Backend mạnh hơn**: bạn phải thiết kế framework để đăng ký, quản lý và thực thi các connector/tool.
- **AI tự nhiên hơn**: agent chỉ biết "gọi Tool", không phụ thuộc vào Google hay GitHub.
- **Mở rộng dễ dàng**: hôm nay có Google Calendar, mai thêm Outlook hay Jira chỉ cần viết connector mới.

## Mình sẽ làm gì ngay từ ngày đầu?

Nếu đây là project của mình, mình sẽ **không mở IntelliJ ngay**. Mình sẽ tạo một thư mục `docs/` và viết theo thứ tự:

```
docs/
├── 01-vision.md
├── 02-requirements.md
├── 03-domain-model.md
├── 04-architecture.md
├── 05-module-design.md
├── 06-database-design.md
├── 07-api-design.md
├── 08-agent-design.md
├── 09-connector-framework.md
├── 10-roadmap.md
```

Khi 10 tài liệu này hoàn thành, việc code sẽ gần như chỉ là hiện thực hóa thiết kế. Đó cũng là quy trình mà nhiều đội backend áp dụng cho những dự án có quy mô vừa và lớn.
