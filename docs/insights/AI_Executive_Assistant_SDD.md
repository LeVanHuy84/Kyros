# AI Executive Assistant

## Software Design Document (SDD)

> Mục tiêu: Xây dựng một project cá nhân theo chuẩn production nhằm nâng
> cao kỹ năng Java Backend và tích hợp AI Agent.

---

# 1. Mục tiêu

## Technical Goals

- Java 25 + Spring Boot 3
- Modular Monolith
- Hexagonal Architecture
- DDD Lite
- Spring AI
- PostgreSQL
- Redis
- pgvector hoặc Qdrant
- Docker Compose
- Testcontainers
- CI/CD
- Observability

## AI Goals

- Tool Calling
- Agent Workflow
- Memory
- RAG
- Planning
- Reflection
- Streaming Response

---

# 2. Tổng quan

AI Executive Assistant là trợ lý cá nhân có khả năng:

- quản lý Todo
- quản lý Calendar
- ghi chú
- quản lý Workflow
- chat với AI
- lập kế hoạch
- tự động gợi ý công việc
- trả lời dựa trên dữ liệu cá nhân

AI không truy cập DB trực tiếp mà thông qua Tool.

---

# 3. Kiến trúc

    Frontend

    ↓

    Spring Boot

    ↓

    Modules

    - Auth
    - User
    - Todo
    - Calendar
    - Note
    - Workflow
    - AI Agent
    - Memory
    - Notification

    ↓

    PostgreSQL
    Redis
    Vector DB

## Kiểu kiến trúc

- Modular Monolith
- Hexagonal Architecture
- DDD Lite
- Event Driven (Spring Events)

Không dùng Microservice ở giai đoạn đầu.

---

# 4. Module

## Auth

- JWT
- Refresh Token
- RBAC

## User

- Profile
- Settings

## Todo

- CRUD
- Priority
- Deadline
- Tag
- Recurring

## Calendar

- Event
- Reminder
- Sync

## Notes

- Markdown
- Search

## Workflow

- Trigger
- Action
- Scheduler

## Notification

- Email
- In-app

## Memory

- Conversation
- User Preference
- Long-term Memory

## AI Agent

- Chat
- Planner
- Executor
- Reflection

---

# 5. AI Agent

    User

    ↓

    Planner

    ↓

    Reasoning

    ↓

    Tool Registry

    ↓

    Tool Execute

    ↓

    Memory

    ↓

    LLM

    ↓

    Answer

## Tools

- TodoTool
- CalendarTool
- NoteTool
- SearchTool
- WorkflowTool
- GitHubTool

---

# 6. Database

Các bảng chính

- users
- todos
- todo_tags
- calendars
- notes
- workflows
- workflow_runs
- conversations
- memories
- notifications

---

# 7. API

- Auth API
- Todo API
- Calendar API
- Note API
- Workflow API
- AI Chat API
- Memory API

Streaming bằng SSE.

---

# 8. Event

- TaskCreated
- TaskCompleted
- CalendarEventCreated
- WorkflowExecuted
- MemoryUpdated

Sử dụng Spring ApplicationEventPublisher.

---

# 9. Design Patterns

- Strategy (LLM Provider)
- Factory (Agent Factory)
- Command (Tool Execution)
- Observer (Events)
- State (Workflow)
- Builder
- Repository
- Specification
- Adapter
- CQRS (Light)
- Dependency Injection

---

# 10. Công nghệ

- Java 25
- Spring Boot 3
- Spring AI
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis
- Flyway
- Docker Compose
- Testcontainers
- Micrometer
- Prometheus
- Grafana
- OpenAPI

---

# 11. Roadmap

## Phase 1

- Auth
- User
- Todo
- Calendar

## Phase 2

- Note
- Workflow
- Notification

## Phase 3

- AI Chat
- Tool Calling
- Memory

## Phase 4

- RAG
- Planner
- Reflection

## Phase 5

- Monitoring
- Testing
- Deployment

---

# 12. Mục tiêu học được

- Clean Architecture
- DDD Lite
- Spring Boot Production
- AI Agent
- Tool Calling
- RAG
- Event Driven
- Docker
- Redis
- PostgreSQL
- Testing
- CI/CD
- Observability

---

# 13. Hướng mở rộng

- Mobile App
- MCP Server
- Multi-Agent
- Voice Assistant
- GitHub Integration
- Email Integration
- Google Calendar
- Slack
- Outlook
- Kubernetes Deployment
