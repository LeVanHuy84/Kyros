# AI Executive Assistant — Developer & AI Agent Implementation Guide

This document is the canonical, execution-oriented **Implementation Guide** for the **AI Executive Assistant** project. It translates all approved architectural decisions, domain models, database schema rules, and design patterns into concrete guidelines.

**This is the primary reference document for developers and AI Coding Agents during development and construction.**

---

## 1. Project Overview

### 1.1 Purpose
The **AI Executive Assistant** is a production-grade, multi-tenant productivity platform. It enables professionals to coordinate their tasks, schedules, notifications, and workflows. At its core is an autonomous **AI Agent** that acts as a cognitive coordinator, executing actions via tools, reflecting on execution outcomes, and utilizing personal workspace memory.

### 1.2 Architecture Summary
The system is built as a **Modular Monolith** ([ADR-0001](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0001-modular-monolith-architecture.md)) to ensure rapid MVP delivery and operational simplicity. Modularity is enforced physically via package/module boundaries, utilizing **Hexagonal Architecture (Ports & Adapters)** per module ([ADR-0002](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0002-hexagonal-architecture-and-layering.md)). Bounded contexts collaborate sideways exclusively through public **inbound ports** or **asynchronous domain events** dispatched via an in-process event bus after database transaction commits ([ADR-0003](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0003-event-driven-communication-and-in-process-bus.md)).

### 1.3 Technology Stack
- **Language**: Java 21 / 25
- **Framework**: Spring Boot 3.x (Spring Data JPA, Spring Security, Spring Web)
- **Database**: PostgreSQL 15+ (with `pgvector` extension for semantic memory, [ADR-0009](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0009-relational-database-engine-and-schema-isolation.md))
- **Transient Cache / Session Store**: Redis (for token deny-list invalidation checks, [ADR-0011](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0011-token-revocation-and-session-management-with-redis.md))
- **Secret Management**: Database-level AES-256 encryption at rest (abstracted via `CredentialVaultPort` interface, ready for HashiCorp Vault transition, [ADR-0010](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0010-persistence-policies-migrations-and-concurrency.md))
- **Database Migrations**: Flyway (SQL-first, [ADR-0010](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0010-persistence-policies-migrations-and-concurrency.md))
- **Primary LLM Provider**: Groq API (primary for fast reasoning) & Google Gemini API (secondary/fallback and RAG, [ADR-0012](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md))
- **Architecture Guardrails**: ArchUnit (run in CI, [ADR-0015](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0015-core-software-design-patterns.md))
- **Containerization**: Docker & Docker Compose ([ADR-0014](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0014-containerized-deployment-and-environment-standardization-via-docker.md))

---

## 2. Project Structure

The project is structured as a partitioned package layout. The base directory contains packages representing bounded contexts, plus the Shared Kernel.

### 2.1 Bounded Context Package Names
All code lives under the base package `com.assistant`. Each context is fully self-contained:
- `com.assistant.auth`: Identity management, registrations, login, JWT token generation.
- `com.assistant.workspace`: Workspace boundaries, memberships, tenant configurations.
- `com.assistant.todo`: Task management, tagging, priorities, recurrence (TODO-001/002/003).
- `com.assistant.calendar`: Schedule management, calendar events, overlaps, reminders.
- `com.assistant.notes`: Reserved supporting context for Markdown documents and RAG files (deferred / placeholder).
- `com.assistant.workflow`: Workflow rules, scheduler triggers, action dispatching (post-MVP).
- `com.assistant.notification`: Notification routing, formatting, and channel dispatch.
- `com.assistant.memory`: Context storage, conversation history, user preferences.
- `com.assistant.agent`: Cognitive orchestration, planner, Tool Registry, approval gateway.
- `com.assistant.connector`: External credential vault and connector hub translation layer.
- `com.assistant.kernel`: Shared Kernel leaf module (no dependencies).

### 2.2 Hexagonal Module Package Structure
Every bounded context must enforce the following sub-packages:
```
com.assistant.<context>
  ├── domain
  │     ├── model         (Aggregates, Entities, Value Objects)
  │     ├── service       (Pure Domain Services)
  │     ├── event         (Context-specific Domain Events)
  │     └── repository    (Outbound Repository Interfaces)
  ├── application
  │     ├── port
  │     │    ├── in       (Inbound Use Case Interfaces / Ports)
  │     │    └── out      (Outbound Port Interfaces, e.g. LLM, Vault, Search)
  │     └── service       (Application Use Case Services implementing inbound ports)
  ├── presentation        (Inbound Adapters - REST, SSE, WebSockets, DTOs)
  └── infrastructure      (Outbound Adapters - JPA entities, Redis clients, HTTP clients, Configs)
```

### 2.3 Shared Kernel Usage
The `com.assistant.kernel` package is a standalone leaf module.
- **Allowed Contents**: Globally shared value objects (e.g. `WorkspaceId`, `UserId`), recurrence rule structures (e.g. RFC 5545 value objects), generic domain event contracts, and workspace context holders.
- **Forbidden Contents**: Spring Framework dependency annotations (except leaf utility annotations), database-specific entities, web-layer controllers, and imports from any bounded context.

---

## 3. Layer Responsibilities

```
Presentation Layer (API)  ──►  Application Layer  ──►  Domain Layer  ◄──  Infrastructure Layer (Config/Adapter)
```

### 3.1 Domain Layer
- **May Do**: Implement core business invariants. Contain pure entities, value objects, and domain services. Declare repository ports (interfaces) and domain event records.
- **May NOT Do**: Import packages starting with `org.springframework.*` (except leaf utility annotations), `jakarta.persistence.*`, or any ORM/JSON libraries (e.g. Jackson). Do not interact with the network, file system, or database.

### 3.2 Application Layer
- **May Do**: Orchestrate use cases, manage transaction boundaries (`@Transactional`), resolve authorization, map domain events, and coordinate port calls.
- **May NOT Do**: Declare framework-specific controller configurations, direct database connectivity code, or external HTTP clients.

### 3.3 Infrastructure Layer (Adapters & Config)
- **May Do**: Implement outbound ports (JPA repositories, Redis clients, Vault encryption adapters, LLM API clients). Expose Spring configuration classes (`@Configuration`, `@Bean`) and house database migration SQL files.
- **May NOT Do**: Bypass public ports to call domain logic directly. Define business validation invariants.

### 3.4 Presentation Layer (API Controllers)
- **May Do**: Expose REST/SSE controllers. Define JSON DTOs and perform input syntax validation (`jakarta.validation`). Decode security context and map exceptions to the standard API response format.
- **May NOT Do**: Manage database transactions. Contain domain business rules. Call database entities directly.

---

## 4. Dependency Rules

Strict compliance with these dependency inversion rules is verified in CI via ArchUnit ([ADR-0015](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0015-core-software-design-patterns.md)).

### 4.1 Allowed and Forbidden Package Dependencies
1. **No Outward Dependencies**: Lower layers cannot depend on outer layers. Code inside `domain` must have zero imports from `application`, `presentation`, or `infrastructure`.
2. **AI Agent Isolation Rule**: Classes in `com.assistant.agent` must depend only on the Tool Registry, `LLMPort`, Memory ports, and `ApprovalRequestPort`. They are strictly forbidden from importing JPA repositories, database models, or services from other contexts (e.g. `com.assistant.todo.*` is forbidden, except for shared interfaces).
3. **Memory Cycle Prevention**: The `memory` context must have zero compile-time references to the `agent` context ([ADR-0006](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0006-memory-agent-decoupling-and-rag-policy.md)). It is an independent data warehouse.
4. **Third-Party SDK Isolation**: Only `connector` and notification channel adapters (in `infrastructure`) are allowed to import SaaS libraries (e.g., Slack SDK, Google API clients).

### 4.2 Cross-Context Communication
All inter-module communication must follow these seams:
- **Synchronous**: Modules invoke another module's public inbound application port (e.g. `connector` calling `TodoPort`). Sideways imports of implementation classes are prohibited.
- **Asynchronous**: Modules publish domain events using Spring's `ApplicationEventPublisher`.

### 4.3 Domain Event Rules
- Event classes must be immutable records defined in the Shared Kernel or public domain event directories.
- Handler methods must run **after-commit** using transaction boundaries to prevent downstream errors from rolling back the primary transaction:
  ```java
  @Async
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handle(CalendarEventCreated event) { ... }
  ```
- Events must only carry primitive types, UUIDs, strongly typed IDs, and lightweight value objects. Never pass Hibernate JPA entities or active objects.
- Use context-specific canonical event names (e.g., `CalendarEventCreated` / `CalendarEventUpdated` / `CalendarEventConflictDetected`) rather than generic names.

---

## 5. Persistence & Database Rules

### 5.1 Repository Rules
- Define repository interfaces in the `domain` layer (e.g., `TaskRepository`).
- Implement repositories in the `infrastructure` layer using Spring Data JPA (e.g. `JpaTaskRepository`).
- Keep JPA entity models (`@Entity`) and mapping annotations strictly inside the `infrastructure` layer. Map them to pure domain models before returning them to the domain/application layer.

### 5.2 Transaction Boundaries
- Declare `@Transactional` at the use-case service level in the **Application** layer.
- Never write database modifications inside a read-only request.

### 5.3 Multi-Tenant Workspace Isolation
- Every database table (except Auth) must include a `workspace_id` column.
- The active tenant is stored in the thread-local `WorkspaceContextHolder` on request entry.
- Implement a Hibernate filter or Spring Data JPA Specification to automatically append `WHERE workspace_id = :workspaceId` to all select queries:
  ```java
  @Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
  ```
- Cross-schema SQL JOINs and foreign key constraints are strictly forbidden. Context relationships are mapped via logical UUID columns resolved in application service code.

### 5.4 Concurrency & Locking
- All aggregate roots must include a `version` integer column mapped to JPA `@Version` to prevent the "Lost Update" problem.
- Failures due to version mismatches must throw an `OptimisticLockingFailureException`.

### 5.5 Soft Delete and Purge Policies
- Tables requiring soft delete (Tasks, Calendar events) must implement a `deleted_at` timestamp column.
- Active rows have `deleted_at IS NULL`. Soft-deleted rows have the timestamp populated.
- **Trash Recovery Window**: Deleted tasks and events are recoverable by the user for a strict **2-hour** inactivity duration, mapped to the user session ([ADR-0010](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0010-persistence-policies-migrations-and-concurrency.md)).
- **Physical Purge**: A background Spring Scheduler runs daily to execute hard `DELETE` commands for rows where `deleted_at` is older than **30 days**.
- **Unique Constraints**: Unique indexes on soft-deletable tables must be partial indexes (e.g., `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`) to avoid blocking new inserts with identical keys.

### 5.6 Standardized Audit Columns
All mutable entities must include standard audit fields to trace modifications:
- `created_at`: `timestamp with time zone` (`NOT NULL`, default `CURRENT_TIMESTAMP`)
- `updated_at`: `timestamp with time zone` (`NOT NULL`, default `CURRENT_TIMESTAMP`)
- `created_by`: `uuid` (`NULLABLE`, soft ID reference to `auth.users`, no foreign key constraint)
- `updated_by`: `uuid` (`NULLABLE`, soft ID reference to `auth.users`, no foreign key constraint)
Automate this via Spring Data JPA's `@EntityListeners(AuditingEntityListener.class)`.

### 5.7 Database Migrations (Flyway)
- All schema modifications must be scripted in SQL.
- Migration files are stored under `src/main/resources/db/migration/<schema-name>/` following naming: `V1.0.0__init_schema.sql`.
- **Zero-Downtime Rule**: Script alterations must be backward-compatible (no immediate column drops, new columns must be nullable).
- **Index creation**: Create indexes concurrently:
  ```sql
  CREATE INDEX CONCURRENTLY idx_tasks_workspace ON todo.tasks(workspace_id);
  ```

### 5.8 Time and Recurrence Storage Rules
- Lead times for reminders are stored as **integer minutes** (not string intervals) so that the scheduler polling query (`NOW() >= event_start - lead_time_minutes`) executes directly.
- Recurrence patterns are stored following RFC 5545 value object structures in the Shared Kernel.

---

## 6. API & Presentation Rules

### 6.1 DTO Mapping and Input Validation
- HTTP controllers accept only request DTO records and return response DTOs.
- Use Jakarta validation annotations on DTO fields to reject syntax errors (e.g. `@NotBlank`, `@Size(min=8)`).
- Perform semantic domain validations in the Application layer, not the controllers.

### 6.2 Standardized Exception Handling & RFC 7807 Error format
Implement a global `@ControllerAdvice` (`GlobalExceptionHandler`) to intercept exceptions and return the standardized RFC 7807 Problem Details JSON error format:
```json
{
  "type": "https://api.assistant.com/errors/validation-failed",
  "title": "Method Argument Not Valid",
  "status": 400,
  "detail": "Password does not meet requirements",
  "instance": "/api/v1/workspaces/a3f12b88-1002-474d-91b1-e8d123456789/tasks",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one digit and one special character"
    }
  ]
}
```

### 6.3 Standardized Pagination Envelope
All offset-paginated endpoints must return a unified pagination envelope shape. Page numbers are **0-indexed** across all contexts (including Todo):
```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```
*Note: Cursor-based pagination (e.g. in the Connector context for sync logs) is an exception, utilizing `nextCursor` and `hasMore`.*

### 6.4 Date-Time Formatting
- All date-times in requests and responses must use **ISO-8601 UTC** string format (e.g., `YYYY-MM-DDTHH:mm:ss.SSSZ`).
- In Java, use `java.time.Instant` or `java.time.OffsetDateTime` (UTC) to represent date-times.

---

## 7. AI & Connector Implementation

### 7.1 LLM Port Abstraction
- The Agent context interacts with LLM providers through the `LLMPort` interface ([ADR-0012](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md)).
- **GroqLLMAdapter**: Configured as the primary adapter. Connects to Groq API using fast models (e.g., Llama 3) to execute sequential planning and reflection steps in sub-second inference speed.
- **GeminiLLMAdapter**: Configured as the secondary/fallback adapter. Connects to Google Gemini API for complex reasoning tasks, large contexts, and RAG searches.

### 7.2 Tool Registry Gateway
- The `ToolRegistry` is the exclusive gateway for all Agent actions ([ADR-0004](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0004-agent-sandbox-and-tool-registry.md)).
- Every tool implements `AgentTool`, defining a name, JSON schema description, and execution logic.
- Before executing, a tool **must** extract the active `WorkspaceId` from `WorkspaceContextHolder` and validate permissions on the targeted ports.
- Tools invoke inbound ports (e.g., `TodoPort`), never database tables directly. On success/failure, publish a `ToolExecuted` event.

### 7.3 Connector SPI
- The Connector Hub defines `ExternalProviderPort` as its plugin SPI ([ADR-0008](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0008-connector-hub-and-credential-security.md)).
- Access credentials (OAuth tokens, API keys) must only be accessed through the `CredentialVaultPort` which encrypts secrets at rest using AES-256.

### 7.4 Notification & Slack Urgency Routing
- Notification urgency gating (e.g. restricting Slack delivery to "Urgent/Critical" messages) is owned and evaluated inside the **Notification** context based on user profiles ([ADR-0012](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md)).
- The Connector Hub's Slack adapter acts purely as a transport channel, executing requests dispatched by the Notification module.

### 7.5 Workflow Engine Division
- **In-App Engine**: Evaluates rule objects defined in the database when matching domain events occur ([ADR-0013](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0013-workflow-automation-engine-decision-in-app-vs-n8n.md)).
- **n8n Integration**: When complex external integrations are triggered, the n8n adapter dispatches webhooks to an external n8n instance, outsourcing heavy SaaS API sequencing.

---

## 8. Security Rules

### 8.1 JWT Authentication & Session Deny-list (Redis)
- The presentation gateway decodes JWT session tokens.
- Invalidated tokens are tracked via Redis ([ADR-0011](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0011-token-revocation-and-session-management-with-redis.md)). On logout, the JWT identifier `jti` is written to Redis as a key (`revoked:jti`) with a TTL matching the token's expiry.
- The auth gateway checks Redis on every request ($O(1)$ read).
- If Redis is unreachable, the system must **fail-closed** (reject requests with `503 Service Unavailable`) to prevent security bypasses.
- Session events are persisted in `auth.session_events` database schema as an append-only audit trail.

---

## 9. Coding Conventions

- **Variable Names**: CamelCase for classes (`TaskService`), camelCase for methods/variables (`createTask`), snake_case for database entities (`due_date`), and SCREAMING_SNAKE_CASE for constants.
- **Dependency Injection**: Always use **Constructor Injection** for Spring beans. Avoid field injection (`@Autowired` on fields) to keep services unit-testable.
- **Class Sizes**: Classes should remain highly cohesive and focused (e.g. use cases should define a single `execute` method).
- **Logging**: Use SLF4J loggers. Log input parameters at `DEBUG` level and transactional events at `INFO` level. Never log raw passwords, access tokens, or sensitive user PII.

---

## 10. Testing Guidelines

### 10.1 Unit Testing
- Test core domain logic and application use cases using standard JUnit 5 tests.
- Use mock libraries (Mockito) or in-memory fakes to substitute port adapters.
- Unit tests must not load the Spring ApplicationContext. They must run in sub-second speed.

### 10.2 Integration Testing
- Use Testcontainers to run PostgreSQL and Redis in docker instances for database and gateway integration tests.
- Load the full database migrations using Flyway before running tests.

### 10.3 Architecture Compliance
- Write an ArchUnit test suite to verify module isolation rules (e.g. ensuring `domain` has no external dependencies, and `agent` only communicates through tools).

### 10.4 Test Package Organization
- Test code must reside in `src/test/java` and mirror the package structure of the code under test (e.g. `com.assistant.todo.domain.model` tests live in the same package path under `src/test/java`).
- Unit test classes must be suffixed with `Test` (e.g., `TaskTest.java`).
- Integration test classes must be suffixed with `IT` (e.g., `TaskRepositoryIT.java` or `TodoUseCaseIT.java`).
- ArchUnit compliance tests reside in a dedicated compliance package: `com.assistant.architecture`.

---

## 11. Developer Implementation Checklist

Before submitting code, developers and AI Agents must verify completion of this checklist:

- [ ] **Domain Separation**: No Spring/JPA annotations are imported inside the `domain` sub-package.
- [ ] **Workspace Isolation**: Database queries explicitly include the `workspace_id` filter (or Hibernate filter is active).
- [ ] **Locking & Auditing**: The JPA model contains `@Version` and standard audit fields (`created_at`, `updated_at`, `created_by`, `updated_by`).
- [ ] **Partial Indexes**: Soft-deletable tables declare partial indexes (`WHERE deleted_at IS NULL`) for unique keys.
- [ ] **Time Standard**: All date-times in Java are `Instant` or `OffsetDateTime` (UTC), and DTO payloads format date-times as ISO-8601 UTC.
- [ ] **Reminder Integers**: Reminder lead times are stored as integer minutes.
- [ ] **Seam Routing**: Cross-context references are resolved via public Java inbound ports, not sideways service imports.
- [ ] **Event Listeners**: Downstream side-effects listen to domain events asynchronously `AFTER_COMMIT` and use canonical event names.
- [ ] **Validation & Formatting**: JSON payloads are validated via DTO annotations, exceptions map to the standardized RFC 7807 Problem Details format, and offset pagination is 0-indexed using the standard envelope.
- [ ] **Redis Deny-List**: Session invalidations write to Redis, and gateway check exceptions fail-closed.
- [ ] **Test Coverage**: Unit tests cover core domain invariants, integration tests run with Flyway migrations via Testcontainers, and ArchUnit tests pass without package import violations.
