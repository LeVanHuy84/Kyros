# ADR-0015: Adoption of Core Software Design Patterns

## Status
Approved

## Context
Implementing a complex, multi-domain system like the AI Executive Assistant requires developer consistency. Procedures like calling third-party APIs, routing notifications, handling event-driven side-effects, and orchestrating the multi-stage AI cognitive loop can easily degrade into procedural "spaghetti" code if not governed by clear architectural design patterns. The codebase needs a defined set of structural and behavioral design patterns to ensure scalability, testability, and modifiability.

## Decision
We adopt and enforce a specific set of core software design patterns across the modular monolith's implementation:

1. **Anti-Corruption Layer (ACL)**: Enforced at all system boundaries (Connector Hub, Notification delivery, LLM provider clients). The ACL translates incoming/outgoing external payloads (such as Google Calendar events, Slack messages, or raw LLM JSON responses) into native domain Value Objects or Port requests. This prevents foreign models from leaking into core logic.
2. **Strategy Pattern**: Used inside the `Connector` context. The `ConnectorHub` dynamically resolves the correct implementation of the `ExternalProviderPort` (e.g., `GoogleCalendarProvider`, `OutlookCalendarProvider`) at runtime based on the connector type saved in the user's connection profile.
3. **Pipeline / Chain of Responsibility Pattern**: Used inside the `AI Agent` module to orchestrate the cognitive execution loop:
   $$\text{NLU Parser} \longrightarrow \text{Planner} \longrightarrow \text{Approval Gateway} \longrightarrow \text{Executor} \longrightarrow \text{Self-Reflection}$$
   Each stage is encapsulated in a distinct component, processing the execution context and passing it to the next step, enabling clean test-doubles for specific stages.
4. **Observer / Event-Driven Pattern**: Used to handle cross-context side-effects. Aggregates publish lightweight integration events to Spring's `ApplicationEventPublisher`. Decoupled handlers in other modules (e.g., Notification, Memory) subscribe to these events, executing side-effects asynchronously after the database transaction commits.

## Evidence
- [architecture-v2.md:L344-L347 (AI Agent Pipeline)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L344-L347)
- [architecture-v2.md:L378-L382 (Connector translation ACL)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L378-L382)
- [architecture-v2.md:L398-L400 (Internal Event Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L398-L400)
- [architecture-v2.md:L470-L476 (§12 Anti-corruption layers)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L470-L476)
- [context-map.md:L326-L350 (§9 Anti-Corruption Layer Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L326-L350)

## Alternatives
- **Procedural Scripting (Controller-to-Database)**: Rejected. Bypasses domain constraints, degrades testability, and results in severe coupling that prevents future microservice extraction.
- **Direct Cross-Module Concrete Invocation**: Rejected. Couples bounded contexts directly, bypassing ports and creating circular dependencies.

## Consequences
### Positive
- **High Modularity**: Changes to one component (e.g. how a Google Calendar sync executes) are localized and do not affect the rest of the application.
- **Onboarding and Developer Consistency**: Developers follow established blueprints when adding new connectors, triggers, or agent planning stages.
- **Mockability**: Every pipeline stage, event listener, and strategy client can be mocked or faked in isolation, yielding fast test suites.

### Negative
- **Indirection**: The use of interfaces, events, and adapters increases the file count and stack-trace depth, making tracing a call hierarchy visually longer in IDEs.
- **Eventual Consistency Overhead**: Since observer handlers run after database transactions commit, tracing asynchronous event bugs requires structured logging.

## Implementation Notes
- Implement strategy classes using Spring's dependency injection: declare a `Map<String, ExternalProviderPort>` to automatically inject all providers by name.
- Encapsulate the AI Agent loop context in an immutable `AgentExecutionContext` record passed along the pipeline stages.
- Enforce that events in `com.assistant.kernel.event` contain only IDs and Value Objects (no JPA entities or Hibernate proxies).
