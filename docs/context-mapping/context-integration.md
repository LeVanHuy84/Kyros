# Context Integration Map

- **Document Version**: 1.0.0
- **Status**: Approved / Context Integration Baseline
- **Date**: 2026-08-01
- **Author**: Software Architect (Event-Driven & Hexagonal Architecture)
- **Sources**: `docs/architecture/architecture-v2.md`, `docs/context-mapping/context-discovery.md`, `docs/context-mapping/context-relationships.md`

---

## 1. Context Interaction Matrix

For every bounded context, the following dimensions are identified: Inbound Ports, Outbound Ports, Published Domain Events, Consumed Domain Events, Synchronous interactions, Asynchronous interactions, ACL boundaries, Tool Registry interactions, Connector interactions, Memory interactions, and Approval interactions.

### 1.1 Auth

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `AuthenticationGateway` (REST/SSE entry for login, registration, JWT verification) |
| **Outbound Ports** | None (Auth is a leaf; it calls Workspace for provisioning only) |
| **Published Domain Events** | None |
| **Consumed Domain Events** | None |
| **Synchronous interactions** | Calls `Workspace.provisionWorkspace()` during registration (AUTH-001); Gateway resolves `UserId`/`WorkspaceId` from session for all downstream requests |
| **Asynchronous interactions** | None |
| **ACL boundaries** | None (Auth is the identity source; no external translation needed) |
| **Tool Registry interactions** | None |
| **Connector interactions** | None |
| **Memory interactions** | None |
| **Approval interactions** | None |

### 1.2 Workspace

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `WorkspaceProvisioningPort` (provision workspace, manage membership); `TenantValidationPort` (validate `WorkspaceId` for downstream contexts) |
| **Outbound Ports** | None (Workspace is a leaf dependency) |
| **Published Domain Events** | None |
| **Consumed Domain Events** | None |
| **Synchronous interactions** | All downstream contexts call `TenantValidationPort` to resolve `WorkspaceId` on every request; Auth calls `WorkspaceProvisioningPort` on user registration |
| **Asynchronous interactions** | None |
| **ACL boundaries** | None |
| **Tool Registry interactions** | None |
| **Connector interactions** | None |
| **Memory interactions** | None |
| **Approval interactions** | None |

### 1.3 AI Agent

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `AgentCommandPort` (chat/streaming entry); `ApprovalRequestPort` (submit/resolve human approvals) |
| **Outbound Ports** | `LLMPort` (chat, tool-calling, embeddings); `MemoryStorePort` (query preferences/facts); `ConversationHistoryPort` (append/retrieve history); `ApprovalRequestPort` (submit approval requests — outbound from Agent to Notification/Workflow consumers) |
| **Published Domain Events** | `ApprovalRequested`; `ApprovalResolved`; `ToolExecuted` |
| **Consumed Domain Events** | `MemoryUpdated` (post-MVP, refresh active context) |
| **Synchronous interactions** | Calls `LLMPort` for inference; calls `MemoryStorePort`/`ConversationHistoryPort` for context; Tool Registry dispatches tool calls to `TodoPort`, `CalendarPort`, `NotesPort` via local adapters |
| **Asynchronous interactions** | Publishes `ApprovalRequested`, `ApprovalResolved`, `ToolExecuted` to in-process event bus; consumes `MemoryUpdated` (post-MVP) |
| **ACL boundaries** | LLM Adapter (`LLMPort`) isolates prompt/tool-calling formats from external LLM providers |
| **Tool Registry interactions** | **Exclusive gateway** — Agent never accesses storage directly. Tool Registry is the sole capability gateway. Tools are Agent-local adapters that wrap `TodoPort`, `CalendarPort`, `NotesPort`. Each tool declared with name, schema, permissions. Immutable audit log of `ToolExecuted` events. |
| **Connector interactions** | None direct; Agent reaches external capabilities only through Tool Registry adapters over productivity ports |
| **Memory interactions** | Agent **calls** Memory ports (`ConversationHistoryPort`, `MemoryStorePort`); Memory never imports Agent (AD-014). Agent reads history/preferences/facts synchronously; may consume `MemoryUpdated` asynchronously (post-MVP) |
| **Approval interactions** | Agent owns approval lifecycle: publishes `ApprovalRequested` before plan execution; publishes `ApprovalResolved` on decision; requires human approval for plan execution (AI-001) and email-task creation (CON-004); escalates after ≤3 reflection attempts (AI-003) |

### 1.4 Memory

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `ConversationHistoryPort` (append/retrieve/clear history); `MemoryStorePort` (persist/query preferences and semantic facts) |
| **Outbound Ports** | `SemanticSearchPort` (post-MVP, vector similarity queries) |
| **Published Domain Events** | `MemoryUpdated` |
| **Consumed Domain Events** | `TaskCompleted` (detect habits/update preferences); `WorkflowExecuted` (document automated actions); `NoteCreated` (when active, index semantic facts) |
| **Synchronous interactions** | Agent calls `ConversationHistoryPort` and `MemoryStorePort` synchronously for context retrieval and preference queries |
| **Asynchronous interactions** | Consumes `TaskCompleted`, `WorkflowExecuted`, `NoteCreated` (when active) via after-commit event handlers; publishes `MemoryUpdated` after state changes |
| **ACL boundaries** | None (Memory is internal; its `SemanticSearchPort` is an outbound port to infrastructure) |
| **Tool Registry interactions** | None (Memory is not an Agent tool target) |
| **Connector interactions** | None |
| **Memory interactions** | N/A (Memory is the context itself) |
| **Approval interactions** | None |

### 1.5 Todo

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `TodoPort` (task CRUD, priority, tags, filter/sort, soft-delete/recovery) |
| **Outbound Ports** | None (Todo is a leaf in the dependency graph; it depends only on Workspace and Shared Kernel) |
| **Published Domain Events** | `TaskCreated`; `TaskCompleted`; `TaskRecovered` |
| **Consumed Domain Events** | None |
| **Synchronous interactions** | Agent tool adapters call `TodoPort` methods synchronously; Workflow calls `TodoPort` (post-MVP); Connector calls `TodoPort` (post-MVP) |
| **Asynchronous interactions** | Publishes `TaskCreated`, `TaskCompleted`, `TaskRecovered` to in-process event bus; downstream consumers (Notification, Memory, Connector, Workflow) handle these asynchronously after commit |
| **ACL boundaries** | None |
| **Tool Registry interactions** | `TodoPort` is wrapped by a Tool Registry tool adapter for Agent access; the tool declares task-management schema and permissions |
| **Connector interactions** | Connector invokes `TodoPort` for task sync (post-MVP, CON-002/007); consumes `TaskCreated`, `TaskCompleted`, `TaskRecovered` to sync changes outwards |
| **Memory interactions** | Memory consumes `TaskCompleted` to detect habits and update preferences |
| **Approval interactions** | None directly; Agent may require approval before creating tasks via Tool Registry (AI-001 / CON-004) |

### 1.6 Calendar

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `CalendarPort` (event CRUD, overlap preference, reminder lead-time scheduling, availability querying, slot discovery) |
| **Outbound Ports** | `NotificationDispatchPort` (trigger immediate alerts for reminders) |
| **Published Domain Events** | `CalendarEventCreated`; `CalendarEventUpdated`; `CalendarEventConflictDetected` |
| **Consumed Domain Events** | None |
| **Synchronous interactions** | Agent tool adapters call `CalendarPort` methods synchronously; Workflow calls `CalendarPort` (post-MVP); Connector calls `CalendarPort` (post-MVP); Calendar calls `NotificationDispatchPort` synchronously for immediate reminder dispatch |
| **Asynchronous interactions** | Publishes `CalendarEventCreated`, `CalendarEventUpdated`, `CalendarEventConflictDetected` to in-process event bus; downstream consumers (Notification, Connector, Workflow) handle these asynchronously after commit |
| **ACL boundaries** | None (Calendar is internal; reminder dispatch goes through Notification's `NotificationDispatchPort`); external calendar providers accessed through Connector, never directly |
| **Tool Registry interactions** | `CalendarPort` is wrapped by a Tool Registry tool adapter for Agent access; the tool declares calendar-management schema and permissions, including availability and slot queries |
| **Connector interactions** | Connector invokes `CalendarPort` for calendar sync (post-MVP, CON-002); consumes `CalendarEventCreated`, `CalendarEventUpdated`, `CalendarEventConflictDetected` to sync outwards |
| **Memory interactions** | Queries `MemoryStorePort` for `preventCalendarOverlap` preference and scheduling constraints (working hours, minimum notice) during availability/slot computation |
| **Approval interactions** | None directly; Agent may require approval before creating calendar events via Tool Registry (AI-001) |

### 1.7 Notes (Reserved / Inactive)

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `NotesPort` (document CRUD, indexing — when activated) |
| **Outbound Ports** | `SemanticSearchPort` (when activated, for RAG grounding) |
| **Published Domain Events** | `NoteCreated` (when activated) |
| **Consumed Domain Events** | None (when activated, may consume domain events from Memory for indexing triggers) |
| **Synchronous interactions** | Agent RAG tool adapters call `NotesPort` synchronously (when active); Connector calls `NotesPort` for Notion sync (when active) |
| **Asynchronous interactions** | Publishes `NoteCreated` when activated; Memory consumes `NoteCreated` for semantic indexing when activated |
| **ACL boundaries** | None (Notes is internal; its `SemanticSearchPort` is an outbound port to vector store infrastructure) |
| **Tool Registry interactions** | `NotesPort` will be wrapped by a Tool Registry tool adapter for Agent RAG access (when active) |
| **Connector interactions** | Connector invokes `NotesPort` for Notion document sync (when active, CON-006) |
| **Memory interactions** | Memory consumes `NoteCreated` events for semantic indexing (when active) |
| **Approval interactions** | None directly |

### 1.8 Workflow

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `WorkflowExecutionPort` (trigger/execute automation rules) |
| **Outbound Ports** | `TodoPort` (create/complete tasks); `CalendarPort` (schedule meetings); `NotificationDispatchPort` (dispatch alerts on failure/action) |
| **Published Domain Events** | `WorkflowExecuted` |
| **Consumed Domain Events** | `ApprovalRequested`; `ApprovalResolved` (post-MVP, resume workflows on approval resolution) |
| **Synchronous interactions** | Calls `TodoPort`, `CalendarPort`, `NotificationDispatchPort` synchronously when executing rules |
| **Asynchronous interactions** | Publishes `WorkflowExecuted` to in-process event bus; consumes `ApprovalRequested`/`ApprovalResolved` asynchronously after commit (post-MVP) |
| **ACL boundaries** | None (Workflow is internal; it calls productivity ports directly) |
| **Tool Registry interactions** | None (Workflow does not go through the Tool Registry; it calls ports directly) |
| **Connector interactions** | None direct (Connector is independent of Workflow per the relationship matrix) |
| **Memory interactions** | Memory consumes `WorkflowExecuted` events to document automated actions in conversation history |
| **Approval interactions** | Consumes `ApprovalRequested`/`ApprovalResolved` events (post-MVP) to resume or trigger workflow steps on approval resolution |

### 1.9 Connector

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `ConnectorLifecyclePort` (register, authorize, enable/disable connectors); `ExternalProviderPort` (provider capability SPI for plugins) |
| **Outbound Ports** | `TodoPort` (task sync); `CalendarPort` (calendar sync); `NotesPort` (when active, document sync); `NotificationDispatchPort` (sync failure alerts); `CredentialVaultPort` (encrypted credential IO) |
| **Published Domain Events** | `ConnectorSynced`; `ConnectorSyncFailed` |
| **Consumed Domain Events** | `TaskCreated`; `TaskCompleted`; `TaskRecovered`; `CalendarEventCreated`; `CalendarEventUpdated`; `CalendarEventConflictDetected` |
| **Synchronous interactions** | Calls `TodoPort`, `CalendarPort`, `NotesPort`, `NotificationDispatchPort`, `CredentialVaultPort` synchronously during sync orchestration |
| **Asynchronous interactions** | Publishes `ConnectorSynced`/`ConnectorSyncFailed` to in-process event bus; consumes productivity events (`TaskCreated`, etc.) asynchronously after commit to trigger outbound sync |
| **ACL boundaries** | **Connector Hub Adapters** — the primary ACL. Translates external SaaS models (Google Calendar events, TickTick tasks, Notion documents, Slack messages, email) into internal ports/events. Isolates provider SDKs behind `ExternalProviderPort` plugin SPI. Only Connector and Notification channel adapters may import external provider SDKs. |
| **Tool Registry interactions** | None (Connector does not use the Tool Registry; it calls productivity ports directly) |
| **Connector interactions** | N/A (Connector is the context itself; it owns the Hub and provider adapters) |
| **Memory interactions** | None |
| **Approval interactions** | None directly; may trigger `NotificationDispatchPort` for critical sync failures requiring human attention |

### 1.10 Notification

| Dimension | Detail |
| --- | --- |
| **Inbound Ports** | `NotificationDispatchPort` (dispatch messages with urgency + template data) |
| **Outbound Ports** | Channel adapters (in-app, email, Slack) — driven adapters behind `NotificationDispatchPort` |
| **Published Domain Events** | `NotificationRendered` |
| **Consumed Domain Events** | `TaskCreated`; `TaskRecovered`; `CalendarEventCreated`; `CalendarEventUpdated`; `CalendarEventConflictDetected`; `ConnectorSynced`; `ConnectorSyncFailed`; `ApprovalRequested`; `ApprovalResolved`; `WorkflowExecuted` |
| **Synchronous interactions** | Calls channel adapters (in-app, email, Slack) synchronously during dispatch; Calendar calls `NotificationDispatchPort` synchronously for immediate reminders |
| **Asynchronous interactions** | Consumes all productivity/approval/connector events asynchronously after commit to queue/schedule notifications; publishes `NotificationRendered` after rendering |
| **ACL boundaries** | **Notification Channel Adapters** — shield the dispatch service from SMTP/Email, Slack API, and WebSocket protocol details. Channel adapters are driven adapters behind `NotificationDispatchPort`. |
| **Tool Registry interactions** | None |
| **Connector interactions** | Connector calls `NotificationDispatchPort` for critical sync failure alerts; Notification consumes `ConnectorSynced`/`ConnectorSyncFailed` events |
| **Memory interactions** | None (Notification applies channel rules at dispatch; preference storage is owned by Memory) |
| **Approval interactions** | Consumes `ApprovalRequested`/`ApprovalResolved` events to notify users of approval requirements and outcomes; owns urgency-gated Slack routing (Urgent/Critical only, AD-012) |

---

## 2. Event Matrix

| Event | Producer | Synchronous Consumers | Asynchronous Consumers (after-commit) |
| --- | --- | --- | --- |
| `TaskCreated` | Todo | — | Workflow, Notification, Connector |
| `TaskCompleted` | Todo | — | Workflow, Memory |
| `TaskRecovered` | Todo | — | Notification, Connector |
| `CalendarEventCreated` | Calendar | — | Workflow, Notification, Connector |
| `CalendarEventUpdated` | Calendar | — | Notification, Connector |
| `CalendarEventConflictDetected` | Calendar | — | Notification, Connector |
| `NoteCreated` | Notes (when active) | — | Memory (indexing) |
| `WorkflowExecuted` | Workflow (post-MVP) | — | Notification, Memory |
| `MemoryUpdated` | Memory | — | AI Agent (context refresh, post-MVP) |
| `NotificationRendered` | Notification | — | Audit |
| `ConnectorSynced` | Connector | — | Notification, Audit |
| `ConnectorSyncFailed` | Connector | — | Notification, Audit |
| `ApprovalRequested` | AI Agent | — | Notification, Workflow (post-MVP), Audit |
| `ApprovalResolved` | AI Agent | — | Notification, Workflow (post-MVP), Audit |
| `ToolExecuted` | AI Agent | — | Audit |

**Semantics**: Failed handlers retry with bounds; bus is replaceable by a broker without domain changes. All payloads are IDs + VOs only (no domain model leakage across context boundaries).

---

## 3. Port Matrix

| Port | Direction | Owning Context | Consumers (downstream) | Protocol / Mechanism |
| --- | --- | --- | --- | --- |
| `AgentCommandPort` | Inbound | AI Agent | Presentation (REST/SSE chat gateway) | Synchronous, in-process |
| `ApprovalRequestPort` | Inbound | AI Agent | Notification, Workflow (post-MVP) | Synchronous (submit); Asynchronous (event consumption) |
| `TodoPort` | Inbound | Todo | AI Agent (Tool Registry adapters), Workflow, Connector | Synchronous, in-process |
| `CalendarPort` | Inbound | Calendar | AI Agent (Tool Registry adapters), Workflow, Connector | Synchronous, in-process |
| `NotesPort` | Inbound | Notes (reserved) | AI Agent (RAG tool adapters, when active), Connector (Notion sync, when active) | Synchronous, in-process |
| `WorkflowExecutionPort` | Inbound | Workflow | Presentation (scheduler/trigger API, post-MVP) | Synchronous, in-process |
| `NotificationDispatchPort` | Inbound | Notification | Calendar, Workflow, Connector, AI Agent (approval alerts) | Synchronous (immediate dispatch); Asynchronous (event-driven queuing) |
| `ConnectorLifecyclePort` | Inbound | Connector | Presentation (admin API) | Synchronous, in-process |
| `ConversationHistoryPort` | Inbound | Memory | AI Agent | Synchronous, in-process |
| `MemoryStorePort` | Inbound | Memory | AI Agent | Synchronous, in-process |
| `SemanticSearchPort` | Outbound | Memory / Notes (infrastructure) | Memory, Notes | Synchronous, in-process (infrastructure implementation) |
| `CredentialVaultPort` | Outbound | Connector (infrastructure) | Connector | Synchronous, in-process (infrastructure implementation) |
| `ExternalProviderPort` | Outbound | Connector (infrastructure) | Provider SDKs (Google, Outlook, Slack, Notion, etc.) | Synchronous, in-process (plugin SPI) |
| `LLMPort` | Outbound | AI Agent (infrastructure) | LLM providers (OpenAI, etc.) | Synchronous, in-process (adapter) |
| `NotificationDispatchPort` | Outbound (from Calendar, Workflow, Connector) | Notification | Channel adapters (in-app, email, Slack) | Synchronous (immediate); Asynchronous (scheduled) |
| `TodoPort` | Outbound (from Workflow, Connector) | Todo | — | Synchronous, in-process |
| `CalendarPort` | Outbound (from Workflow, Connector) | Calendar | — | Synchronous, in-process |
| `NotesPort` | Outbound (from Connector) | Notes | — | Synchronous, in-process |

---

## 4. Communication Rules

### 4.1 General Principles

1. **Hexagonal layering is mandatory.** Every context follows Presentation → Application → Domain ← Infrastructure. Domain never depends on Infrastructure.
2. **Modules collaborate only via inbound ports or domain events.** No module imports another module's internal services, repositories, or domain models.
3. **Shared Kernel is the only shared code dependency.** It contains immutable VOs (`WorkspaceId`, `UserId`, RFC 5545 Recurrence Pattern), ID types, and domain event contracts. It is a leaf — it depends on nothing.
4. **In-process event bus uses after-commit dispatch.** Events are published within a transaction and handlers run after commit. Payloads are IDs + VOs only.
5. **The event bus is replaceable.** The same JSON payloads defined in Shared Kernel can be published to an external broker (RabbitMQ/Kafka) without domain changes.
6. **Workspace scoping is enforced at the gateway.** Every request carries a resolved `WorkspaceId`; downstream contexts use it to filter data and enforce tenant isolation.
7. **Tool Registry is the exclusive gateway for AI Agent capability execution.** The Agent never accesses persistence directly.

### 4.2 Synchronous Communication Rules

| Source → Target | Mechanism | Constraint |
| --- | --- | ---|
| Auth → Workspace | `WorkspaceProvisioningPort` call | Only during registration (AUTH-001) |
| Any context → Workspace | `TenantValidationPort` call | On every request, via gateway security context |
| AI Agent → LLMPort | `LLMPort` call | Agent-only; isolated behind LLM Adapter ACL |
| AI Agent → Memory | `ConversationHistoryPort`, `MemoryStorePort` | Read-only for preferences/history; no Memory→Agent reverse dependency |
| AI Agent → Todo/Calendar/Notes | Tool Registry → `TodoPort`/`CalendarPort`/`NotesPort` | Only via tool adapters; never direct imports |
| Workflow → Todo/Calendar/Notification | `TodoPort`, `CalendarPort`, `NotificationDispatchPort` | Post-MVP only; via inbound ports |
| Connector → Todo/Calendar/Notes | `TodoPort`, `CalendarPort`, `NotesPort` | Post-MVP only; via inbound ports |
| Connector → Notification | `NotificationDispatchPort` | For critical sync failure alerts |
| Calendar → Notification | `NotificationDispatchPort` | For immediate reminder dispatch |
| Connector → CredentialVaultPort | `CredentialVaultPort` | Only for encrypted credential IO |

### 4.3 Asynchronous Communication Rules

| Event | Producer → Consumer | Constraint |
| --- | --- | --- |
| `TaskCreated` | Todo → Workflow, Notification, Connector | After-commit; consumers act independently |
| `TaskCompleted` | Todo → Workflow, Memory | After-commit |
| `TaskRecovered` | Todo → Notification, Connector | After-commit |
| `CalendarEventCreated` | Calendar → Workflow, Notification, Connector | After-commit |
| `CalendarEventUpdated` | Calendar → Notification, Connector | After-commit |
| `CalendarEventConflictDetected` | Calendar → Notification, Connector | After-commit |
| `NoteCreated` | Notes → Memory | After-commit (when active) |
| `WorkflowExecuted` | Workflow → Notification, Memory | After-commit (post-MVP) |
| `MemoryUpdated` | Memory → AI Agent | After-commit (post-MVP) |
| `ApprovalRequested` | AI Agent → Notification, Workflow | After-commit |
| `ApprovalResolved` | AI Agent → Notification, Workflow | After-commit |
| `ConnectorSynced` / `ConnectorSyncFailed` | Connector → Notification, Audit | After-commit |
| `ToolExecuted` | AI Agent → Audit | After-commit |
| `NotificationRendered` | Notification → Audit | After-commit |

### 4.4 ACL Communication Rules

| ACL | Shields | Translates |
| --- | --- | --- |
| Connector Hub Adapters | Internal productivity domains from external SaaS models | Google Calendar events → `CalendarPort` calls; TickTick tasks → `TodoPort` calls; Notion documents → `NotesPort` calls |
| LLM Adapter | AI Agent domain from LLM provider specifics | Prompt formats, tool-calling JSON, proprietary responses → `LLMPort` interface |
| Notification Channel Adapters | Notification dispatch from channel protocols | Generic message → SMTP/Email, Slack API, WebSocket payloads |
| Credential Vault Adapter | Connector from KMS/storage specifics | Encrypted credential IO → `CredentialVaultPort` interface |

### 4.5 Phasing Rules

- **MVP contexts** (active in Domain Modeling): Auth, Workspace, Todo, Calendar, Notification, Memory, AI Agent, Connector (hub+SPI only), Shared Kernel.
- **Full / deferred contexts**: Workflow, Notes (reserved/inactive), Memory semantic (MEM-003), AI Agent RAG (AI-004), Connector providers (CON-002..007), Notification email reports (NOTIF-002).
- Relationships marked with `*` in the event matrix and port matrix are post-MVP and must not be implemented until the corresponding context is active.
- Notes context is **reserved and inactive** — no implementation until Notes domain stories are approved (AD-013).

---

## 5. Forbidden Dependencies

The following dependencies are **structurally forbidden** and enforced via ArchUnit tests in CI:

| # | Rule | Severity | Rationale | Reference |
| --- | --- | --- | --- | --- |
| FD-01 | **Memory ↛ AI Agent** | Critical | Memory must never import agent classes, ports, or logic. Semantic extraction and conversation appending are driven inward by the AI Agent calling Memory ports or via background workers subscribing to events. | AD-014 |
| FD-02 | **AI Agent ↛ Productivity Internals** | High | The AI Agent must never import domain classes, repositories, or services of Todo, Calendar, or Notes. It interacts with these domains only via tool adapters executing in the Tool Registry, which call their respective public inbound ports. | AD-016 |
| FD-03 | **Workflow / Connector ↛ Productivity Internals** | High | Workflow and Connector must communicate with Todo, Calendar, and Notes only via inbound ports (`TodoPort`, `CalendarPort`, `NotesPort`) or by subscribing to domain events. They must never directly import internal services or access foreign schemas. | AD-015 |
| FD-04 | **Zero Cross-Context Database Sharing** | Critical | No module may read or write another module's database schema. Data federation must happen at the Application layer via ports or after-commit events. | AD-002, AD-015 |
| FD-05 | **No External SDK Leakage** | Medium | Only the Connector Hub (and Notification channel adapters) may import external provider SDKs (Slack, Gmail, Google Calendar, etc.). All other domains remain completely isolated from vendor APIs. | AD-008 |
| FD-06 | **Shared Kernel ↛ Any Context** | High | The Shared Kernel is a leaf dependency. It must contain only immutable VOs, ID types, and integration event contracts. It must not depend on any context. | AD-002 |
| FD-07 | **Domain ↛ Infrastructure** | Critical | The Domain layer must never depend on Infrastructure. Hexagonal layering requires Domain ← Infrastructure. Implementers must not leak JPA/Spring into the domain. | AD-002, ISS-01 |
| FD-08 | **No Sideways Concrete Dependencies** | High | Modules must not depend on other modules' concrete implementations. All sideways collaboration must go through inbound ports or domain events. | AD-015 |
| FD-09 | **Notes Context Inactive** | Medium | The Notes context must not be implemented or activated until Notes domain stories are approved. It must not be merged into Memory. | AD-013 |
| FD-10 | **Calendar Recurrence Ownership** | Medium | Calendar does not own recurrence behavior. Recurrence is a Todo concern (TODO-003) using the Shared Kernel RFC 5545 VO. Calendar may reference the VO but must not implement recurrence logic. | AD-011 |
| FD-11 | **Notification Owns Urgency/Channel Routing** | Medium | Urgency-gated channel routing (e.g., Slack Urgent/Critical only) is owned by Notification, not by Connector Hub. Connector adapters are driven channels. | AD-012 |
| FD-12 | **No Framework Types in Domain** | High | The Domain layer must remain framework-agnostic. No Spring, JPA, or persistence annotations in domain packages. | AD-002 |

---

**End of document.** This document is the single source of truth for context integration in the AI Executive Assistant modular monolith. All domain modeling work must conform to these interaction rules, port contracts, and forbidden dependency constraints.