# AI Coding Plan: AI Executive Assistant

This document defines the official, execution-oriented **AI Coding Plan** for the **AI Executive Assistant** project. It serves as the canonical roadmap for AI Coding Agents and human developers to construct the system in a structured, dependency-aware manner.

---

## 1. Overall Dependency Graph

The implementation sequence is determined strictly by technical dependencies. Lower-level foundational contexts are implemented first, followed by independent core domains, supporting communication and memory lines, and finally the cognitive agent orchestration.

```
                     ┌─────────────────────────┐
                     │      Shared Kernel      │  (Wave I: Foundation)
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    Workspace & Auth     │  (Wave I: Tenancy & IAM)
                     └─────────────────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
      │    Todo     │      │  Calendar   │      │   Memory    │  (Wave II: Core Domains)
      └─────────────┘      └─────────────┘      └─────────────┘
             ▲                    ▲                    │
             │ ports              │ ports              │ ports
             │                    │                    │
             │                    │                    ▼
      ┌──────┴──────┐      ┌──────┴──────┐      ┌─────────────┐
      │  Connector  │─────►│Notification │      │  AI Agent   │  (Wave III: Cognitive Core)
      └─────────────┘ ports└─────────────┘      └─────────────┘
             │                    │                    │
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │   Bootstrap (Wiring)    │  (Wave III: E2E Verification)
                     └─────────────────────────┘
```

### Why this order is chosen:
1.  **Shared Kernel**: Leaf library. Contains global identifiers (`UserId`, `WorkspaceId`) and common value objects (recurrence patterns). All other modules must import this; hence, it is built first.
2.  **Workspace & Auth**: Every operation in the system is workspace-scoped (multi-tenant isolation). The active tenant is extracted from the authentication context. Without Workspace and Auth, we cannot secure REST endpoints or resolve tenant contexts.
3.  **Todo & Calendar**: These represent the primary database storage and business rules of the application. They depend on Workspace for tenancy, but are independent of each other.
4.  **Memory & Notification**: Independent support domains. Memory handles conversation history and user preferences. Notification handles template formatting and delivery channel routing.
5.  **Connector Hub**: Integrates external SaaS states with local databases. It must write via `TodoPort` and `CalendarPort` and alert via `NotificationDispatchPort`, meaning these ports must exist and be stable before the Connector Hub is implemented.
6.  **AI Agent**: The cognitive core. The agent does not access databases directly; it acts by invoking tools in the Tool Registry. These tools wrap the ports of the other business modules (`TodoPort`, `CalendarPort`, `MemoryStorePort`, `ApprovalRequestPort`). The agent itself only depends on its own cognitive ports and Memory ports, allowing it to be compiled independently of Todo and Calendar.
7.  **Bootstrap**: The final compilation root that compiles the runnable Monolith. It houses the main entry point and the concrete Spring beans (including the dynamic tools bridging the Agent to the domain ports), completing the integration.

---

## 2. AI Coding Workflow (per module)

For every module, AI Coding Agents must implement components in a strict inward-pointing direction to respect Hexagonal Architecture principles:

```
Domain Layer (pure) ──► Application Layer (ports) ──► Infrastructure Layer (adapters) ──► Presentation Layer (REST/DTO)
```

1.  **Domain Layer**:
    *   **Value Objects**: Define immutable value objects (e.g. `TaskPriority`, `WorkspaceId` structures).
    *   **Aggregates & Entities**: Implement aggregate roots (e.g. `Task`, `CalendarEvent`) with internal business invariant checks. Include a `@Version` annotation variable for optimistic locking. Ensure no framework dependencies (no Spring/JPA annotations).
    *   **Domain Events**: Declare immutable event records (e.g. `TaskCreated`).
    *   **Repository Interfaces**: Define the outbound repository interfaces (e.g. `TaskRepository` interface).
2.  **Application Layer**:
    *   **Inbound Ports**: Define use case interfaces (e.g. `CreateTaskUseCase` / `TodoPort`).
    *   **Outbound Ports**: Define ports for external interfaces (e.g. `LLMPort` or `NotificationDispatchPort`).
    *   **Application Services**: Implement inbound ports, define transaction boundaries (`@Transactional`), and coordinate aggregates and outbound ports.
3.  **Infrastructure Layer**:
    *   **JPA Entity Models**: Create JPA mapping classes corresponding to database tables.
    *   **JPA Repositories**: Implement Spring Data JPA repositories.
    *   **Mappers**: Implement mapping utilities to convert between JPA models and pure Domain aggregates.
    *   **Outbound Adapters**: Implement outbound ports (like the JPA repository wrapper, Redis client, LLM API client, etc.).
    *   **Flyway Migrations**: Write schema SQL scripts under `db/migration/`.
4.  **Presentation Layer**:
    *   **DTOs**: Create request/response records with validation annotations (`jakarta.validation`).
    *   **Controllers**: Implement REST or SSE endpoints.
    *   **Exception Handlers**: Map domain/application exceptions to standard RFC 7807 Problem Details.
5.  **Tests**:
    *   **Unit Tests**: Test core domain rules and application use cases using mocks/fakes (no Spring context). Suffix files with `Test.java`.
    *   **Integration Tests**: Run database integration tests using Flyway and Testcontainers (PostgreSQL + Redis). Suffix files with `IT.java`.

---

## 3. Implementation Waves & Phases

### WAVE I: FOUNDATION & TENANCY

#### Phase 1: Repository Initialization and Quality Guardrails
*   **Objective**: Bootstrap the multi-module Gradle project and configure compiler-level quality gates.
*   **Prerequisites**: JDK 21 installation, Gradle build environment.
*   **Input Documents**: [`bootstrap-overview.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/bootstrap/bootstrap-overview.md)
*   **Modules Involved**: Root project, `modules/build-logic`, `modules/shared-kernel`
*   **Features Covered**: Version catalog configuration, Spotless/Checkstyle/NullAway compiler integrations, Shared Kernel value objects (`UserId`, `WorkspaceId`, `RecurrencePattern` properties).
*   **Deliverables**:
    *   Root `settings.gradle`, `build.gradle`, `gradle.properties`, and `gradle/libs.versions.toml`.
    *   `modules/build-logic/` code quality convention plugins.
    *   `modules/shared-kernel/` source tree with base identifiers.
*   **Exit Criteria**:
    *   `./gradlew clean build` completes with zero compiler warnings and zero style infractions.
    *   NullAway successfully flags compilation of any nullable returns lacking explicit annotation.

#### Phase 2: Workspace Tenancy and JWT Authentication
*   **Objective**: Implement the multi-tenant workspace boundary and secure session authentication.
*   **Prerequisites**: Phase 1 complete.
*   **Input Documents**: [`ADR-0007`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0007-workspace-scoping-and-tenancy.md), [`ADR-0011`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0011-token-revocation-and-session-management-with-redis.md), [`database-design/auth.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md), [`database-design/workspace.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/workspace.md)
*   **Modules Involved**: `modules/auth`, `modules/workspace`
*   **Features Covered**: User registration, login, JWT token generation, Redis token revocation check (session deny-list), workspace provisioning on user registration, ThreadLocal `WorkspaceContextHolder` management.
*   **Deliverables**:
    *   Auth & Workspace schemas initialized via Flyway (`V1.0.0__init_auth_schema.sql` and `V1.0.0__init_workspace_schema.sql`).
    *   User registration and JWT auth REST controllers.
    *   Spring Security Filter intercepting requests and setting `WorkspaceContextHolder`.
    *   Redis deny-list wrapper failing-closed if Redis is offline (throwing HTTP 503).
*   **Exit Criteria**:
    *   Registration endpoint triggers the `UserRegistered` event, which successfully provisions a new workspace.
    *   Requests with revoked JWT tokens are rejected with a HTTP 401 Unauthorized status.
    *   Integration tests run with PostgreSQL and Redis containers, showing complete session isolation.

---

### WAVE II: CORE PRODUCTIVITY & SERVICES

```
Note: Phase 3, Phase 4, Phase 5, and Phase 6 are compile-time independent and can be developed in parallel by separate agents once Wave I is complete.
```

#### Phase 3: Task Management (Todo Context)
*   **Objective**: Implement the Task lifecycle with soft delete, automatic recovery windows, and recurrence contracts.
*   **Prerequisites**: Phase 2 complete.
*   **Input Documents**: [`domain-model/todo/`](file:///D:/VsCode/Java/ai_executive_assistant/docs/domain-model/todo/), [`database-design/todo.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/todo.md), [`implementation-guide.md` §5](file:///D:/VsCode/Java/ai_executive_assistant/docs/implementation/implementation-guide.md#L125)
*   **Modules Involved**: `modules/todo`
*   **Features Covered**: Task CRUD, tagging, priority settings, soft-delete flagging, 2-hour trash recovery window, 30-day physical purge scheduler, partial indexes for unique names.
*   **Deliverables**:
    *   Flyway migrations for `todo` schema, including partial index `WHERE deleted_at IS NULL`.
    *   `Task` aggregate root and `TodoPort` inbound port implementation.
    *   Hibernate automated soft-delete filters (`@SQLDelete` and `@Where`).
    *   Daily background Scheduler bean executing hard deletes for rows where `deleted_at > 30 days`.
*   **Exit Criteria**:
    *   Tasks deleted can be recovered via a `restore` endpoint within 2 hours. After 2 hours, they are excluded from recovery.
    *   Creating a task with an identical name of an active task fails, but succeeds if the existing task is soft-deleted.
    *   All select queries automatically append `workspace_id = :workspaceId`.

#### Phase 4: Schedule and Reminders (Calendar Context)
*   **Objective**: Implement Event scheduling, timezone support, and collision detection rules.
*   **Prerequisites**: Phase 2 complete.
*   **Input Documents**: [`domain-model/calendar/`](file:///D:/VsCode/Java/ai_executive_assistant/docs/domain-model/calendar/), [`database-design/calendar.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/calendar.md), [`implementation-guide.md` §5.8](file:///D:/VsCode/Java/ai_executive_assistant/docs/implementation/implementation-guide.md#L173)
*   **Modules Involved**: `modules/calendar`
*   **Features Covered**: Event CRUD, scheduling overlap validation, reminder lead times stored as integer minutes, reminder trigger generation.
*   **Hexagonal Note**: The overlap validation checks the `prevent_calendar_overlap` preference. Since Calendar cannot import Memory, this preference parameter must be passed explicitly into the inbound port or resolved at the controller level.
*   **Deliverables**:
    *   Flyway migrations for `calendar` schema.
    *   `CalendarEvent` aggregate root (owning a collection of `Reminder` entities).
    *   Overlap check validator querying database event intervals.
    *   Inbound `CalendarPort` implementation.
*   **Exit Criteria**:
    *   Creating overlapping events fails if the validation check is triggered with overlap prevention enabled, and succeeds if disabled.
    *   Reminder lead times are stored as minutes, and the scheduler correctly calculates trigger times (`start_time - lead_time_minutes`).
    *   Events automatically enforce workspace isolation.

#### Phase 5: Memory Storage and User Preferences
*   **Objective**: Implement conversation turn logging, user preference management, and context persistence.
*   **Prerequisites**: Phase 2 complete.
*   **Input Documents**: [`domain-model/memory/`](file:///D:/VsCode/Java/ai_executive_assistant/docs/domain-model/memory/), [`database-design/memory.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/memory.md)
*   **Modules Involved**: `modules/memory`
*   **Features Covered**: Conversation session CRUD, turn logging, user preference profiles (timezones, default task priority, calendar overlap preferences, reminder lead times), unique constraint enforcing one preference record per user per workspace (`uq_preferences_workspace_user`).
*   **Deliverables**:
    *   Flyway migrations for `memory` schema (conversations, conversation_turns, user_preferences).
    *   `Conversation` and `UserPreferences` aggregate roots.
    *   `MemoryStorePort` and `ConversationHistoryPort` inbound ports.
*   **Exit Criteria**:
    *   Conversation turns are appended and loaded chronologically.
    *   User preferences are successfully queried and written, enforcing the single profile constraint.
    *   Memory context has zero compile-time dependencies on the AI Agent module.

#### Phase 6: Notification Routing and Dispatch
*   **Objective**: Establish notification template formatting and channel routing.
*   **Prerequisites**: Phase 2 complete.
*   **Input Documents**: [`domain-model/notification/`](file:///D:/VsCode/Java/ai_executive_assistant/docs/domain-model/notification/), [`database-design/notification.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/notification.md)
*   **Modules Involved**: `modules/notification`
*   **Features Covered**: Notification profiles, template formatting, SMTP email channel, Slack channel integration (restricting Slack to "Urgent/Critical" notifications based on notification profiles).
*   **Deliverables**:
    *   Flyway migrations for `notification` schema.
    *   `NotificationProfile` and `InAppNotification` aggregates.
    *   `NotificationDispatchPort` implementation alongside outbound Email and Slack adapters.
*   **Exit Criteria**:
    *   Email delivery is successfully simulated for notifications.
    *   Notifications designated as "Medium" or "Low" urgency are blocked from the Slack channel adapter and routed to email or in-app inboxes.

#### Phase 7: Connector Hub and Credential Vault
*   **Objective**: Implement Connection lifecycle management and external API credential encryption.
*   **Prerequisites**: Phase 3, Phase 4, and Phase 6 ports defined.
*   **Input Documents**: [`ADR-0008`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0008-connector-hub-and-credential-security.md), [`database-design/connector.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/connector.md)
*   **Modules Involved**: `modules/connector`
*   **Features Covered**: Connector plugin SPI (`ExternalProviderPort`), Connection profile lifecycle, encrypted secret storage (AES-256 vault at rest), sync conflict logging, write-back to Todo and Calendar ports.
*   **Deliverables**:
    *   Flyway migrations for `connector` schema (connection configurations, sync logs, conflict tables).
    *   `CredentialVaultPort` interface and database-level AES-256 encryption implementation.
    *   `ExternalProviderPort` SPI definition.
    *   Sync orchestration engine mapping connector syncs to `TodoPort` / `CalendarPort`.
*   **Exit Criteria**:
    *   Access credentials (tokens/keys) are written to the database encrypted and cannot be retrieved in plain text via direct SQL queries.
    *   Sync execution simulates writing external mock data into local task/calendar lists via domain ports.

---

### WAVE III: COGNITIVE ORCHESTRATION & INTEGRATION

#### Phase 8: AI Agent Cognitive Core (Reasoner & Planner)
*   **Objective**: Implement the Agent session pipeline, Tool Registry, planning engine, and human approval flow.
*   **Prerequisites**: Phase 5 (Memory) ports defined.
*   **Input Documents**: [`ADR-0004`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0004-agent-sandbox-and-tool-registry.md), [`ADR-0005`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0005-human-in-the-loop-and-re-planning-limits.md), [`ADR-0012`](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md), [`domain-model/agent/`](file:///D:/VsCode/Java/ai_executive_assistant/docs/domain-model/agent/), [`database-design/agent.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/agent.md)
*   **Modules Involved**: `modules/agent`
*   **Features Covered**: `LLMPort` interface and Groq/Gemini adapters, Tool Registry gateway, step-by-step Planner (producing dynamic plans), plan validation, 3-attempt reflection loop, `ApprovalRequest` state machine.
*   **Deliverables**:
    *   Flyway migrations for `agent` schema.
    *   `AgentSession` aggregate and planner execution engine.
    *   `ToolRegistry` managing registered `AgentTool` beans.
    *   `ApprovalRequest` aggregate and validation endpoints.
    *   Primary `GroqLLMAdapter` and fallback `GeminiLLMAdapter`.
*   **Exit Criteria**:
    *   The Agent cannot execute any plan without writing an `ApprovalRequest` and verifying a positive human resolution.
    *   An agent plan that fails to execute a step triggers a re-planning cycle up to a maximum of 3 times before transitioning the session to an escalated failure state.
    *   ArchUnit tests confirm the `agent` module has zero compile-time references to `todo`, `calendar`, or `connector`.

#### Phase 9: System Wiring and End-to-End Verification
*   **Objective**: Integrate all modules, wire tools in bootstrap, and run system validation tests.
*   **Prerequisites**: All other phases complete.
*   **Input Documents**: [`bootstrap-overview.md`](file:///D:/VsCode/Java/ai_executive_assistant/docs/bootstrap/bootstrap-overview.md)
*   **Modules Involved**: `modules/bootstrap` (composition root)
*   **Features Covered**: Application main boot class, global configuration, concrete `AgentTool` implementations (e.g. `CreateTaskTool` referencing `TodoPort`), ArchUnit hexagonal and layer guardrails tests, integration E2E scenarios.
*   **Deliverables**:
    *   `AiExecutiveAssistantApplication.java` boot configuration.
    *   Concrete `AgentTool` bridge classes inside `com.assistant.bootstrap.tools` (Bootstrap Tool Bridge Pattern).
    *   Full `ArchitectureTests.java` suite.
    *   End-to-End integration test suite checking user registration -> agent prompt -> plan generation -> user approval -> database execution -> notification.
*   **Exit Criteria**:
    *   Gradle `verify` task runs clean, compile, tests, spotless, spotlessCheck, checkstyle, spotbugs, and ArchUnit rules with 100% success.
    *   End-to-end integration tests execute successfully without cyclic class loading or data leakage between workspaces.

---

## 4. Parallel Development Opportunities

Once Wave I (Phase 1 & 2) is complete, the development team can parallelize efforts across four parallel streams:

```
                            ┌─────────────────────────────────┐
                            │  Phase 2: Workspace & Auth      │
                            └────────────────┬────────────────┘
                                             │
             ┌──────────────────────┬────────┴─────────────┬──────────────────────┐
             ▼                      ▼                      ▼                      ▼
     ┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
     │  Stream A    │       │  Stream B    │       │  Stream C    │       │  Stream D    │
     │  Phase 3     │       │  Phase 4     │       │  Phase 5     │       │  Phase 6     │
     │  (Todo)      │       │  (Calendar)  │       │  (Memory)    │       │(Notification)│
     └───────┬──────┘       └───────┬──────┘       └───────┬──────┘       └───────┬──────┘
             │                      │                      │                      │
             │                      │                      │                      │
             ├──────────────┬───────┘                      └───────┬──────────────┘
             ▼              ▼                                      ▼
     ┌──────────────┐┌──────────────┐                              ┌──────────────┐
     │  Stream E    ││  (Dependency)│                              │  Stream F    │
     │  Phase 7     ││  Todo/Cal    │                              │  Phase 8     │
     │ (Connector)  ││  Ports Ready │                              │   (Agent)    │
     └───────┬──────┘└──────────────┘                              └───────┬──────┘
             │                                                             │
             └──────────────────────────────┬──────────────────────────────┘
                                            ▼
                            ┌─────────────────────────────────┐
                            │  Phase 9: Bootstrap Integration │
                            └─────────────────────────────────┘
```

*   **Core Productivity Parallelism**: Streams A, B, C, and D are compile-time isolated and can run concurrently.
*   **Integration Sequencing**: Stream E (Connector) can begin implementation as soon as the port definitions of Todo, Calendar, and Notification are stable.
*   **Cognitive Core sequencing**: Stream F (Agent) can begin implementation as soon as the Memory ports are defined, running in parallel with the Connector hub.

---

## 5. Risks and Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Workspace Tenant Leakage** (Logical bugs query data from other workspaces) | Critical | Mandate automated Hibernate Filters Condition checks in all JPA mappings. Covered by integration test cases that write data into workspace `A` and assert empty lists when reading via workspace `B` credentials. |
| **AI Agent Circular Dependency** (Agent requires access to Todo/Calendar ports, creating cyclical package imports) | High | Enforce the **Bootstrap Tool Bridge Pattern**: Concrete tools implement the `AgentTool` interface but are declared in the `bootstrap` module. The `agent` module contains zero imports of `com.assistant.todo.*` or `com.assistant.calendar.*`, verified via ArchUnit tests. |
| **Redis Deny-List Downtime** (If Redis cache goes offline, revoked JWT tokens could bypass checks) | High | Implement a **Fail-Closed** security policy in the Token Revocation check. If the Redis client throws a connectivity exception, the Filter rejects the request with HTTP 503 Service Unavailable, preventing security bypasses. |
| **Database Migrations Lockups** (Flyway execution on live PostgreSQL tables blocks transactions) | Medium | Restrict Flyway scripts to backward-compatible statements only (nullable columns, concurrent index creation, and expand-and-contract columns patterns). Verified via reviews. |
| **LLM Inference Latency** (Reasoning/Planning loops take too long, hurting UX) | Medium | Standardize on the Groq API (GroqLLMAdapter) using fast llama-based models for planners. Reserve Google Gemini (GeminiLLMAdapter) for heavy text retrieval (RAG) and fallback tasks. |

---

## 6. Coding Rules

The following structural rules are mandatory for all implementation steps:

### 6.1 Domain Layer Guidelines
> [!IMPORTANT]
> The `domain` package is a pure Java sandbox. Zero framework references are allowed.

*   No Spring framework annotations (`@Component`, `@Service`, `@Autowired`).
*   No database persistence annotations (`jakarta.persistence.*`, `@Entity`, `@Table`).
*   No JSON serialization details (e.g. Jackson annotations like `@JsonProperty`).
*   All aggregates must declare a version tracker (e.g. `version` integer) mapped to JPA optimistic locking.

### 6.2 Dependency Injection
*   Always use **Constructor Injection** for Spring beans.
*   Field injection (`@Autowired` on variables) is strictly forbidden.

### 6.3 Database Auditing and Tenancy
*   Every table must include `workspace_id` (except Auth). Cross-schema SQL JOINs are forbidden.
*   Every table must include standardized audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`). Auditing is automated via Spring Data JPA's `@EntityListeners(AuditingEntityListener.class)`.
*   Audit columns and workspace IDs must only be mapped as soft references (logical columns, no physical foreign key constraints to other schemas).

### 6.4 Soft Deletes
*   Soft-deletable tables (tasks, events) must include `deleted_at` timestamp.
*   Unique indexes on soft-deletable tables must be partial indexes (e.g., `WHERE deleted_at IS NULL`) to avoid blocking new insertions.

### 6.5 Time Storage
*   All date-times must use **ISO-8601 UTC** strings in DTO payloads and `java.time.Instant` or `OffsetDateTime` in Java code.
*   Reminder lead times must be stored as **integer minutes** (not string intervals).

### 6.6 APIs and Error Formats
*   Controllers must accept and return DTO records only. Validate DTO fields using Jakarta validation constraints (`@NotBlank`, `@Size`).
*   Global exceptions must return the standardized **RFC 7807 Problem Details** JSON error shape.
*   Pagination must return the standard envelope and remain **0-indexed** across all endpoints.
