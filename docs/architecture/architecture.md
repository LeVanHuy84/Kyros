# Architecture Overview

The **AI Executive Assistant** is a **Modular Monolith** built on a **Hexagonal (Ports & Adapters)** core with **DDD Lite** boundaries and **event-driven** internal communication. The system is packaged and deployed as a single Spring Boot application, but its codebase is strictly partitioned into cohesive modules, each owning its own domain model, application services, and persistence.

The system provides five primary product surfaces:

1. **Personal management domains** — Todo, Calendar, Notes (Knowledge), and Workflow Automation.
2. **A cognitive core** — the AI Agent, which decomposes natural-language goals into plans, executes them through a secured Tool Registry, reflects on outcomes, and escalates to the user when needed.
3. **Context and memory** — Conversation History, User Preferences, and Long-Term Semantic Memory, used to personalize and ground agent behavior.
4. **A connector layer** — the Connector Hub, which adapts external providers (Google Calendar, Outlook, Slack, GitHub, Notion, TickTick, Jira, SMTP/IMAP) into internal domain representations.
5. **Cross-cutting concerns** — Authentication/Workspace isolation, Notification dispatching, and an Approval Flow that keeps the human in the loop for critical actions.

Every capability of the system lives inside a **Workspace** boundary. The AI Agent never touches storage directly: all of its capabilities are exposed exclusively through tools registered in the Tool Registry, guaranteeing auditability, permission enforcement, and safety. The architecture is deliberately **single-process** in phase one to keep operational complexity low while preserving the option to split modules into services later.

---

# Architectural Style

The system adopts a **Modular Monolith with Hexagonal boundaries and internal event-driven communication**.

Why this style fits the system:

- **Security and data isolation are paramount.** A single application instance with strict workspace partitioning is far easier to harden, review, and audit than a distributed system. Authentication is enforced once at the gateway, and workspace isolation is centralized rather than scattered across many services.
- **The AI Agent needs controlled, auditable capability exposure.** A single process makes the Tool Registry a natural in-process boundary that cannot be bypassed by network tricks, and makes approval/audit flows trivial to implement and trace.
- **Development velocity for an individual production project.** A modular monolith keeps the cost of change low: local-first development, single build, single deployment, simpler testing, and no network failures between modules. This is the SDD's stated approach for the initial phases.
- **Independent evolution is preserved.** Each module owns its schema and public API (ports). If a module must become a service later (e.g., a busy Agent module), the hexagonal seams and event contracts are already in place to extract it.
- **Asynchronous, decoupled reactions.** Workflow triggers, notifications, sync events, and memory updates are naturally event-driven. An in-process event bus (Spring `ApplicationEventPublisher`) provides loose coupling without the operational weight of a broker, while remaining swappable for a message broker later.
- **Domain logic is not coupled to frameworks or external systems.** Hexagonal architecture keeps the AI, business rules, and third-party connectors on opposite sides of explicit ports, so provider changes do not ripple through domain code.

---

# Module View

## Module List

| Module | Responsibility | Allowed Dependencies |
| --- | --- | --- |
| **Auth** | User registration, credential verification, password policy enforcement, JWT issuance/refresh, RBAC authorization, workspace mapping. | Workspace/Shared Kernel, Security (Spring Security) |
| **Workspace** | Defines the tenant boundary, owns workspace lifecycle and membership; exposes the security context used by every other module. | Shared Kernel |
| **Todo** | Task CRUD, priority, tags, filtering, soft-delete/recovery, recurring intervals (RFC 5545). | Workspace, Shared Kernel |
| **Calendar** | Event scheduling, overlap prevention, recurrence, lead-time computation for reminders, sync events. | Workspace, Shared Kernel |
| **Notes (Knowledge)** | Markdown document CRUD, indexing, semantic retrieval for RAG grounding. | Workspace, Shared Kernel, (via port) Vector Store |
| **Workflow** | Rule evaluation (domain events or cron triggers), action sequencing, circular-path prevention, run history. | Workspace, Todo, Calendar, Notification, Shared Kernel |
| **Notification** | Centralized routing/formatting/delivery (in-app, email, Slack per urgency), honoring preferences. | Workspace, Shared Kernel, (via ports) Notification providers |
| **Memory** | Conversation history, user preferences, long-term semantic memory extraction with confidence scoring. | Workspace, AI Agent (contracts only), Shared Kernel, (via port) Vector Store |
| **AI Agent** | Orchestration: intent parsing, planning, tool selection, execution, reflection, approval requests. | Workspace, Tool Registry (in-module), Memory, Notes, Shared Kernel |
| **Connector** | Connector Hub lifecycle, credential vault access, external-model translation, sync/import orchestration, routing. | Workspace, Todo, Calendar, Notes, Notification, Shared Kernel, (via ports) External providers |
| **Shared Kernel** | Cross-cutting value objects, domain events, IDs, time utilities, enums, security primitives shared between modules. | None (leaf module) |

## Dependency Direction

- Modules depend **downward** toward the Shared Kernel and **sideways** only through explicit application interfaces (ports) or published domain events.
- The **AI Agent never depends on infrastructure**; it depends on Tool interfaces implemented within the Agent module that in turn delegate to domain modules via ports.
- **Connector** is the only module allowed to know about external provider SDKs/APIs, and only behind adapter classes.
- No module may reach into another module's persistence layer.

---

# Layered Architecture

Within each module, code is organized into four layers following the **strict dependency rule** — each layer may depend only on the layers below it:

### Presentation
- Handles the transport boundary (REST controllers, WebSocket/SSE streams for chat) and maps HTTP/stream DTOs to application commands.
- Performs authentication enforcement at the gateway (workspace resolution) before any application call.
- Contains no business logic and no domain knowledge; only protocol translation and input validation.

### Application
- Orchestrates use cases: transaction boundaries, authorization checks, command/query handling, and event publishing.
- Implements module **ports** (interfaces) that other modules consume.
- Is the only layer permitted to coordinate multiple domain aggregates or call other modules' ports.
- Applies cross-cutting concerns such as the Approval Flow and audit logging.

### Domain
- Contains entities, value objects, aggregates, domain services, domain events, and repository **interfaces**.
- Encodes business rules (e.g., no-overlap events, RFC 5545 recurrence, workflow circular-path prevention, confidence-scored memories).
- Fully framework-agnostic: depends only on the Shared Kernel and standard Java.

### Infrastructure
- Implements the domain repository interfaces and outbound ports.
- Contains JPA repositories/mappings, Flyway migrations, vector store adapters, credential vault clients, cache adapters, and external HTTP clients (Connector module only).
- May depend on Spring/DB/client libraries, but never leaks them into Domain or Application.

---

# Hexagonal Architecture

The hexagon is applied **per module**: each module exposes **input ports** (its application/domain interfaces) and consumes **output ports** (interfaces it needs implemented by infrastructure or other modules).

## Ports (inbound / outbound)

| Port | Type | Description |
| --- | --- | --- |
| `TodoPort`, `CalendarPort`, `NotesPort` | Outbound (from Agent/Workflow) | Capability interfaces the AI tools and workflow actions call to operate on domain data. |
| `WorkflowExecutionPort` | Inbound | Accepts trigger/action execution requests; consumed by the event subscriber and scheduler. |
| `NotificationDispatchPort` | Outbound | Sends formatted notifications; implemented by in-app, email, and Slack adapters. |
| `MemoryStorePort` | Outbound | Persists conversations/preferences; implemented by Memory infrastructure. |
| `SemanticSearchPort` | Outbound | Vector similarity search; implemented by the Vector Store adapter (pgvector/Qdrant). |
| `ConversationHistoryPort` | Outbound | Retrieves/compacts multi-turn history; implemented by Memory infrastructure. |
| `CredentialVaultPort` | Outbound | Encrypted read/write of OAuth tokens; implemented by the key-vault adapter. |
| `ConnectorLifecyclePort` | Inbound | Register, authorize, and manage connectors and their credentials. |
| `ExternalProviderPort` | Outbound | Generic provider operations; implemented by per-provider adapters. |
| `LLMPort` | Outbound | Chat/completions, tool calling, and embedding calls; implemented by the LLM adapter (Strategy pattern). |
| `ApprovalRequestPort` | Inbound | Submits human-approval requests and awaits/resolves decisions. |
| `AgentCommandPort` | Inbound | Entry point for chat/streaming agent interactions. |

## Adapters (driving / driven)

- **Driving adapters:** REST controllers, SSE/WebSocket chat endpoints, Workflow cron scheduler, Workflow event subscriber, and the Approval decision endpoint.
- **Driven adapters:** PostgreSQL (JPA) repositories, Vector Store, Redis (cache/rate limiting), credential Vault, LLM provider adapter, and per-connector provider clients (Google Calendar, Outlook, Slack, GitHub, Notion, TickTick, Jira, SMTP/IMAP).

The diagram of boundaries is as follows: **Presentation → Application → Domain ← Infrastructure**, with all external systems arriving only through driven adapters and all module-to-module collaboration crossing explicit ports.

---

# AI Agent Architecture

The Agent module is a pipeline that turns a user goal into audited, approved, and executed actions.

## Planner
- Receives the parsed intent and produces a **dependency-aware, sequenced plan** where each step maps to a registered tool.
- Decomposes high-level goals (e.g., "Review my schedule for next Monday and prepare a plan") into concrete actions.
- Operates within a **hard limit of 3 automatic re-planning attempts** per goal; beyond that it escalates to the user.

## Reasoner
- Performs natural-language understanding and decision-making over conversation history, retrieved knowledge, and user preferences.
- Selects the appropriate tools and validates that tool arguments satisfy constraints before execution.
- Decides whether grounding is sufficient: if no workspace document supports an answer, it responds "I do not know" rather than hallucinate.
- Compacts/truncates context to respect the LLM context window.

## Executor
- Runs the approved plan steps in dependency order through the Tool Registry.
- Captures per-step results, detects failures, and feeds them back to the Planner for reflection.
- Enforces workspace scoping and permission policy on every invocation.

## Memory
- **Conversation History:** multi-turn, workspace-scoped chat log used for context.
- **User Preferences:** timezone, lead times, notification preferences, no-overlap setting.
- **Long-Term Semantic Memory:** extracted facts and preferences stored with confidence scores; consulted for personalization and grounding.

## Tool Registry
- The **only** way the Agent touches system capabilities. Tools wrap domain ports (Todo, Calendar, Notes, Search, Workflow, Connector) and are declared with name, description, parameters, and permission requirements.
- Enforces: workspace isolation, permission policy, argument validation, and full audit logging of every call.
- Cannot be bypassed — there is no direct database or domain access path from the Agent.

## Approval Flow
- Any **plan execution** and any **email-extracted task creation** requires explicit user confirmation before execution begins.
- The Agent submits an approval request containing the goal, the full plan, the affected data, and the risk level; execution halts until the user approves or rejects.
- Unrecoverable failures escalate to the user with a summary rather than failing silently or looping.

---

# Connector Architecture

The Connector module integrates external providers without leaking their specifics into the domain.

## Integration Model

- Each provider (Google Calendar, Outlook, Slack, GitHub, Notion, TickTick, Jira, SMTP/IMAP) is represented by a **connector adapter** that implements the generic `ExternalProviderPort` contract for its capability category (calendar sync, task sync, import, notification, productivity data).
- The **Connector Hub** manages connector lifecycle, credential routing, provider selection, and translation between external payloads and internal domain events/commands.
- **Translation** is the hub's core duty: external third-party data models are converted into internal domain representations (and vice versa for outbound sync) so that business logic never depends on provider schema details.

## Lifecycle

1. **Provision:** user authorizes a provider via OAuth/API key through the Connector Hub; credentials are stored encrypted in the Credential Vault.
2. **Synchronization/Import:** the hub pulls or subscribes to provider data, translates it, and feeds it into domain modules through their ports.
3. **Outbound:** internal domain changes that affect a connected provider are translated and pushed through the corresponding adapter.
4. **Failure & rate-limit handling:** the hub applies backoff, retries, and state tracking so external downtime does not hang asynchronous processes.

## Constraints

- Provider implementations are **not** designed in this document — adapters are defined as contracts only; concrete SDK-specific behavior is deferred to implementation.
- Slack notifications are routed only for **Urgent/Critical** urgency, enforced at the hub.
- All provider operations are workspace-scoped and audited.

---

# Internal Event Flow

Modules communicate asynchronously via **domain events** published in-process (Spring `ApplicationEventPublisher`), keeping producers decoupled from consumers.

## Event Catalog

| Event | Producer | Consumers |
| --- | --- | --- |
| `TaskCreated` | Todo | Workflow (trigger), Notification, Connector (outbound sync) |
| `TaskCompleted` | Todo | Workflow (trigger), Memory |
| `TaskRecovered` | Todo | Notification, Connector (outbound sync) |
| `EventCreated` | Calendar | Workflow (trigger), Notification (reminders), Connector (outbound sync) |
| `EventUpdated` / `EventConflictDetected` | Calendar | Notification, Connector |
| `NoteCreated` | Notes | Memory (indexing for RAG) |
| `WorkflowExecuted` | Workflow | Notification, Memory |
| `MemoryUpdated` | Memory | AI Agent (context refresh) |
| `NotificationRendered` | Notification | Audit |
| `ConnectorSynced` / `ConnectorSyncFailed` | Connector | Notification, Audit |
| `ApprovalRequested` / `ApprovalResolved` | AI Agent | Notification, Workflow (resume), Audit |
| `ToolExecuted` | AI Agent | Audit (immutable tool-call log) |

## Flow Semantics

1. An application service mutates a domain aggregate and publishes a **domain event** via the port, as part of the same transaction.
2. The in-process event bus dispatches to registered handlers in the same or other modules.
3. Handlers run **after commit** (transaction-boundary strategy) so consumers never observe half-written state; failed handlers are retried with bounded attempts and logged.
4. Workflow rules subscribe to events as triggers; the scheduler generates events from cron expressions.
5. Event payloads contain only identifiers and value objects (never ORM entities), preserving module boundaries.
6. The event bus is an internal seam: it can be replaced by a message broker (Kafka/RabbitMQ) without changing domain code.

---

# Dependency Rules

1. **Strict layering:** Presentation → Application → Domain → Infrastructure within every module; nothing may skip a layer.
2. **Upward dependency inversion:** Domain and Application define ports; Infrastructure implements them. No dependency flows from Application/Domain into Infrastructure.
3. **Sideways isolation:** Modules communicate only through (a) another module's inbound application port or (b) published domain events. Direct class imports across module domains are forbidden.
4. **Shared Kernel as the only common dependency:** cross-module value objects, events, and enums live in the Shared Kernel leaf module.
5. **Agent isolation:** the AI Agent depends only on the Tool Registry and ports; it never depends on Todo/Calendar/Notes infrastructure or persistence.
6. **Connector isolation:** only the Connector module and its adapters depend on external provider SDKs; provider types never cross module boundaries.
7. **No framework leakage:** Spring, JPA, and client libraries must not appear in Domain code.
8. **Testability:** every inbound port has an in-memory/fake outbound implementation available, so each module can be tested in isolation.
9. **Enforcement:** these rules are verified by architecture tests (e.g., ArchUnit) in CI, in addition to code review.

---

# Architecture Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| **AD-001** | Modular Monolith rather than Microservices | Single process maximizes security auditability and development velocity while hexagonal seams preserve future extraction options. |
| **AD-002** | Hexagonal (Ports & Adapters) per module | Isolates frameworks, LLM providers, and external systems behind interfaces; enables isolated testing and provider swaps. |
| **AD-003** | In-process event bus (Spring ApplicationEvents) with after-commit dispatch | Loose coupling without broker complexity; swappable for a message broker later. |
| **AD-004** | Tool Registry as the exclusive agent capability gateway | Guarantees the Agent never touches storage directly; provides permission enforcement and an immutable audit trail. |
| **AD-005** | Explicit human approval for plan execution and email-task creation | Satisfies the human-in-the-loop constraint (AI-001, CON-004) and prevents unintended autonomous actions. |
| **AD-006** | Hard 3-attempt reflection limit with user escalation | Bounds token cost and prevents infinite loops (AI-003); failures are surfaced, not swallowed. |
| **AD-007** | RAG grounding with mandatory citations and "I do not know" fallback | Prevents hallucination; answers are traceable to workspace documents (AI-004). |
| **AD-008** | Connector Hub with model translation | Decouples business logic from provider schema churn and enables unified sync/conflict handling (CON-001). |
| **AD-009** | Workspace-scoped multi-tenancy | Workspace is the universal security boundary; enforcement centralized at the gateway and re-validated at every port. |
| **AD-010** | Credential Vault with encryption at rest | Protects OAuth tokens and API keys from credential-exposure risk; secrets never enter domain code. |
| **AD-011** | RFC 5545-compliant recurrence in the Todo/Calendar domain | Ensures standards-compliant repeating tasks and events (TODO-003). |
| **AD-012** | Urgency-gated Slack routing | Only Urgent/Critical notifications reach Slack, reducing noise and external blast radius (CON-005). |

## Deferred Decisions (implementation phase)

- **Vector store:** pgvector versus Qdrant — both satisfy the `SemanticSearchPort`; selection is deferred to performance testing in the RAG phase.
- **Sync conflict resolution:** default last-write-wins with per-entity override and optional user prompt; finalized when connectors are implemented.
- **Scheduler:** Quartz versus Spring Scheduler versus DbScheduler — must support workspace isolation and cron; chosen with the Workflow module.
- **LLM context window strategy:** summarization, truncation, and sliding-window tactics are tuned during the AI phase.
