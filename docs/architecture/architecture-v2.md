# Version Information

- **Document Version**: 2.0.0
- **Status**: Approved / Ready for Domain Modeling
- **Date**: 2026-08-01
- **Author**: Architecture Review Agent
- **Sources**: `docs/requirements/user-stories-v2.md`, `docs/architecture/architecture.md`, `docs/architecture/domain-boundaries.md`

---

# Change Log

| Version | Date       | Author                      | Description of Changes |
| ------- | ---------- | --------------------------- | ---------------------- |
| 1.0.0   | 2026-07-31 | Architecture Agent          | Initial modular-monolith / hexagonal architecture. |
| 1.0.0   | 2026-07-31 | Domain Architect            | Domain boundaries, bounded contexts, ACLs. |
| 2.0.0   | 2026-08-01 | Architecture Review Agent   | Architecture review against requirements and domain boundaries. Resolved Notes/Memory boundary conflict, hexagonal layering contradiction, dependency-direction issues, naming drift, MVP phasing, and Notification vs Connector urgency ownership. Produced final architecture ready for Domain Modeling. |

---

# Architecture Review Summary

The v1 architecture (modular monolith, hexagonal per module, Tool Registry as exclusive agent gateway, Connector Hub ACL, workspace tenancy) is sound and aligns with the product’s AI-first, security-first intent. It covers all MVP stories and most future stories without inventing new product scope.

The review found **no need to redesign the product or change the architectural style**. Issues are concentrated in:

1. **Boundary drift** between `architecture.md` and `domain-boundaries.md` (Notes vs Memory; Memory → AI Agent cycle).
2. **A contradictory layering rule** that stated Domain depends on Infrastructure while hexagonal rules correctly invert that.
3. **Sideways coupling** expressed as module-to-module concrete dependencies (Workflow/Connector → Todo/Calendar/Notes) instead of ports and events.
4. **Naming inconsistency** across Auth/IAM, Agent/Cognitive, Notes/Knowledge, and calendar `Event*` domain-event names.
5. **Phasing gaps**: Notes and full connector suite are described as first-class active modules while requirements mark Notes as pending and most connectors as future.
6. **Minor ownership conflicts**: Slack urgency gating (Connector Hub vs Notification); Calendar recurrence claimed without a Calendar recurrence story.

These are corrected below. The Final Architecture section is the single source of truth for Domain Modeling.

---

# Issues

Issues are ordered by severity. Each cites evidence and impact. No new business requirements are introduced.

## ISS-01 — Layer dependency rule contradicts hexagonal inversion (Critical)

- **Where**: `architecture.md` Layered Architecture (“each layer may depend only on the layers below it” with order Presentation → Application → Domain → Infrastructure) vs Dependency Rules AD (“Domain and Application define ports; Infrastructure implements them”).
- **Why**: The stack as written implies Domain → Infrastructure. Hexagonal requires Domain ← Infrastructure. Implementers following the stack literally will leak JPA/Spring into the domain.
- **Impact**: Breaks hexagonal compliance and testability.

## ISS-02 — Notes owned by two conflicting boundaries (Critical)

- **Where**: `architecture.md` Module List treats **Notes (Knowledge)** as a separate module; `domain-boundaries.md` Candidate Bounded Contexts fold Notes into **Context & Memory Context**.
- **Why**: Dual ownership of schema and RAG indexing will produce conflicting models and unclear module extraction seams.
- **Impact**: Cohesion and naming consistency failure; Domain Modeling cannot proceed safely.
- **Requirements note**: Notes CRUD is a **Pending Requirement** in `user-stories-v2.md`. Architecture must reserve the boundary without treating Notes as an active delivered domain.

## ISS-03 — Memory → AI Agent dependency creates a cycle (High)

- **Where**: Module List — Memory “Allowed Dependencies” includes “AI Agent (contracts only)”. Domain boundaries state Memory depends only on Workspace and Shared Kernel. AI Agent already depends on Memory.
- **Why**: Bidirectional module dependency undermines dependency direction and extraction. Semantic extraction can be triggered by events or an inbound port on Memory without Memory knowing the Agent.
- **Impact**: Coupling; circular package imports; ArchUnit will fail or be weakened.

## ISS-04 — Workflow and Connector listed as depending on concrete productivity modules (High)

- **Where**: Module List — Workflow depends on Todo, Calendar, Notification; Connector depends on Todo, Calendar, Notes, Notification.
- **Why**: Sideways concrete dependencies conflict with “modules communicate only through ports or domain events.” Actions and sync should call **inbound ports** of those modules (or publish commands/events), not import their internals.
- **Impact**: Weak hexagonal compliance; harder connector/workflow extensibility.

## ISS-05 — AI Agent Allowed Dependencies omit tool targets / overstate Notes (High)

- **Where**: AI Agent Allowed Dependencies: “Workspace, Tool Registry (in-module), Memory, Notes, Shared Kernel”.
- **Why**: Agent must reach Todo/Calendar via tools (MVP) but those are missing from the table; Notes is not an MVP requirement. The correct rule is: Agent depends on **Tool Registry + LLM/Memory/Approval ports only**; tools are adapters that call other modules’ ports.
- **Impact**: Misleading dependency graph for ArchUnit and onboarding.

## ISS-06 — Calendar module claims recurrence without a Calendar recurrence story (Medium)

- **Where**: Calendar responsibility includes “recurrence”; AD-011 ties RFC 5545 to “Todo/Calendar domain”. Requirements: recurrence is **TODO-003** only; CAL stories cover CRUD, overlap, reminders.
- **Why**: Architecture introduces Calendar recurrence behavior not present in approved stories.
- **Impact**: Requirement coverage overreach; Domain Modeling may invent Calendar recurrence aggregates prematurely.

## ISS-07 — Slack urgency ownership split between Connector Hub and Notification (Medium)

- **Where**: AD-012 “enforced at the hub”; CON-005 / NOTIF-001 place urgency and channel preference in notification routing; domain boundaries put channel selection in Notification.
- **Why**: Two owners for one rule. Urgency-gated routing is a Notification concern; Slack adapter is a delivery channel.
- **Impact**: Duplicated or conflicting filtering; connector extensibility noise.

## ISS-08 — Naming drift across documents (Medium)

| Concept | Variants found |
| --- | --- |
| Identity | Auth / Authentication / Identity & Access Management (IAM) |
| Agent | AI Agent / Cognitive Agent & Orchestration / Cognitive Orchestration Context |
| Notes | Notes (Knowledge) / Knowledge Management / Knowledge Base |
| Memory | Memory / Context & Semantic Memory / Context & Memory Context |
| Connector | Connector / Connector Hub / External Connector Integration Domain |
| Calendar events | Calendar Event (glossary) vs domain events named `EventCreated` |

- **Impact**: Ambiguous package/module names; confused event catalog (`EventCreated` reads as a generic domain event).

## ISS-09 — Full-system architecture not phased against MVP (Medium)

- **Where**: Overview and Module List present Workflow, Notes, RAG, and all provider connectors as peer capabilities.
- **Why**: MVP set is AUTH, TODO-001/002, CAL-001/002, NOTIF-001, MEM-001/002, AI-001/002/003, CON-001. Workflow, AI-004, MEM-003, CON-002..007, NOTIF-002, Notes are future/pending.
- **Impact**: Teams may build non-MVP modules first or assume Notes/RAG are in scope for Domain Modeling now.

## ISS-10 — Credential / connection management is port-level only (Low — accepted)

- **Where**: Pending Requirement “External Connection and Credential Management”; architecture exposes `ConnectorLifecyclePort` and `CredentialVaultPort`.
- **Why**: Ports correctly anticipate the capability without inventing UI/product stories. Residual gap is requirements-owned, not architecture-owned.
- **Impact**: Acceptable for architecture; Domain Modeling must not invent OAuth UX beyond port contracts.

## ISS-11 — AI-004 → NOTIF-001 dependency unexplained in architecture (Low)

- **Where**: Requirements dependency graph; architecture event/ports do not explain RAG needing Notification.
- **Why**: Likely incidental requirements coupling. Architecture need not wire Notification into RAG.
- **Impact**: Ignore for module deps; do not add Agent/RAG → Notification dependency.

---

# Recommendations

1. **Adopt true hexagonal layering**: Presentation → Application → Domain ← Infrastructure. Remove any wording that Domain depends “downward” into Infrastructure.
2. **Keep Notes as a separate reserved Supporting module/context**, not merged into Memory. Mark it **Deferred / Placeholder** until Notes stories exist. Memory owns conversation, preferences, semantic facts only.
3. **Break Memory ↔ Agent cycle**: Memory never depends on Agent. Extraction is driven by Agent (or a worker) calling Memory inbound ports, or by consuming domain events.
4. **Express sideways collaboration only via inbound ports and domain events.** Workflow actions and Connector sync call `TodoPort`, `CalendarPort`, `NotificationDispatchPort`, etc.; they do not depend on module internals.
5. **Agent isolation rule**: Agent → Tool Registry, `LLMPort`, Memory ports, `ApprovalRequestPort` only. Tools are Agent-local adapters over other modules’ ports.
6. **Calendar scope to requirements**: scheduling CRUD, overlap preference, reminder lead-time. RFC 5545 recurrence lives in Todo (TODO-003); share the recurrence value object via Shared Kernel for future Calendar use without claiming Calendar recurrence now.
7. **Notification owns urgency and channel routing**; Connector Slack/Email adapters are driven notification channels (and separately sync/command connectors where applicable).
8. **Canonical module names** (see Final Architecture). Rename calendar lifecycle events to `CalendarEventCreated` / `CalendarEventUpdated` / `CalendarEventConflictDetected`.
9. **Document MVP vs Full module sets** so Domain Modeling prioritizes MVP aggregates first.
10. **Preserve** modular monolith, in-process after-commit events, Tool Registry exclusivity, human-in-the-loop approval, Connector Hub translation, workspace tenancy, Credential Vault — these decisions stand.

---

# Revised Architecture Decisions

| # | Decision | Status | Rationale |
| --- | --- | --- | --- |
| **AD-001** | Modular Monolith rather than Microservices | **Confirmed** | Security auditability and velocity; hexagonal seams preserve extraction. |
| **AD-002** | Hexagonal (Ports & Adapters) per module | **Confirmed + clarified** | Layer rule corrected: Domain ← Infrastructure. |
| **AD-003** | In-process event bus with after-commit dispatch | **Confirmed** | Loose coupling without broker; swappable later. |
| **AD-004** | Tool Registry as exclusive agent capability gateway | **Confirmed** | Agent never touches persistence; audit + permissions. |
| **AD-005** | Explicit human approval for plan execution and email-task creation | **Confirmed** | AI-001, CON-004. |
| **AD-006** | Hard 3-attempt reflection limit with user escalation | **Confirmed** | AI-003. |
| **AD-007** | RAG grounding with mandatory citations and "I do not know" | **Confirmed (post-MVP)** | AI-004; requires Notes capability + semantic search. |
| **AD-008** | Connector Hub with model translation (ACL) | **Confirmed** | CON-001; provider SDKs stay behind adapters. |
| **AD-009** | Workspace-scoped multi-tenancy | **Confirmed** | AUTH-001; gateway + per-port revalidation. |
| **AD-010** | Credential Vault with encryption at rest | **Confirmed** | Supports pending connection-management requirements via ports. |
| **AD-011** | RFC 5545 recurrence value object in Shared Kernel; **Todo owns recurrence behavior (TODO-003)** | **Revised** | Remove Calendar recurrence responsibility until a Calendar story exists. |
| **AD-012** | Urgency-gated channel routing owned by **Notification**; Slack/Email are channel adapters | **Revised** | Aligns with NOTIF-001 / CON-005; Connector Hub does not own urgency policy. |
| **AD-013** | Notes is a **reserved separate bounded context**, deferred until Notes stories are approved | **New** | Resolves ISS-02; does not invent Notes requirements. |
| **AD-014** | Memory has **no dependency** on AI Agent | **New** | Resolves ISS-03; Agent/workers call Memory ports. |
| **AD-015** | Sideways module collaboration **only** via inbound application ports or domain events | **New** | Resolves ISS-04; Workflow/Connector depend on ports, not concrete modules. |
| **AD-016** | AI Agent depends only on Tool Registry + cognitive ports (`LLMPort`, Memory ports, Approval); tools adapt foreign ports | **New** | Resolves ISS-05; AI-first isolation. |
| **AD-017** | Canonical naming for modules and calendar domain events | **New** | Resolves ISS-08. |
| **AD-018** | Architecture is phased: **MVP modules** vs **Full modules** | **New** | Resolves ISS-09; guides Domain Modeling order. |

### Deferred Decisions (unchanged — implementation phase)

- Vector store: pgvector vs Qdrant (`SemanticSearchPort`).
- Sync conflict default policy (when connectors ship).
- Scheduler implementation for Workflow (Quartz / Spring / DbScheduler).
- LLM context-window compaction tactics.

---

# Final Architecture

This section replaces `architecture.md` as the architecture baseline for Domain Modeling. Domain classification remains as in `domain-boundaries.md`, with Notes/Memory and naming corrections applied here.

---

## 1. Architecture Overview

The **AI Executive Assistant** is a **Modular Monolith** with **Hexagonal (Ports & Adapters)** boundaries per module, **DDD Lite** ownership, and **in-process event-driven** collaboration. It deploys as one Spring Boot application; the codebase is partitioned so each module owns its domain model, application services, persistence schema, and public ports.

Product surfaces:

1. **Productivity domains** — Todo, Calendar; Notes reserved (deferred).
2. **Cognitive core** — AI Agent (plan → approve → tool execute → reflect).
3. **Context & memory** — Conversation History, User Preferences; Long-Term Semantic Memory post-MVP.
4. **Connector Hub** — ACL translating external providers into internal ports/events.
5. **Automation** — Workflow (post-MVP).
6. **Cross-cutting** — Auth, Workspace, Notification, Approval Flow (inside Agent).

All data and execution are **Workspace-scoped**. The Agent never accesses storage directly; it uses only the **Tool Registry**.

---

## 2. Architectural Style

**Modular Monolith + Hexagonal modules + internal domain events.**

Why it fits:

- Single process simplifies workspace isolation, Tool Registry enforcement, and audit.
- Hexagonal seams allow later extraction without rewriting domains.
- In-process events (`ApplicationEventPublisher`, after-commit) decouple Workflow, Notification, Connector, and Memory reactions without a broker in phase one.
- Matches MVP velocity while preserving connector and tool extensibility.

---

## 3. Phasing (MVP vs Full)

### MVP modules (Domain Modeling priority)

| Module | Stories |
| --- | --- |
| Auth | AUTH-001 (identity slice) |
| Workspace | AUTH-001 (tenancy slice) |
| Todo | TODO-001, TODO-002 |
| Calendar | CAL-001, CAL-002 |
| Notification | NOTIF-001 |
| Memory | MEM-001, MEM-002 |
| AI Agent | AI-001, AI-002, AI-003 |
| Connector | CON-001 (hub + plugin SPI only; no provider adapters required for MVP) |
| Shared Kernel | Cross-cutting VOs, event types, IDs |

### Full / deferred modules

| Module | Stories / status |
| --- | --- |
| Workflow | WF-001, WF-002, WF-003 |
| Notes | Pending Requirements — **reserved module, no active stories** |
| Memory (semantic) | MEM-003 |
| AI Agent (RAG) | AI-004 |
| Connector providers | CON-002 … CON-007 |
| Notification email reports | NOTIF-002 |

---

## 4. Module View

### Canonical module names

| Canonical Name | Aliases retired for new docs |
| --- | --- |
| Auth | IAM (keep as context label only), Authentication |
| Workspace | Workspace Tenancy |
| Todo | Task Management |
| Calendar | Schedule Management |
| Notes | Knowledge, Knowledge Base — **deferred** |
| Workflow | Workflow Automation |
| Notification | Notification Dispatch |
| Memory | Context & Semantic Memory |
| AI Agent | Cognitive Agent, Cognitive Orchestration |
| Connector | Connector Hub |
| Shared Kernel | — |

### Module list

| Module | Responsibility | Allowed dependencies |
| --- | --- | --- |
| **Auth** | Registration, credential policy, JWT session, RBAC claims | Workspace, Shared Kernel |
| **Workspace** | Tenant boundary, membership, security context | Shared Kernel |
| **Todo** | Task CRUD, priority, tags, filter/sort, soft-delete/recovery; recurrence (TODO-003, post-MVP) | Workspace, Shared Kernel |
| **Calendar** | Event CRUD, overlap preference, reminder lead-time scheduling signals, availability querying, slot discovery | Workspace, Shared Kernel |
| **Notes** | *(Reserved)* Document CRUD + indexing for RAG — **no implementation until Notes stories exist** | Workspace, Shared Kernel; `SemanticSearchPort` when activated |
| **Workflow** | Rules, cron/event triggers, circular-path prevention, run history (post-MVP) | Workspace, Shared Kernel; **ports**: Todo, Calendar, Notification |
| **Notification** | Template/format, urgency + channel routing, in-app delivery; channel adapters (email/Slack) | Workspace, Shared Kernel; **ports** to channel adapters |
| **Memory** | Conversation history, preferences; semantic facts + confidence (post-MVP) | Workspace, Shared Kernel; `SemanticSearchPort` when activated |
| **AI Agent** | Intent, planning, tool selection via Tool Registry, reflection, approval | Workspace, Shared Kernel, Tool Registry (in-module), `LLMPort`, Memory ports, `ApprovalRequestPort` |
| **Connector** | Hub lifecycle, translation ACL, sync orchestration, provider plugin SPI | Workspace, Shared Kernel; **ports**: Todo, Calendar, Notes (when active), Notification; `CredentialVaultPort`; provider adapters |
| **Shared Kernel** | IDs, WorkspaceId, recurrence VO (RFC 5545), domain event contracts, shared enums | None |

### Dependency direction

```
                    ┌─────────────┐
                    │ AI Agent    │── tools ──► (TodoPort, CalendarPort, …)
                    │ Tool Registry│
                    └──────┬──────┘
                           │ Memory ports / LLMPort
                           ▼
┌──────────┐  events/ports  ┌──────────┐
│ Workflow │───────────────►│ Todo     │
│ Connector│───────────────►│ Calendar │
└──────────┘                │ Notif.   │
                            └────┬─────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Workspace / Auth        │
                    │ Shared Kernel (leaf)    │
                    └─────────────────────────┘
```

Rules:

- Depend **down** to Shared Kernel and Workspace context.
- Sideways only through **inbound ports** or **domain events**.
- No module reads another module’s persistence.
- Only Connector (and Notification channel adapters) depend on external provider SDKs — behind driven adapters.
- Memory **does not** depend on AI Agent.

---

## 5. Layered Architecture (per module)

Strict hexagonal layering:

```
Presentation  →  Application  →  Domain  ←  Infrastructure
```

| Layer | Role |
| --- | --- |
| **Presentation** | REST / SSE / WebSocket; DTO mapping; authn gateway; no domain logic |
| **Application** | Use cases, transactions, authorization, port orchestration, event publish, approval/audit hooks |
| **Domain** | Aggregates, VOs, domain services, domain events, repository **interfaces**; framework-agnostic |
| **Infrastructure** | JPA, Flyway, Redis, Vault, Vector Store, HTTP clients, LLM clients — implements ports |

**Dependency rule:** each layer depends only **inward** toward Domain. Infrastructure and Presentation depend on Application/Domain abstractions; Domain depends on neither.

---

## 6. Hexagonal Architecture

Applied **per module**.

### Ports

| Port | Direction | Description |
| --- | --- | --- |
| `TodoPort` | Inbound (Todo) / used outbound by Agent tools, Workflow, Connector | Task commands/queries |
| `CalendarPort` | Inbound (Calendar) / used by Agent tools, Workflow, Connector | Event commands/queries |
| `NotesPort` | Inbound (Notes, when active) | Document commands/queries |
| `WorkflowExecutionPort` | Inbound (Workflow) | Trigger/execute rules |
| `NotificationDispatchPort` | Inbound (Notification) | Dispatch with urgency + template data |
| `MemoryStorePort` | Inbound (Memory) | Persist preferences / facts |
| `ConversationHistoryPort` | Inbound (Memory) | Append/retrieve/clear history |
| `SemanticSearchPort` | Outbound (Memory/Notes infrastructure) | Vector similarity |
| `CredentialVaultPort` | Outbound (Connector infrastructure) | Encrypted credential IO |
| `ConnectorLifecyclePort` | Inbound (Connector) | Register, authorize, enable/disable connectors |
| `ExternalProviderPort` | Outbound (Connector) | Provider capability SPI |
| `LLMPort` | Outbound (AI Agent) | Chat, tool-calling, embeddings |
| `ApprovalRequestPort` | Inbound (AI Agent) | Submit/resolve human approvals |
| `AgentCommandPort` | Inbound (AI Agent) | Chat/streaming entry |

### Adapters

- **Driving:** REST, SSE/WebSocket chat, Workflow scheduler/subscriber (post-MVP), Approval decision endpoint, Connector webhooks (post-MVP).
- **Driven:** PostgreSQL/JPA, Redis, Vault, Vector Store, LLM provider, per-connector clients, notification channel clients (in-app, email, Slack).

---

## 7. AI Agent Architecture

Pipeline: **Reasoner → Planner → Approval → Executor → Reflection**.

### Reasoner
- NLU over conversation history and preferences.
- Tool selection and argument validation.
- Grounding policy (post-MVP RAG): cite sources or state “I do not know”.
- Context compaction for LLM window limits.

### Planner
- Dependency-aware sequenced plan; each step maps to a registered tool.
- Max **3** automatic re-planning attempts per goal (AI-003); then escalate.

### Executor
- Runs approved steps via Tool Registry only.
- Workspace + permission checks on every call.
- Feeds outcomes to reflection.

### Tool Registry
- Sole capability gateway for the Agent (AI-002).
- Tools wrap foreign inbound ports (Todo, Calendar, …); declared with name, schema, permissions.
- Immutable audit log of invocations (`ToolExecuted`).

### Approval Flow
- Required before plan execution (AI-001).
- Required before email-extracted task creation when CON-004 ships.
- Unrecoverable failures escalate to the user (AI-003).

### Memory usage
- Agent **calls** Memory ports; Memory never imports Agent.

---

## 8. Connector Architecture

- **Connector Hub** owns lifecycle, translation (ACL), sync orchestration, rate-limit/backoff.
- Each provider implements `ExternalProviderPort` for its capability category (calendar sync, task sync, import, productivity fetch, etc.).
- Credentials only via `CredentialVaultPort`.
- Sync writes through **TodoPort / CalendarPort / NotesPort** (when active), never into foreign schemas.
- Notification delivery for Slack/email is **not** urgency policy: Hub/adapters send when Notification dispatches to that channel.
- MVP delivers Hub + SPI; concrete providers (CON-002+) are post-MVP plugins.

---

## 9. Notification Architecture

- **Notification** owns templates, urgency classification, channel preference evaluation, in-app fallback (NOTIF-001).
- Channel adapters (in-app, email, Slack) are driven adapters behind `NotificationDispatchPort`.
- Slack receives only **Urgent/Critical** when that channel is configured — enforced here, not in Connector Hub.
- Calendar reminders publish/schedule work that ends in `NotificationDispatchPort` (CAL-002).

---

## 10. Internal Event Flow

In-process bus; publish in transaction; handlers **after commit**; payloads are IDs + VOs only.

| Event | Producer | Consumers |
| --- | --- | --- |
| `TaskCreated` | Todo | Workflow*, Notification, Connector* |
| `TaskCompleted` | Todo | Workflow*, Memory |
| `TaskRecovered` | Todo | Notification, Connector* |
| `CalendarEventCreated` | Calendar | Workflow*, Notification (reminders), Connector* |
| `CalendarEventUpdated` | Calendar | Notification, Connector* |
| `CalendarEventConflictDetected` | Calendar | Notification, Connector* |
| `NoteCreated` | Notes* | Memory (index)* |
| `WorkflowExecuted` | Workflow* | Notification, Memory |
| `MemoryUpdated` | Memory | AI Agent (context refresh) |
| `NotificationRendered` | Notification | Audit |
| `ConnectorSynced` / `ConnectorSyncFailed` | Connector* | Notification, Audit |
| `ApprovalRequested` / `ApprovalResolved` | AI Agent | Notification, Workflow* (resume), Audit |
| `ToolExecuted` | AI Agent | Audit |

\* post-MVP or when module is active.

Semantics: failed handlers retry with bounds; bus is replaceable by a broker without domain changes.

---

## 11. Dependency Rules (enforced)

1. Presentation → Application → Domain ← Infrastructure (no Domain → Infrastructure).
2. Ports defined in Application/Domain; implemented in Infrastructure or foreign adapters.
3. Modules collaborate only via inbound ports or domain events.
4. Shared Kernel is the only shared code dependency (leaf).
5. AI Agent → Tool Registry + cognitive ports only (AD-016).
6. Memory ↛ AI Agent (AD-014).
7. Only Connector / channel adapters depend on external SDKs.
8. No framework types in Domain.
9. Every inbound port has a fake/in-memory double for isolated tests.
10. ArchUnit (or equivalent) enforces these rules in CI.

---

## 12. Domain Boundary Alignment

| DDD classification | Domains |
| --- | --- |
| **Core** | AI Agent; Memory (conversation/preferences/semantic) |
| **Supporting** | Todo; Calendar; Workflow; Connector; Notes *(reserved)* |
| **Generic** | Auth; Workspace; Notification |

### Bounded contexts (corrected)

1. **IAM (Auth)** — identity, credentials, sessions, global roles.
2. **Workspace Tenancy** — workspace, membership, tenant context.
3. **Cognitive Orchestration (AI Agent)** — planner, reasoner, executor, Tool Registry, approval.
4. **Context & Memory** — conversation, preferences, semantic facts (**Notes excluded**).
5. **Task Management (Todo)**.
6. **Schedule Management (Calendar)**.
7. **Knowledge (Notes)** — **reserved / inactive** until requirements exist.
8. **Workflow Automation** — post-MVP.
9. **Connector Hub**.
10. **Notification**.

### Shared concepts

| Concept | Owner | Pattern |
| --- | --- | --- |
| `WorkspaceId` | Workspace | Shared Kernel VO |
| `UserId` | Auth | ID reference across contexts |
| Task / Calendar Event | Todo / Calendar | Ports + domain events; Agent tools |
| Recurrence Rule (RFC 5545) | Shared Kernel VO | Used by Todo recurrence; available for future Calendar |
| Domain event contracts | Shared Kernel | Integration without consumer knowledge |

### Anti-corruption layers

1. **Connector Hub adapters** — external SaaS APIs → internal ports/events.
2. **LLM adapter** — `LLMPort` isolates prompt/tool-calling formats.
3. **Notification channel adapters** — generic message → SMTP / Slack / in-app.
4. **Credential Vault adapter** — `CredentialVaultPort` isolates KMS/storage.

---

## 13. Requirement Coverage Matrix

| Story | Architectural home | Phase |
| --- | --- | --- |
| AUTH-001 | Auth + Workspace | MVP |
| TODO-001, TODO-002 | Todo | MVP |
| TODO-003 | Todo + Shared Kernel recurrence VO | Full |
| CAL-001, CAL-002 | Calendar + Notification | MVP |
| WF-001..003 | Workflow + events/ports | Full |
| AI-001..003 | AI Agent + Tool Registry + Approval | MVP |
| AI-004 | AI Agent + Memory + Notes* + SemanticSearch | Full (*Notes pending) |
| MEM-001, MEM-002 | Memory | MVP |
| MEM-003 | Memory | Full |
| CON-001 | Connector Hub SPI | MVP |
| CON-002..007 | Connector provider adapters | Full |
| NOTIF-001 | Notification | MVP |
| NOTIF-002 | Notification + email channel + CON-004 | Full |

Pending requirements (Notes CRUD, connection manager UX, channel subscription model detail, privacy policy framework, session/soft-delete precision, productivity summary logic) remain **requirements gaps**. Architecture exposes ports/seams only where needed; Domain Modeling must not invent product behavior for them.

---

## 14. Extensibility Summary

| Extension | Mechanism |
| --- | --- |
| New domain capability for Agent | Register a Tool wrapping the module’s inbound port |
| New external provider | Implement `ExternalProviderPort` plugin; register via Hub |
| New notification channel | Implement channel adapter for `NotificationDispatchPort` |
| New automation trigger/action | Workflow rule types over existing ports/events |
| Extract module to service | Replace in-process port/event adapters with RPC/broker adapters |

---

## 15. Architecture Decision Record (final set)

| # | Decision |
| --- | --- |
| AD-001 | Modular Monolith |
| AD-002 | Hexagonal per module (Domain ← Infrastructure) |
| AD-003 | In-process after-commit domain events |
| AD-004 | Tool Registry exclusive for Agent |
| AD-005 | Human approval for plans (and email-task creation when applicable) |
| AD-006 | ≤3 re-plan attempts then escalate |
| AD-007 | RAG citation / “I do not know” (post-MVP) |
| AD-008 | Connector Hub translation ACL |
| AD-009 | Workspace multi-tenancy |
| AD-010 | Credential Vault |
| AD-011 | RFC 5545 VO in Shared Kernel; Todo owns recurrence behavior |
| AD-012 | Notification owns urgency/channel routing |
| AD-013 | Notes reserved separate context (deferred) |
| AD-014 | Memory ↛ AI Agent |
| AD-015 | Sideways collaboration via ports/events only |
| AD-016 | Agent → Tool Registry + cognitive ports only |
| AD-017 | Canonical naming + `CalendarEvent*` event names |
| AD-018 | MVP vs Full module phasing |

---

**End of document.** Ready for Domain Modeling on MVP modules first: Auth, Workspace, Todo, Calendar, Notification, Memory (history/preferences), AI Agent, Connector Hub SPI, Shared Kernel.
