# ADR-0004: Agent Sandbox and Exclusive Tool Registry Gateway

## Status
Approved

## Context
The AI Agent decomposes high-level user goals into structured actions and executes them. If the Agent had direct access to the database or internal domain services, it would be extremely difficult to enforce tenant boundaries (Workspace Tenancy), validate execution safety, and maintain a reliable audit trail. An LLM could generate SQL queries that bypass business rules, cause data corruption, or leak private data across workspaces (e.g. via prompt injection).

## Decision
We enforce a strict **Agent Sandbox** using a **Tool Registry** as the exclusive gateway for all AI Agent actions:

1. **No Direct Storage Access**: The AI Agent context is strictly isolated. It has no access to repository interfaces or database schemas of other modules.
2. **Exclusive Tool Gateway**: The AI Agent interacts with the rest of the application solely via registered tools in an in-module Tool Registry.
3. **Cognitive Port Limits**: The AI Agent module's allowed external dependencies are restricted to the Tool Registry, `LLMPort` (for LLM client abstraction), Memory ports, and `ApprovalRequestPort`.
4. **Tool Adapters**: Tools in the registry act as adapter classes. They accept JSON arguments from the Agent, validate them, verify active Workspace permissions, and delegate execution to the respective module's public inbound ports (e.g. `TodoPort`, `CalendarPort`).
5. **Audit Logging**: Every tool execution is recorded in an immutable audit log by publishing a `ToolExecuted` domain event.

## Evidence
- [architecture.md:L13-L14 (Workspace boundary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L13-L14)
- [architecture.md:L141-L145 (Tool Registry)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L141-L145)
- [architecture.md:L231-L232 (AD-004)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L231-L232)
- [architecture-v2.md:L67-L72 (ISS-05)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L67-L72)
- [architecture-v2.md:L123-L125 (Agent isolation recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L123-L125)
- [architecture-v2.md:L140 (AD-004)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L140)
- [architecture-v2.md:L152 (AD-016)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L152)
- [architecture-v2.md:L363-L367 (Tool Registry Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L363-L367)
- [context-map.md:L382-L385 (Agent Tool Isolation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L382-L385)

## Alternatives
- **Direct Database / Service Access**: Rejected. Exposing JPA repositories or concrete service beans to the AI Agent planning loop presents high security risks, prevents auditing, and breaks workspace isolation boundaries.
- **Shared Domain Libraries**: Rejected. Allowing the Agent to instantiate domain entities directly would bypass business rules and validators.

## Consequences
### Positive
- **Guaranteed Security**: Workspace isolation is checked at the entry point of every tool execution, eliminating data leakage risk.
- **Traceability**: An immutable trail records every tool action, parameter, and output status, which is vital for security audit and debugging.
- **Robust Domain Isolation**: Changes to the database tables or domain structures in `Todo` or `Calendar` do not affect the AI Agent, provided their public ports remain stable.

### Negative
- **Integration Overhead**: Adding a new user capability requires writing a tool class in the Agent context and declaring its JSON schema description for the LLM.
- **JSON Overhead**: Small performance cost due to serializing tool arguments and outputs to/from JSON strings.

## Implementation Notes
- Declare tool classes inside `com.assistant.agent.tool`. Each tool implements a common `AgentTool` interface defining name, description, JSON schema, and execution logic.
- The execution method in the tool must retrieve the active `WorkspaceId` from the security context and validate it before invoking target ports.
- Enforce the isolation rule via ArchUnit: classes in `com.assistant.agent` must not reference classes in `com.assistant.todo.infrastructure` or `com.assistant.calendar.infrastructure`.
