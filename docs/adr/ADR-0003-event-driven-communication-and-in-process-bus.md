# ADR-0003: Asynchronous Event-Driven Communication with In-Process Bus

## Status
Approved

## Context
Many business flows in the AI Executive Assistant span multiple domains. For example, when a new task is created, notifications may need to be dispatched, the Connector context must synchronize the task to external productivity providers, and the Workflow engine might evaluate rules. Direct synchronous method calls between contexts would couple their compile-time dependencies, cascade runtime failures (e.g. an external API timeout in the Connector rollback the primary task creation), and increase database transaction lock times.

## Decision
We adopt **Asynchronous Event-Driven Communication** for cross-module side-effects:

1. **In-Process Bus**: During the initial phases, we use Spring’s `ApplicationEventPublisher` as the in-process event bus to avoid broker operational overhead.
2. **Transaction Boundaries (After-Commit)**: Event handlers are registered using after-commit transactional semantics (`TransactionPhase.AFTER_COMMIT`). This ensures that side-effects execute only after the primary database transaction successfully commits.
3. **Published Language**: Integration events are defined within the **Shared Kernel** leaf module. To prevent domain leakage, events contain only primitive identifiers (e.g., `TaskId`, `WorkspaceId`) and simple, immutable Value Objects (e.g., event timestamps), never JPA entities or internal aggregate objects.
4. **Namespace Integrity**: Canonical event names are used to prevent namespace collisions (e.g. renaming generic event names like `EventCreated` to context-specific ones like `CalendarEventCreated`).

## Evidence
- [architecture.md:L178-L208 (Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L178-L208)
- [architecture.md:L230-L231 (AD-003)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L230-L231)
- [architecture-v2.md:L126-L128 (Canonical events recommendations)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L126-L128)
- [architecture-v2.md:L139 (AD-003)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L139)
- [architecture-v2.md:L153 (AD-017)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L153)
- [architecture-v2.md:L398-L422 (§10 Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L398-L422)
- [context-map.md:L265-L271 (Asynchronous Communication)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L265-L271)
- [context-map.md:L300-L324 (§8 Domain Event Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L300-L324)

## Alternatives
- **Synchronous Method Calls**: Rejected. Fails to decouple modules. Makes transaction boundaries fragile and increases the likelihood of system failure if any single downstream module is unhealthy.
- **External Message Broker (Kafka/RabbitMQ)**: Deferred. While ideal for a distributed microservices setup, launching an external broker in phase one would introduce unnecessary deployment and local development overhead. The in-process event bus acts as an ideal seam that can be swapped for an external broker later.

## Consequences
### Positive
- **High Decoupling**: Producers publish events without knowing who consumes them.
- **Improved Performance**: The main user transaction finishes quickly without waiting for slow notifications or third-party API syncs.
- **Transactional Safety**: A failure in the Slack connector or email notification will not roll back the user's primary task creation or event updates.

### Negative
- **Eventual Consistency**: Side-effects occur asynchronously. There is a slight delay before the notification is dispatched or the task is synced.
- **No Global Rollbacks**: If task creation succeeds but email sync fails, the system must handle the sync retry or error state gracefully, rather than rolling back.

## Implementation Notes
- Publish events using `ApplicationEventPublisher.publishEvent()`.
- Annotate event listener methods in consuming modules with `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
- Use `@Async` annotations on listener methods to ensure they execute on a separate thread pool and do not block the caller.
- Handle failures within listeners using bounded retries and logging to prevent silent event drop.
