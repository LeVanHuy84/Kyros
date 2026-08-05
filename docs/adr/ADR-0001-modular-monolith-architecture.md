# ADR-0001: Adoption of Modular Monolith Architectural Style

## Status
Approved

## Context
The AI Executive Assistant requires multiple highly distinct domains (Authentication, Workspace Tenancy, Todo, Calendar, AI Agent, Memory, Connectors, Notifications) to work together. Key requirements include a short time-to-market, low operational and deployment overhead, and simple local-first development. At the same time, because of security boundaries (Workspace Tenancy) and potential high loads on cognitive agent components, the system must remain structured in a way that allows future extraction of individual modules into microservices.

## Decision
We adopt a **Modular Monolith** deployment style. The application will build and deploy as a single process (Spring Boot application). The codebase will be strictly partitioned into cohesive modules corresponding to bounded contexts. Modules are prohibited from sharing databases or referencing class implementations sideways except through explicit ports or domain events. Development is phased into **MVP modules** (Auth, Workspace, Todo, Calendar, Notification, Memory, AI Agent, Connector SPI) and **Full/Deferred modules** (Workflow, Notes, Semantic Memory, RAG) to focus engineering effort.

## Evidence
- [architecture.md:L3-L14](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L3-L14)
- [architecture.md:L17-L29](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L17-L29)
- [architecture.md:L226-L228 (AD-001)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L226-L228)
- [architecture-v2.md:L137-L138 (AD-001)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L137-L138)
- [architecture-v2.md:L154-L155 (AD-018)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L154-L155)
- [architecture-v2.md:L201-L228 (§3 Phasing)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L201-L228)
- [context-map.md:L11-L22 (§1 Executive Summary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L11-L22)
- [context-map.md:L425-L439 (§13 Context Evolution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L425-L439)

## Alternatives
- **Microservices Architecture**: Considered and rejected. Although microservices provide strong physical isolation, they introduce high operational complexity, deployment overhead, network latency, distributed transaction issues, and slower development speed for a phase-one MVP.

## Consequences
### Positive
- **Operational Simplicity**: Single build, single deployment pipeline, and straightforward local testing.
- **Strong Gateway Security**: Single gateway authentication allows unified workspace resolution.
- **Refactoring & Extraction Seams**: Code is ready for microservice extraction; moving a module (like the CPU/token-intensive AI Agent) to a microservice requires replacing only the local adapters with network/gRPC adapters without altering domain logic.

### Negative
- **Shared Resources**: The application runs in a single JVM, meaning a memory leak or CPU starvation in one module (e.g. AI Agent or Connector) can impact the entire system.
- **Build Synchronization**: Code changes across different modules require building and deploying the entire monolith.

## Implementation Notes
- Establish strict packages per bounded context: `com.assistant.auth`, `com.assistant.workspace`, `com.assistant.todo`, `com.assistant.calendar`, `com.assistant.agent`, `com.assistant.memory`, `com.assistant.notification`, `com.assistant.connector`, and `com.assistant.kernel` (Shared Kernel leaf JAR).
- Use build tools (like Gradle multi-projects or Maven submodules) and automated verification tests (e.g. ArchUnit) to verify and enforce modular boundaries in CI.
