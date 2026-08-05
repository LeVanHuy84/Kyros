# Consolidated Architecture Decision Records (ADR)

This document consolidates all 15 Architecture Decision Records (ADRs) for the **AI Executive Assistant** project into a single, unified reference. It is designed to be easily shared with external AI coding assistants or used as a comprehensive offline architectural reference.

---

## Table of Contents

1. [ADR-0001: Adoption of Modular Monolith Architectural Style](#adr-0001-adoption-of-modular-monolith-architectural-style)
2. [ADR-0002: Hexagonal (Ports & Adapters) per Module and Strict Layering](#adr-0002-hexagonal-ports--adapters-per-module-and-strict-layering)
3. [ADR-0003: Asynchronous Event-Driven Communication with In-Process Bus](#adr-0003-asynchronous-event-driven-communication-with-in-process-bus)
4. [ADR-0004: Agent Sandbox and Exclusive Tool Registry Gateway](#adr-0004-agent-sandbox-and-exclusive-tool-registry-gateway)
5. [ADR-0005: Human-in-the-Loop Approvals and Self-Reflection Limits](#adr-0005-human-in-the-loop-approvals-and-self-reflection-limits)
6. [ADR-0006: Memory-Agent Decoupling and RAG Grounding Policies](#adr-0006-memory-agent-decoupling-and-rag-grounding-policies)
7. [ADR-0007: Workspace-Scoped Multi-Tenancy and Data Isolation](#adr-0007-workspace-scoped-multi-tenancy-and-data-isolation)
8. [ADR-0008: Connector Hub Anti-Corruption Layer and Credential Vault Security](#adr-0008-connector-hub-anti-corruption-layer-and-credential-vault-security)
9. [ADR-0009: Relational Database Selection and Schema-per-Context Isolation](#adr-0009-relational-database-selection-and-schema-per-context-isolation)
10. [ADR-0010: Database Migration, Soft Delete, and Concurrency Policies](#adr-0010-database-migration-soft-delete-and-concurrency-policies)
11. [ADR-0011: Token Revocation and Session Invalidation with Redis](#adr-0011-token-revocation-and-session-invalidation-with-redis)
12. [ADR-0012: LLM Provider Selection and Low-Latency Inference with Groq](#adr-0012-llm-provider-selection-and-low-latency-inference-with-groq)
13. [ADR-0013: Workflow Automation Engine Decision — In-App Engine vs. n8n Integration](#adr-0013-workflow-automation-engine-decision-in-app-vs-n8n-integration)
14. [ADR-0014: Containerized Deployment and Environment Standardization via Docker](#adr-0014-containerized-deployment-and-environment-standardization-via-docker)
15. [ADR-0015: Adoption of Core Software Design Patterns](#adr-0015-adoption-of-core-software-design-patterns)

---

## ADR-0001: Adoption of Modular Monolith Architectural Style

### Status
Approved

### Context
The AI Executive Assistant requires multiple highly distinct domains (Authentication, Workspace Tenancy, Todo, Calendar, AI Agent, Memory, Connectors, Notifications) to work together. Key requirements include a short time-to-market, low operational and deployment overhead, and simple local-first development. At the same time, because of security boundaries (Workspace Tenancy) and potential high loads on cognitive agent components, the system must remain structured in a way that allows future extraction of individual modules into microservices.

### Decision
We adopt a **Modular Monolith** deployment style. The application will build and deploy as a single process (Spring Boot application). The codebase will be strictly partitioned into cohesive modules corresponding to bounded contexts. Modules are prohibited from sharing databases or referencing class implementations sideways except through explicit ports or domain events. Development is phased into **MVP modules** (Auth, Workspace, Todo, Calendar, Notification, Memory, AI Agent, Connector SPI) and **Full/Deferred modules** (Workflow, Notes, Semantic Memory, RAG) to focus engineering effort.

### Evidence
- [architecture.md:L3-L14](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L3-L14)
- [architecture.md:L17-L29](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L17-L29)
- [architecture.md:L226-L228 (AD-001)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L226-L228)
- [architecture-v2.md:L137-L138 (AD-001)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L137-L138)
- [architecture-v2.md:L154-L155 (AD-018)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L154-L155)
- [architecture-v2.md:L201-L228 (§3 Phasing)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L201-L228)
- [context-map.md:L11-L22 (§1 Executive Summary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L11-L22)
- [context-map.md:L425-L439 (§13 Context Evolution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L425-L439)

### Alternatives
- **Microservices Architecture**: Considered and rejected. Although microservices provide strong physical isolation, they introduce high operational complexity, deployment overhead, network latency, distributed transaction issues, and slower development speed for a phase-one MVP.

### Consequences
#### Positive
- **Operational Simplicity**: Single build, single deployment pipeline, and straightforward local testing.
- **Strong Gateway Security**: Single gateway authentication allows unified workspace resolution.
- **Refactoring & Extraction Seams**: Code is ready for microservice extraction; moving a module (like the CPU/token-intensive AI Agent) to a microservice requires replacing only the local adapters with network/gRPC adapters without altering domain logic.

#### Negative
- **Shared Resources**: The application runs in a single JVM, meaning a memory leak or CPU starvation in one module (e.g. AI Agent or Connector) can impact the entire system.
- **Build Synchronization**: Code changes across different modules require building and deploying the entire monolith.

### Implementation Notes
- Establish strict packages per bounded context: `com.assistant.auth`, `com.assistant.workspace`, `com.assistant.todo`, `com.assistant.calendar`, `com.assistant.agent`, `com.assistant.memory`, `com.assistant.notification`, `com.assistant.connector`, and `com.assistant.kernel` (Shared Kernel leaf JAR).
- Use build tools (like Gradle multi-projects or Maven submodules) and automated verification tests (e.g. ArchUnit) to verify and enforce modular boundaries in CI.

---

## ADR-0002: Hexagonal (Ports & Adapters) per Module and Strict Layering

### Status
Approved

### Context
Traditional 3-tier layering architectures (Presentation → Business → Data Access) couple business domain logic to database schemas, ORM frameworks, and communication libraries. For the AI Executive Assistant, which must integrate with various external platforms (e.g. Google Calendar, Outlook, Slack, Jira) and support different LLM backends (e.g. Gemini, OpenAI), database schemas or external API changes could ripple through and break core business rules. Additionally, testing business rules in isolation becomes difficult when they depend directly on databases or external services.

### Decision
We enforce **Hexagonal Architecture (Ports & Adapters)** boundaries **per module** combined with **strict layering** pointing inward toward the Domain:
$$\text{Presentation} \longrightarrow \text{Application} \longrightarrow \text{Domain} \longleftarrow \text{Infrastructure}$$

1. **Domain Layer**: Contains entities, value objects, domain services, domain events, and repository/outbound interfaces. It is entirely framework-agnostic (no Spring annotations, JPA, Hibernate, or Jackson serialization details).
2. **Application Layer**: Implements use cases and coordinates transaction boundaries, events, and port mappings.
3. **Infrastructure Layer**: Implements outbound ports (repositories, API clients, vector stores) and handles framework dependencies.
4. **Presentation Layer**: Handles REST, Server-Sent Events, or WebSockets, and maps payloads to Application layer commands.
5. **Seams**: Direct cross-module imports are prohibited. Modules communicate sideways only via public **inbound ports** (as Java interfaces) or published **domain events**.

### Evidence
- [architecture.md:L59-L84 (Layered Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L59-L84)
- [architecture.md:L86-L113 (Hexagonal Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L86-L113)
- [architecture-v2.md:L28-L30 (Hexagonal contradiction)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L28-L30)
- [architecture-v2.md:L42-L47 (ISS-01)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L42-L47)
- [architecture-v2.md:L120-L121 (Hexagonal recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L120-L121)
- [architecture-v2.md:L138 (AD-002)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L138)
- [architecture-v2.md:L151 (AD-015)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L151)
- [architecture-v2.md:L295-L312 (Final Layered Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L295-L312)
- [context-map.md:L255-L264 (Context Communication)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L255-L264)
- [context-map.md:L370-L380 (§11 Dependency Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L370-L380)

### Alternatives
- **Standard 3-Tier Layering**: Rejected. Leaks database schema details and ORM annotations (like JPA `@Entity` or Spring's `@Service`) into domain logic, violating testability, separation of concerns, and future microservice extraction goals.

### Consequences
#### Positive
- **High Testability**: Core domain and application services can be fully tested in seconds using simple Java unit tests and in-memory fakes for port interfaces (no Spring Boot test container required).
- **Technology Independence**: Replacing PostgreSQL, changing the vector store from pgvector to Qdrant, or updating the LLM provider does not modify any code in the Domain layer.
- **Microservices-Ready Seams**: Clean boundaries make extraction simple.

#### Negative
- **Boilerplate & Overhead**: Requires mapping objects across layers (e.g. mapping a JPA Entity in the Infrastructure layer to a Domain Entity in the Domain layer, and mapping a Domain Entity to a DTO in the Presentation layer).
- **Cognitive Overhead**: Developers must maintain strict discipline regarding package imports and dependency inversion.

### Implementation Notes
- Domain classes must not import packages starting with `org.springframework`, `jakarta.persistence`, or any external client library.
- Repository interfaces reside in the Domain layer, while their SQL/JPA implementations reside in the Infrastructure layer.
- Configure ArchUnit rules to verify that no class in `..domain..` depends on `..infrastructure..`, `..presentation..`, or any third-party framework package.

---

## ADR-0003: Asynchronous Event-Driven Communication with In-Process Bus

### Status
Approved

### Context
Many business flows in the AI Executive Assistant span multiple domains. For example, when a new task is created, notifications may need to be dispatched, the Connector context must synchronize the task to external productivity providers, and the Workflow engine might evaluate rules. Direct synchronous method calls between contexts would couple their compile-time dependencies, cascade runtime failures (e.g. an external API timeout in the Connector rollback the primary task creation), and increase database transaction lock times.

### Decision
We adopt **Asynchronous Event-Driven Communication** for cross-module side-effects:

1. **In-Process Bus**: During the initial phases, we use Spring’s `ApplicationEventPublisher` as the in-process event bus to avoid broker operational overhead.
2. **Transaction Boundaries (After-Commit)**: Event handlers are registered using after-commit transactional semantics (`TransactionPhase.AFTER_COMMIT`). This ensures that side-effects execute only after the primary database transaction successfully commits.
3. **Published Language**: Integration events are defined within the **Shared Kernel** leaf module. To prevent domain leakage, events contain only primitive identifiers (e.g., `TaskId`, `WorkspaceId`) and simple, immutable Value Objects (e.g., event timestamps), never JPA entities or internal aggregate objects.
4. **Namespace Integrity**: Canonical event names are used to prevent namespace collisions (e.g. renaming generic event names like `EventCreated` to context-specific ones like `CalendarEventCreated`).

### Evidence
- [architecture.md:L178-L208 (Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L178-L208)
- [architecture.md:L230-L231 (AD-003)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L230-L231)
- [architecture-v2.md:L126-L128 (Canonical events recommendations)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L126-L128)
- [architecture-v2.md:L139 (AD-003)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L139)
- [architecture-v2.md:L153 (AD-017)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L153)
- [architecture-v2.md:L398-L422 (§10 Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L398-L422)
- [context-map.md:L265-L271 (Asynchronous Communication)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L265-L271)
- [context-map.md:L300-L324 (§8 Domain Event Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L300-L324)

### Alternatives
- **Synchronous Method Calls**: Rejected. Fails to decouple modules. Makes transaction boundaries fragile and increases the likelihood of system failure if any single downstream module is unhealthy.
- **External Message Broker (Kafka/RabbitMQ)**: Deferred. While ideal for a distributed microservices setup, launching an external broker in phase one would introduce unnecessary deployment and local development overhead. The in-process event bus acts as an ideal seam that can be swapped for an external broker later.

### Consequences
#### Positive
- **High Decoupling**: Producers publish events without knowing who consumes them.
- **Improved Performance**: The main user transaction finishes quickly without waiting for slow notifications or third-party API syncs.
- **Transactional Safety**: A failure in the Slack connector or email notification will not roll back the user's primary task creation or event updates.

#### Negative
- **Eventual Consistency**: Side-effects occur asynchronously. There is a slight delay before the notification is dispatched or the task is synced.
- **No Global Rollbacks**: If task creation succeeds but email sync fails, the system must handle the sync retry or error state gracefully, rather than rolling back.

### Implementation Notes
- Publish events using `ApplicationEventPublisher.publishEvent()`.
- Annotate event listener methods in consuming modules with `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
- Use `@Async` annotations on listener methods to ensure they execute on a separate thread pool and do not block the caller.
- Handle failures within listeners using bounded retries and logging to prevent silent event drop.

---

## ADR-0004: Agent Sandbox and Exclusive Tool Registry Gateway

### Status
Approved

### Context
The AI Agent decomposes high-level user goals into structured actions and executes them. If the Agent had direct access to the database or internal domain services, it would be extremely difficult to enforce tenant boundaries (Workspace Tenancy), validate execution safety, and maintain a reliable audit trail. An LLM could generate SQL queries that bypass business rules, cause data corruption, or leak private data across workspaces (e.g. via prompt injection).

### Decision
We enforce a strict **Agent Sandbox** using a **Tool Registry** as the exclusive gateway for all AI Agent actions:

1. **No Direct Storage Access**: The AI Agent context is strictly isolated. It has no access to repository interfaces or database schemas of other modules.
2. **Exclusive Tool Gateway**: The AI Agent interacts with the rest of the application solely via registered tools in an in-module Tool Registry.
3. **Cognitive Port Limits**: The AI Agent module's allowed external dependencies are restricted to the Tool Registry, `LLMPort` (for LLM client abstraction), Memory ports, and `ApprovalRequestPort`.
4. **Tool Adapters**: Tools in the registry act as adapter classes. They accept JSON arguments from the Agent, validate them, verify active Workspace permissions, and delegate execution to the respective module's public inbound ports (e.g. `TodoPort`, `CalendarPort`).
5. **Audit Logging**: Every tool execution is recorded in an immutable audit log by publishing a `ToolExecuted` domain event.

### Evidence
- [architecture.md:L13-L14 (Workspace boundary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L13-L14)
- [architecture.md:L141-L145 (Tool Registry)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L141-L145)
- [architecture.md:L231-L232 (AD-004)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L231-L232)
- [architecture-v2.md:L67-L72 (ISS-05)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L67-L72)
- [architecture-v2.md:L123-L125 (Agent isolation recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L123-L125)
- [architecture-v2.md:L140 (AD-004)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L140)
- [architecture-v2.md:L152 (AD-016)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L152)
- [architecture-v2.md:L363-L367 (Tool Registry Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L363-L367)
- [context-map.md:L382-L385 (Agent Tool Isolation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L382-L385)

### Alternatives
- **Direct Database / Service Access**: Rejected. Exposing JPA repositories or concrete service beans to the AI Agent planning loop presents high security risks, prevents auditing, and breaks workspace isolation boundaries.
- **Shared Domain Libraries**: Rejected. Allowing the Agent to instantiate domain entities directly would bypass business rules and validators.

### Consequences
#### Positive
- **Guaranteed Security**: Workspace isolation is checked at the entry point of every tool execution, eliminating data leakage risk.
- **Traceability**: An immutable trail records every tool action, parameter, and output status, which is vital for security audit and debugging.
- **Robust Domain Isolation**: Changes to the database tables or domain structures in `Todo` or `Calendar` do not affect the AI Agent, provided their public ports remain stable.

#### Negative
- **Integration Overhead**: Adding a new user capability requires writing a tool class in the Agent context and declaring its JSON schema description for the LLM.
- **JSON Overhead**: Small performance cost due to serializing tool arguments and outputs to/from JSON strings.

### Implementation Notes
- Declare tool classes inside `com.assistant.agent.tool`. Each tool implements a common `AgentTool` interface defining name, description, JSON schema, and execution logic.
- The execution method in the tool must retrieve the active `WorkspaceId` from the security context and validate it before invoking target ports.
- Enforce the isolation rule via ArchUnit: classes in `com.assistant.agent` must not reference classes in `com.assistant.todo.infrastructure` or `com.assistant.calendar.infrastructure`.

---

## ADR-0005: Human-in-the-Loop Approvals and Self-Reflection Limits

### Status
Approved

### Context
Non-deterministic LLM behavior can lead to serious operational issues:
1. **Unintended Actions**: An agent could execute incorrect tools (e.g. deleting crucial events, sending emails with errors, or generating tasks with bad data from external email extraction).
2. **Infinite Loops**: When a tool execution fails, the agent might reflect and re-plan indefinitely, leading to runaway LLM token costs and system degradation.

### Decision
We enforce user-control safeguards via **Human-in-the-Loop (HITL) Approvals** and **Self-Reflection Limits**:

1. **Mandatory Approvals**: The AI Agent must halt execution and request explicit user confirmation before:
   - Executing any multi-step generated plan.
   - Creating tasks extracted from incoming emails (when the email sync connector is active).
2. **Hard Loop Boundary**: The AI Agent's self-reflection and re-planning loop is restricted to a maximum of **3 automatic attempts** per goal.
3. **Escalation Policy**: If a plan fails after 3 re-planning attempts, or if an unrecoverable failure occurs, the agent must immediately suspend execution, preserve the state, and escalate to the user with a summary of the issue.

### Evidence
- [architecture.md:L120-L123 (Planner limits)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L120-L123)
- [architecture.md:L146-L150 (Approval Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L146-L150)
- [architecture.md:L232-L235 (AD-005, AD-006)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L232-L235)
- [architecture-v2.md:L141-L142 (AD-005, AD-006)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L141-L142)
- [architecture-v2.md:L354-L356 (Planner limits)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L354-L356)
- [architecture-v2.md:L368-L372 (Approval Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L368-L372)
- [requirements/user-stories-v2.md:L287-L308 (AI-001 - Human confirmation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L287-L308)
- [requirements/user-stories-v2.md:L331-L351 (AI-003 - Re-planning limit)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L331-L351)
- [requirements/user-stories-v2.md:L521-L542 (CON-004 - Email task confirmation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L521-L542)

### Alternatives
- **Fully Autonomous Execution**: Considered and rejected. Although fully autonomous execution provides high automation, it violates user safety, data privacy, and executive control principles.
- **Interactive Step-by-Step Approvals**: Considered and rejected. Asking the user to confirm every single minor tool call creates high friction and a poor user experience. The plan-level approval strikes the right balance.

### Consequences
#### Positive
- **Execution Safety**: High-risk operations (e.g. bulk modifications) cannot happen without explicit user consent.
- **Cost Controls**: The 3-attempt reflection ceiling prevents infinite agent loops that could result in high LLM API invoices.
- **User Trust**: Surfacing plan previews to the user before running them increases trust in the system's decisions.

#### Negative
- **Latency / Blocking**: Agent execution remains suspended until the user resolves the approval request, preventing fully hands-off automation.
- **State Management**: The application must support durable, long-running agent execution states that survive application restarts while waiting for user approvals.

### Implementation Notes
- Persist agent plans in the `agent.plans` database table with states: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXECUTING`, `COMPLETED`, `FAILED`.
- Submit approvals through `ApprovalRequestPort`, which publishes an `ApprovalRequested` event to notify the user. Expose a REST controller for the user to resolve approvals (`ApprovalResolved` event).
- Implement a counter in the executor loop. If the execution fails and the count is `< 3`, invoke the Planner to generate a correction. If `count >= 3`, publish a failure notification and halt.

---

## ADR-0006: Memory-Agent Decoupling and RAG Grounding Policies

### Status
Approved

### Context
Personalization and grounding are critical to the AI Executive Assistant's performance. The system utilizes conversation history, user preferences, and documents to personalize the assistant. However, this creates architectural risks:
1. **Circular Dependencies**: If the Memory context depends on the AI Agent's models (e.g. for fact extraction) and the Agent depends on Memory for context, it creates a package dependency cycle.
2. **Boundary Drift**: Mixing documents (Notes/Knowledge) and conversation histories/preferences (Memory) into a single module pollutes schemas and limits scalability.
3. **Hallucinations**: Without strict grounding rules, the agent could make up facts when answering user queries about their documents.

### Decision
We enforce strict boundary separation and safety policies for RAG and Memory:

1. **Cycle Prevention**: The Memory context has **no dependency** on the AI Agent context. It never imports agent models. The Agent drives memory interactions by calling inbound ports (`ConversationHistoryPort`, `MemoryStorePort`) or by publishing domain events.
2. **Notes Boundaries**: Notes (Knowledge Base) is a reserved, separate context, deferred as an inactive placeholder until Notes CRUD requirements are approved. It is not merged into Memory.
3. **RAG Grounding Policy**: For RAG search, all responses must be strictly grounded in active workspace documents with mandatory source citations.
4. **Hallucination Safeguard**: If no workspace documents support the answer to a query, the agent must state "I do not know" instead of fabricating information.

### Evidence
- [architecture.md:L125-L129 (Grounding policies)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L125-L129)
- [architecture.md:L234-L235 (AD-007)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L234-L235)
- [architecture-v2.md:L48-L54 (ISS-02 - Notes owned by two boundaries)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L48-L54)
- [architecture-v2.md:L55-L60 (ISS-03 - Memory dependency cycle)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L55-L60)
- [architecture-v2.md:L121-L122 (Notes and Memory recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L121-L122)
- [architecture-v2.md:L142-L143 (AD-007)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L142-L143)
- [architecture-v2.md:L149-L150 (AD-013, AD-014)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L149-L150)
- [context-map.md:L380-L382 (Memory Cycle Prevention)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L380-L382)
- [context-map.md:L447-L450 (Notes and Memory Boundary Resolution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L447-L450)
- [requirements/user-stories-v2.md:L353-L373 (AI-004 - Grounding requirement)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L353-L373)

### Alternatives
- **Merge Notes and Memory**: Rejected. While simpler in the short term, documents have different lifecycle, storage, and indexing profiles than conversation streams, and merging them creates a messy domain model.
- **Permissive LLM Generation**: Rejected. Letting the LLM generate answers from its pre-trained weights without grounding documentation violates security and correctness constraints.

### Consequences
#### Positive
- **High Cohesion**: Clean package separation; Memory and Notes can scale or be extracted separately.
- **Traceability**: All grounded answers contain clickable markdown source document citations.
- **Safety**: Hallucinations are minimized, ensuring the assistant is trustworthy.

#### Negative
- **Grounding Limitations**: The agent will decline to answer basic user queries if they cannot be mapped to a stored note or chat history.
- **Complex UI**: The frontend must support citation rendering and document source links.

### Implementation Notes
- Memory exposes `ConversationHistoryPort` (to append/retrieve turns) and `MemoryStorePort` (to save preferences).
- RAG and long-term semantic memory (pgvector/Qdrant) are post-MVP features. Implement basic session memory for MVP.
- Verify through ArchUnit that `com.assistant.memory` has zero compile-time references to `com.assistant.agent`.

---

## ADR-0007: Workspace-Scoped Multi-Tenancy and Data Isolation

### Status
Approved

### Context
The AI Executive Assistant is a multi-tenant platform. Every user operates within a Workspace, which acts as the primary data boundary. The assistant manages highly sensitive executive context, including calendars, tasks, memories, and access tokens for external systems. Any leakage of data across workspace boundaries is a critical security failure. To prevent this, data scoping must be robust, easy to enforce, and verified at every boundary.

### Decision
We enforce **Workspace-Scoped Multi-Tenancy** as the absolute security boundary:

1. **Gateway Resolution**: The user's active workspace tenant is resolved at the presentation gateway during authentication.
2. **Context Propagation**: Once resolved, the active `WorkspaceId` is bound to a secure thread-local context (`WorkspaceContextHolder`).
3. **Port Validation**: Every inbound port method must retrieve the `WorkspaceId` from the context and validate that the executing user has access to the workspace.
4. **Data Isolation**: All database tables containing user-owned data (Tasks, Calendar events, Memory logs, Connector profiles) must include a `workspace_id` column. Direct database SQL joins or foreign keys across schemas are forbidden to prevent bypassing workspace boundaries.
5. **Shared Kernel Identifier**: `WorkspaceId` is defined as a strongly typed Value Object in the Shared Kernel leaf module to allow type-safe propagation across contexts.

### Evidence
- [architecture.md:L13-L14 (Workspace boundary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L13-L14)
- [architecture.md:L235-L237 (AD-009)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L235-L237)
- [architecture-v2.md:L145 (AD-009)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L145)
- [architecture-v2.md:L285-L289 (Phasing context)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L285-L289)
- [context-map.md:L195-L205 (Workspace Multi-Tenancy map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L195-L205)
- [context-map.md:L262-L264 (Workspace Scoping)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L262-L264)
- [context-map.md:L386-L387 (No Database Sharing)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L386-L387)
- [database-overview.md:L135-L163 (§8 Cross-Context Relationship Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L135-L163)

### Alternatives
- **Database / Schema-per-Tenant**: Considered and rejected. Although separating databases or schemas per user workspace provides the highest isolation, it introduces extreme operational overhead, makes database schema migrations complex, and scales poorly on a single database instance.
- **Purely Application-Level Scoping**: Considered and rejected. Relying on developers to manually write workspace filters in every query without a central context holder and automated checks is highly error-prone.

### Consequences
#### Positive
- **Strong Isolation**: A unified boundary is checked at the authentication gateway, protecting all database records.
- **Simpler Business Code**: Application services retrieve the current workspace context implicitly instead of requiring it as a parameter in every method signature.
- **Independent Contexts**: Deleting a workspace publishes a `WorkspaceDeleted` event, allowing each module to clean up its local schema tables asynchronously.

#### Negative
- **Query Complexity**: Custom database queries must explicitly include `workspace_id = :workspaceId` to prevent full table scans and leakages.
- **Cross-Workspace Workflows**: Relational data structures cannot be queried directly using joins across modules (e.g. joining workspace profiles with tasks), requiring application-level assembly.

### Implementation Notes
- Implement a thread-local `WorkspaceContextHolder` in the Shared Kernel or Workspace context.
- Use Spring Security filters to decode the JWT, extract the active workspace claim, and populate the context.
- All JPA entities must use Hibernate filters or Spring Data JPA specifications to automatically append the `workspaceId` condition to select queries.
- Build composite indexes on tables containing `(workspace_id, ...)` to optimize query speed and prevent sequential table scans.

---

## ADR-0008: Connector Hub Anti-Corruption Layer and Credential Vault Security

### Status
Approved

### Context
The AI Executive Assistant integrates with multiple third-party SaaS platforms (Google Calendar, Outlook, Slack, GitHub, Notion, Jira, TickTick). Directly coupling the core domains (Todo, Calendar) to external APIs would leak third-party data formats and schema details into internal code, leading to fragility when external APIs change. Additionally, the system must securely manage highly sensitive OAuth refresh tokens, API keys, and email credentials.

### Decision
We decouple integrations using a centralized **Connector Hub** and secure credential handling:

1. **Anti-Corruption Layer (ACL)**: The Connector Hub acts as an ACL. It maps external JSON payloads into native domain value objects and routes operations through public ports (`TodoPort`, `CalendarPort`). Internal domain logic remains completely unaware of external provider models.
2. **Credential Vault**: All access tokens, passwords, and API keys are stored encrypted at rest. Credential read/write operations must go through a secure `CredentialVaultPort` interface, shielding domain code from KMS or filesystem specifics.
3. **SPI-First Strategy**: The Connector module provides a plugin Service Provider Interface (SPI). Third-party connectors are implemented as external plugins matching `ExternalProviderPort`, keeping the core codebase slim.
4. **Decoupled Urgency Logic**: Slack and email notification delivery limits (such as restricting Slack delivery to "Urgent/Critical" messages) are owned by the **Notification** module, not the Connector Hub. The Connector Hub acts purely as the delivery transport.

### Evidence
- [architecture.md:L153-L176 (Connector Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L153-L176)
- [architecture.md:L235-L239 (AD-008, AD-010)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L235-L239)
- [architecture-v2.md:L79-L84 (ISS-07 - Slack urgency ownership split)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L79-L84)
- [architecture-v2.md:L124-L125 (Connector recommendations)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L124-L125)
- [architecture-v2.md:L143-L148 (AD-008, AD-010, AD-012)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L143-L148)
- [architecture-v2.md:L378-L387 (Connector Architecture baseline)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L378-L387)
- [context-map.md:L326-L350 (§9 Anti-Corruption Layer Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L326-L350)
- [context-map.md:L388-L390 (External SDK leakage prevention)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L388-L390)

### Alternatives
- **Direct Integration**: Considered and rejected. Allowing modules like Todo or Calendar to directly reference external SDKs or call third-party APIs results in a brittle codebase where external API deprecations cause compilation and execution failures inside core business domains.
- **Plaintext Secret Storage**: Rejected. Storing OAuth tokens and secrets in standard database columns without encryption poses severe security risks and violates basic compliance standards.

### Consequences
#### Positive
- **Stability**: Internal task and scheduling logic remains unchanged when an external provider updates its API version.
- **Extensibility**: Adding a new integration requires only implementing a new `ExternalProviderPort` adapter inside the Connector context.
- **Enhanced Security**: Credentials are encrypted at rest using system-level KMS or vault mechanisms.

#### Negative
- **Mapping Overhead**: Developers must write translation code to map objects between third-party formats and internal value objects.
- **Rate-Limit Handling**: The Connector Hub must manage complex rate-limiting, retries, and network timeouts.

### Implementation Notes
- Define connector adapters in `com.assistant.connector.adapter`. Standardize incoming payloads through mappings to Shared Kernel types.
- Restrict imports: only the `Connector` and `Notification` channel adapters may import external SDK libraries (e.g. Google APIs Client, Slack Web API).
- Secure the vault behind the `CredentialVaultPort` interface, allowing database-level AES-256 encryption in phase one and transitioning to HashiCorp Vault in later phases.

---

## ADR-0009: Relational Database Selection and Schema-per-Context Isolation

### Status
Approved

### Context
The AI Executive Assistant requires:
1. **Strong Relational Integrity**: Scheduling algorithms (Calendar overlap prevention, recurrence calculations) and task states require strict ACID transactions and relational constraints.
2. **Semi-structured Data**: Integration connectors, notification templates, and tool invocation payloads use dynamic parameters that are best represented as documents.
3. **Vector Storage**: RAG grounding and semantic memory require high-performance vector similarity searches.
4. **Extraction Seams**: To keep modules ready for future microservices, database schemas must not be physically coupled.

### Decision
We select **PostgreSQL (15+)** as the unified relational database engine and enforce strict physical schema isolation:

1. **Unified Engine**: We use PostgreSQL for both relational storage and (via the `pgvector` extension) semantic vector storage, reducing infrastructure operational overhead.
2. **Schema Separation**: The database is partitioned into isolated PostgreSQL schemas corresponding to each bounded context: `auth`, `workspace`, `todo`, `calendar`, `memory`, `notification`, `agent`, and `connector`.
3. **No Cross-Schema Foreign Keys or Joins**: Tables in one schema cannot define foreign key constraints pointing to tables in another schema, and SQL queries must never JOIN tables across different schemas. References are made purely by storing the target ID as a UUID column, resolved at the application layer.
4. **UUID v4 Identifiers**: Every table primary key uses UUID v4 (PostgreSQL `uuid` type) to guarantee global uniqueness.

### Evidence
- [database-overview.md:L7-L15 (§1 Database Engine & Version)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L7-L15)
- [database-overview.md:L18-L44 (§2 Schema Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L18-L44)
- [database-overview.md:L63-L76 (§4 UUID & Key Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L63-L76)
- [database-overview.md:L135-L163 (§8 Cross-Context Relationship Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L135-L163)

### Alternatives
- **Multi-Database Setup (Day 1)**: Considered and rejected. Running separate database instances for each module from day one would complicate transaction management and increase local development and cloud hosting costs.
- **NoSQL Engine (e.g. MongoDB)**: Rejected. Lacks the robust relational integrity, constraint validation, and complex scheduling query performance required for the Todo and Calendar domains.

### Consequences
#### Positive
- **Extraction-Ready Schemas**: Because schemas do not share SQL joins or constraints, splitting the database into separate physical databases for microservices is trivial.
- **Offline ID Generation**: Generating UUID v4 in application memory before saving prevents round-trips to the database to resolve sequence values.
- **Relational + Vector Coexistence**: Storing vectors alongside standard data rows in PostgreSQL simplifies transactional rollbacks and keeps the operational footprint low.

#### Negative
- **Application Joins**: Queries that span multiple domains must be joined at the Application layer, causing slight development overhead.
- **No Cascade Deletes**: Cascading deletions across schemas are forbidden. Subsystems must listen to delete events (e.g. `WorkspaceDeleted`) and clean up their tables asynchronously.

### Implementation Notes
- Configure PostgreSQL to load the `pgvector` extension.
- Use PostgreSQL's `gen_random_uuid()` function to generate default UUIDs.
- Keep cross-schema ID references as plain UUID fields in JPA entities, avoiding `@ManyToOne` or `@JoinColumn` mappings across schemas.

---

## ADR-0010: Database Migration, Soft Delete, and Concurrency Policies

### Status
Approved

### Context
Relational database tables are modified by multiple concurrent processes (e.g., user REST requests, AI Agent planners, and background Connector sync jobs). This creates risks of the "Lost Update" concurrency problem. Additionally, users require a trash-bin feature to recover accidentally deleted tasks or events. Finally, updating schema structures in production must happen safely, without downtime, and in a backward-compatible manner.

### Decision
We enforce standardized policies for migrations, soft deletes, concurrency, and time storage:

1. **Database Migrations (Flyway)**: We use **Flyway** to manage database schemas. Migrations are SQL-first and structured in separate directories per bounded context schema. Versioning follows a strict semantic structure.
2. **Backward-Compatible Migrations**: Every migration must be backward-compatible (no immediate column drops, new columns must be nullable or have defaults) to support zero-downtime blue-green deployments. Indexes must be created using the `CONCURRENTLY` keyword.
3. **Concurrency Control**: We enforce optimistic locking on all aggregate roots by including a `version` integer column.
4. **Soft-Delete Recovery**: Selected tables (Tasks, Calendar events) implement soft deletion using a `deleted_at` timestamp.
   - **Recovery Window**: Soft-deleted rows are user-recoverable for a strict **2-hour** inactivity duration.
   - **Physical Purge**: An automated background scheduler permanently deletes soft-deleted records after **30 days**.
5. **Standardized Lead Times**: Lead times for notifications are stored as **integer minutes** (not string intervals) to allow simple database scheduler comparison queries (`NOW() >= event_start - lead_time_minutes`).

### Evidence
- [database-overview.md:L94-L121 (§6 Soft Delete Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L94-L121)
- [database-overview.md:L123-L133 (§7 Concurrency & Optimistic Locking)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L123-L133)
- [database-overview.md:L176-L179 (§10 Recurrence & Reminder Time Storage)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L176-L179)
- [migration-strategy.md:L7-L15 (§1 Migration Tool Recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L7-L15)
- [migration-strategy.md:L18-L34 (§2 Directory Structure)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L18-L34)
- [migration-strategy.md:L49-L77 (§3 Backward Compatibility & Zero-Downtime)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L49-L77)
- [requirements/user-stories-v2.md:L91-L101 (TODO-001 - Soft-delete story)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L91-L101)

### Alternatives
- **Automatic Hibernate Schema Generation (`ddl-auto=update`)**: Rejected. Highly dangerous for production databases, lacks change control, and does not support zero-downtime guidelines.
- **Hard Deletions**: Rejected. Violates the user stories requirement for a trash-bin recovery window.
- **Down-Migration Rollback Scripts (`U` scripts)**: Rejected. They are brittle and run a high risk of deleting active production data during automated rollbacks. We prefer forward-only migrations and feature toggles.

### Consequences
#### Positive
- **Zero-Downtime Upgrades**: Application upgrades can deploy while old code versions continue to read and write to the database.
- **Lost Update Prevention**: Simultaneous edits from the UI and background workers are detected and handled safely via version checks.
- **Durable Recoverability**: Users can restore deleted tasks within the 2-hour window, while physical storage bloat is controlled by the 30-day purge scheduler.

#### Negative
- **Application Query Filters**: Every select query must verify that `deleted_at IS NULL` to exclude trashed items, though partial indexes optimize this filter.
- **Constraint Complexity**: Unique indexes must be partial (e.g., `WHERE deleted_at IS NULL`) to allow creating new items with the same name as soft-deleted ones.

### Implementation Notes
- Add the `@Version` annotation to the `version` column in JPA aggregate entities.
- Place Flyway scripts under `src/main/resources/db/migration/<schema-name>/` named like `V1.0.0__init.sql`.
- Soft-deletable JPA entities should utilize the `@SQLDelete` and `@Where(clause = "deleted_at is null")` Hibernate annotations to automate soft deletes and filtering.
- Implement the purge scheduler as a background worker running a query to delete expired soft-deleted rows.

---

## ADR-0011: Token Revocation and Session Invalidation with Redis

### Status
Approved

### Context
The system uses JSON Web Tokens (JWT) for stateless authentication. However, requirements dictate that users must be able to log out, change passwords, or have their accounts suspended, which necessitates immediate token invalidation. Standard JWTs cannot be revoked without state. Storing revoked token IDs (JTIs) in PostgreSQL and querying the relational database on every API request would degrade performance and overload the relational database with high-frequency, simple reads on the hot path.

### Decision
We select **Redis** as our in-memory cache and transient data store, specifically to handle real-time token invalidation and session management:

1. **In-Memory Deny-List**: On logout, password change, or account suspension, the system publishes a revocation event and writes the token identifier (`jti`) to Redis as a key (e.g., `revoked:jti`) with a Time-To-Live (TTL) set to the remaining validity duration of the token.
2. **O(1) Gateway Validation**: The authentication gateway intercepts incoming requests, extracts the JWT, and performs a single $O(1)$ read from Redis to check if the token has been revoked. If the key exists in Redis, the request is rejected immediately without hitting PostgreSQL.
3. **Database Audit Log**: The revocation event is persisted to PostgreSQL schema `auth.session_events` purely as an append-only audit trail and recovery source. PostgreSQL is never queried for the per-request token validity check.

### Evidence
- [auth.md:L74-L77 (Persistence Notes)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L74-L77)
- [auth.md:L84-L85 (Infrastructure non-relational)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L84-L85)
- [auth.md:L98-L99 (Index Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L98-L99)
- [auth.md:L107-L108 (Token Validity Check)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L107-L108)
- [auth.md:L134-L135 (Redis for the Deny-List)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L134-L135)
- [database-review.md:L157 (Redis deny-list)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-review.md#L157)

### Alternatives
- **PostgreSQL Deny-List Check**: Rejected. Querying a relational table on every single request introduces database connection pool contention and latency on the application's hottest path.
- **Stateful Database Session Store**: Rejected. Storing all active user sessions in PostgreSQL couples the server to state, violating the stateless scalability goal.

### Consequences
#### Positive
- **High Performance**: Token validation runs in sub-millisecond time.
- **Automatic Cleanup**: Redis automatically prunes expired keys using the native key-level TTL, avoiding manual clean-up scripts.
- **Resilient Audit Trail**: If Redis experiences data loss, the Postgres `auth.session_events` table contains the complete historical record.

#### Negative
- **Infrastructure Overhead**: Adds a new infrastructure component (Redis) to the deployment stack.
- **Security-Availability Trade-off**: If Redis is unreachable, the system must decide whether to fail-open (allow potentially revoked tokens) or fail-closed (reject requests). We select **fail-closed** to maintain the platform's security-first guarantee.

### Implementation Notes
- Configure Redis with **Append Only File (AOF)** persistence enabled (setting `appendfsync everysec`) so that database restarts do not restore revoked tokens.
- Implement the deny-list check in the API gateway filter (`com.assistant.auth.presentation.GatewayFilter`).
- Handle Redis connection exceptions: throw a secure `503 Service Unavailable` error if the Redis connection is lost (fail-closed).

---

## ADR-0012: LLM Provider Selection and Low-Latency Inference with Groq

### Status
Approved

### Context
The AI Agent executes actions through a multi-stage cognitive loop (NLU Parsing → Sequencing & Planning → Tool Call Execution → Outcome Evaluation & Self-Reflection). Because this loop requires multiple sequential LLM calls for a single user goal, latency accumulates rapidly. If standard commercial LLM APIs with typical response times of 2-5 seconds per call are used, a 3-step planning and reflection loop will result in 10-15 seconds of total user wait time, creating a slow and unresponsive experience. The system requires an inference platform that delivers extreme token-generation speeds while supporting industry-standard tool-calling capabilities.

### Decision
We decouple the LLM integration behind a clean outbound port and standardize on a dual-provider LLM strategy:

1. **Inference Port Isolation**: The AI Agent module defines an outbound `LLMPort` interface. All prompt rendering, history formatting, and JSON tool schema declarations are managed in the application layer. The infrastructure layer implements this port using HTTP clients, completely isolating domain logic from provider SDKs.
2. **Groq API as Primary Planning Backend**: We select the **Groq API** as the primary inference engine for the Agent's planning and self-reflection loops. By hosting open-source models (such as Llama 3) on custom LPU (Language Processing Unit) hardware, Groq provides extremely high generation speeds (often exceeding 500 tokens per second). This reduces the latency of a single reasoning step to a fraction of a second.
3. **Gemini API as Fallback & RAG Analyzer**: We select the **Google Gemini API** (Gemini 1.5 Pro / Flash) as a secondary provider. Gemini serves as a fallback for complex reasoning tasks that exceed the capabilities of smaller open models and is the primary model for Retrieval-Augmented Generation (RAG) due to its massive context window and native multimodal support.

### Evidence
- [project-discovery.md:L25-L27 (AI Technical Goals)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L25-L27)
- [project-discovery.md:L78-L78 (LLM Provider API Integration)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L78-L78)
- [architecture-v2.md:L333 (LLMPort outbound abstraction)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L333)
- [architecture-v2.md:L472-L474 (LLM adapter ACL)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L472-L474)

### Alternatives
- **Local Model Execution (e.g. Ollama/Llama.cpp)**: Considered and rejected. Running LLMs locally provides high privacy but demands substantial CPU/GPU resources, resulting in slow inference speeds on average user machines and complicating installation.
- **Frontier Cloud APIs (OpenAI GPT-4/Anthropic Claude) exclusively**: Rejected. While possessing excellent reasoning capabilities, their high latency (2-5 seconds per request) and high token costs are inefficient for high-frequency internal reasoning and planning iterations.

### Consequences
#### Positive
- **Responsive User Experience**: Sequential planning loops execute in under 2 seconds total.
- **Lower Operational Costs**: Token pricing for open-source models on Groq is significantly cheaper than commercial frontier models.
- **Provider Redundancy**: If Groq encounters downtime or rate limits, the system dynamically routes calls to Gemini.

#### Negative
- **Model Reasoning Differences**: Open-source models (Llama 3) can occasionally generate incorrect JSON formats or fail to follow complex tool instructions compared to larger frontier models. We mitigate this by using strictly structured prompts, system instructions, and schema validation.
- **API Key Complexity**: The system operator must manage multiple API keys (Groq and Google Gemini).

### Implementation Notes
- Define the `LLMPort` interface in `com.assistant.agent.application.port.out`.
- Implement `GroqLLMAdapter` and `GeminiLLMAdapter` in `com.assistant.agent.infrastructure.llm`.
- Use a fallback design pattern: when a `GroqRateLimitException` or timeout occurs, catch it and delegate to the `GeminiLLMAdapter`.
- Store LLM API keys securely inside the vault (accessible via `CredentialVaultPort`).

---

## ADR-0013: Workflow Automation Engine Decision — In-App Engine vs. n8n Integration

### Status
Approved

### Context
The system requires a Workflow Automation capability (triggered on events/schedules to execute multi-step actions). Building a robust, visual workflow engine with visual nodes, error handling, retries, history logs, and third-party integrations (Slack, Google, Jira, Notion) entirely inside the Java backend represents a massive engineering effort. At the same time, simple and core automations (e.g., dispatching calendar reminders or auto-prioritizing tasks) need to execute locally with minimal latency, strict workspace scoping, and transactional consistency.

### Decision
We adopt a **hybrid workflow automation strategy** that balances lightweight in-app execution with integration boundaries for the open-source automation platform **n8n**:

1. **Lightweight In-App Engine**: We implement a lightweight, event-driven workflow engine inside the `Workflow` module. This engine manages simple, local triggers (e.g., cron schedules, local domain events like `TaskCompleted`) and executes in-system actions (e.g., `NotificationDispatchPort` or `TodoPort` edits) synchronously or asynchronously.
2. **Exhaustive External Automations via n8n**: For complex multi-app workflows (e.g., connecting a task update to Google Sheets, GitHub, and custom webhooks), we do not build native Java integrations. Instead, we expose a **Connector Hub Adapter** and webhook dispatchers that publish events directly to an external **n8n** instance.
3. **Inbound n8n Triggering**: n8n can manipulate our system's assets by invoking public REST API ports (under Auth and Workspace scope). This allows n8n to act as a powerful external orchestrator, using the assistant as a headless productivity and cognitive backend.

### Evidence
- [project-discovery.md:L70-L72 (Workflow rule execution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L70-L72)
- [project-discovery.md:L111-L113 (Workflow & Automation functional scope)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L111-L113)
- [architecture-v2.md:L257-L259 (Workflow module definition)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L257-L259)
- [architecture-v2.md:L325 (WorkflowExecutionPort)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L325)
- [architecture-v2.md:L508 (Workflow triggers extension mechanism)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L508)

### Alternatives
- **Build all automation integrations natively in Java**: Rejected. Writing API wrappers and sync systems for dozens of SaaS platforms would delay the MVP significantly and inflate codebase maintenance costs.
- **Outsource all workflows to n8n exclusively**: Rejected. If basic task-notification rules rely entirely on an external n8n server, local execution is slowed down, offline capabilities are broken, and transactional rollbacks are impossible.

### Consequences
#### Positive
- **Reduced Scope**: The development team does not need to build a complex drag-and-drop workflow UI or write dozens of third-party API adapters.
- **Decoupled Power**: Advanced power-users can link n8n to our platform, gaining access to over 400 n8n application integrations out-of-the-box.
- **Transactional Consistency**: Basic local automations (like creating a follow-up task when a parent task fails) execute locally within database transactions.

#### Negative
- **Operational Complexity**: Advanced workflows require running and securing a separate n8n service alongside the monolith.
- **Sync Coordination**: Double-bookkeeping of workflow states: basic rules are persisted in `workflow.rules` in PostgreSQL; complex integrations reside in n8n json definitions.

### Implementation Notes
- The internal engine evaluates rules on event consumption: `WorkflowExecuted` is published on completion.
- Implement n8n webhook targets in the `Connector` context as driven adapters subscribing to specific domain events.
- Implement circular-path verification in the internal workflow builder service (`com.assistant.workflow.domain.RuleValidator`) to prevent infinite execution chains.

---

## ADR-0014: Containerized Deployment and Environment Standardization via Docker

### Status
Approved

### Context
The AI Executive Assistant requires a specific, multi-component infrastructure stack: a Java runtime environment (JDK 21/25), a PostgreSQL database populated with the `pgvector` extension, a Redis instance for session caching, and potentially KMS or external vaults. If developers, CI/CD runners, and deployment operators install these components manually on their host machines, version drift, missing database extensions, or mismatching network ports will cause deployment failures and "works on my machine" bugs. Additionally, the technical goal demands a secure and simple deployment model for single-tenant user workspaces.

### Decision
We standardize all development, testing, and production deployment environments using **Docker** containerization:

1. **Multi-Stage Java Monolith Build**: The Spring Boot modular monolith is compiled and packaged via a multi-stage Dockerfile. The build stage compiles the code using a full JDK image, while the final stage packages the compiled JAR file into a minimal JRE base image (e.g., Eclipse Temurin Alpine or Google Distroless) to reduce container size and security vulnerability exposure.
2. **Docker Compose Stack**: We maintain a standard `docker-compose.yml` file in the root of the project to orchestrate all local development and testing services:
   - `app`: The Spring Boot monolith.
   - `postgres`: PostgreSQL 15+ configured with the `pgvector` extension.
   - `redis`: Redis cache configured with AOF storage.
3. **Execution Sandbox Isolation (Future)**: If the Agent's tool capabilities are expanded to run untrusted user-defined scripts (e.g., Python code or shell commands), they must be spawned and executed within isolated, resource-constrained ephemeral Docker container sandboxes rather than directly on the application host JVM.

### Evidence
- [project-discovery.md:L20-L23 (Technical goals - containerized deployment)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L20-L23)
- [database-overview.md:L7-L15 (PostgreSQL version and pgvector extension)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L7-L15)
- [database-overview.md:L41-L43 (Persistence levels of infrastructure)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L41-L43)

### Alternatives
- **Manual Host Installation Guide**: Considered and rejected. Instructing developers and system operators to manually install and configure PostgreSQL, compile pgvector from source, and run Redis on varied operating systems (Windows, macOS, Linux) is slow and highly error-prone.
- **Bare Metal / VM-centric Deployments**: Rejected. Standardizing virtual machines (VMs) is slow, resource-heavy, and incompatible with modern container orchestrators (Kubernetes, AWS ECS, or sidecar deployments).

### Consequences
#### Positive
- **Onboarding Speed**: New developers can run the entire platform, including database and caches, in under a minute with a single command: `docker compose up -d`.
- **Environment Parity**: The code executes in the exact same environment during local development, integration tests in CI/CD, and production deployments.
- **Dependency Cleanliness**: Eliminates the need to install PostgreSQL or Redis directly on the developer's operating system.

#### Negative
- **Resource Footprint**: Docker containers (specifically when running multiple services) consume noticeable memory and CPU on local development machines.
- **Debugging Complexity**: Inspecting logs or attaching remote Java debuggers to a containerized JVM requires configuring custom Docker entry points and forwarding debugger ports (e.g., port 5005).

### Implementation Notes
- Store the multi-stage Dockerfile in `deploy/Dockerfile` or in the project root.
- Use `ankane/pgvector:v0.5.0` (or official successor) as the base Docker image for PostgreSQL to guarantee the `pgvector` extension is pre-compiled and ready.
- Expose environment variables to configure database hosts (`SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/...`) and Redis hosts (`SPRING_REDIS_HOST=redis`) dynamically across compose services.

---

## ADR-0015: Adoption of Core Software Design Patterns

### Status
Approved

### Context
Implementing a complex, multi-domain system like the AI Executive Assistant requires developer consistency. Procedures like calling third-party APIs, routing notifications, handling event-driven side-effects, and orchestrating the multi-stage AI cognitive loop can easily degrade into procedural "spaghetti" code if not governed by clear architectural design patterns. The codebase needs a defined set of structural and behavioral design patterns to ensure scalability, testability, and modifiability.

### Decision
We adopt and enforce a specific set of core software design patterns across the modular monolith's implementation:

1. **Anti-Corruption Layer (ACL)**: Enforced at all system boundaries (Connector Hub, Notification delivery, LLM provider clients). The ACL translates incoming/outgoing external payloads (such as Google Calendar events, Slack messages, or raw LLM JSON responses) into native domain Value Objects or Port requests. This prevents foreign models from leaking into core logic.
2. **Strategy Pattern**: Used inside the `Connector` context. The `ConnectorHub` dynamically resolves the correct implementation of the `ExternalProviderPort` (e.g., `GoogleCalendarProvider`, `OutlookCalendarProvider`) at runtime based on the connector type saved in the user's connection profile.
3. **Pipeline / Chain of Responsibility Pattern**: Used inside the `AI Agent` module to orchestrate the cognitive execution loop:
   $$\text{NLU Parser} \longrightarrow \text{Planner} \longrightarrow \text{Approval Gateway} \longrightarrow \text{Executor} \longrightarrow \text{Self-Reflection}$$
   Each stage is encapsulated in a distinct component, processing the execution context and passing it to the next step, enabling clean test-doubles for specific stages.
4. **Observer / Event-Driven Pattern**: Used to handle cross-context side-effects. Aggregates publish lightweight integration events to Spring's `ApplicationEventPublisher`. Decoupled handlers in other modules (e.g., Notification, Memory) subscribe to these events, executing side-effects asynchronously after the database transaction commits.

### Evidence
- [architecture-v2.md:L344-L347 (AI Agent Pipeline)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L344-L347)
- [architecture-v2.md:L378-L382 (Connector translation ACL)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L378-L382)
- [architecture-v2.md:L398-L400 (Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L398-L400)
- [architecture-v2.md:L470-L476 (§12 Anti-corruption layers)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L470-L476)
- [context-map.md:L326-L350 (§9 Anti-Corruption Layer Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L326-L350)

### Alternatives
- **Procedural Scripting (Controller-to-Database)**: Rejected. Bypasses domain constraints, degrades testability, and results in severe coupling that prevents future microservice extraction.
- **Direct Cross-Module Concrete Invocation**: Rejected. Couples bounded contexts directly, bypassing ports and creating circular dependencies.

### Consequences
#### Positive
- **High Modularity**: Changes to one component (e.g. how a Google Calendar sync executes) are localized and do not affect the rest of the application.
- **Onboarding and Developer Consistency**: Developers follow established blueprints when adding new connectors, triggers, or agent planning stages.
- **Mockability**: Every pipeline stage, event listener, and strategy client can be mocked or faked in isolation, yielding fast test suites.

#### Negative
- **Indirection**: The use of interfaces, events, and adapters increases the file count and stack-trace depth, making tracing a call hierarchy visually longer in IDEs.
- **Eventual Consistency Overhead**: Since observer handlers run after database transactions commit, tracing asynchronous event bugs requires structured logging.

### Implementation Notes
- Implement strategy classes using Spring's dependency injection: declare a `Map<String, ExternalProviderPort>` to automatically inject all providers by name.
- Encapsulate the AI Agent loop context in an immutable `AgentExecutionContext` record passed along the pipeline stages.
- Enforce that events in `com.assistant.kernel.event` contain only IDs and Value Objects (no JPA entities or Hibernate proxies).
