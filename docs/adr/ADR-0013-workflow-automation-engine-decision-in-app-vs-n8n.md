# ADR-0013: Workflow Automation Engine Decision — In-App Engine vs. n8n Integration

## Status
Approved

## Context
The system requires a Workflow Automation capability (triggered on events/schedules to execute multi-step actions). Building a robust, visual workflow engine with visual nodes, error handling, retries, history logs, and third-party integrations (Slack, Google, Jira, Notion) entirely inside the Java backend represents a massive engineering effort. At the same time, simple and core automations (e.g., dispatching calendar reminders or auto-prioritizing tasks) need to execute locally with minimal latency, strict workspace scoping, and transactional consistency.

## Decision
We adopt a **hybrid workflow automation strategy** that balances lightweight in-app execution with integration boundaries for the open-source automation platform **n8n**:

1. **Lightweight In-App Engine**: We implement a lightweight, event-driven workflow engine inside the `Workflow` module. This engine manages simple, local triggers (e.g., cron schedules, local domain events like `TaskCompleted`) and executes in-system actions (e.g., `NotificationDispatchPort` or `TodoPort` edits) synchronously or asynchronously.
2. **Exhaustive External Automations via n8n**: For complex multi-app workflows (e.g., connecting a task update to Google Sheets, GitHub, and custom webhooks), we do not build native Java integrations. Instead, we expose a **Connector Hub Adapter** and webhook dispatchers that publish events directly to an external **n8n** instance.
3. **Inbound n8n Triggering**: n8n can manipulate our system's assets by invoking public REST API ports (under Auth and Workspace scope). This allows n8n to act as a powerful external orchestrator, using the assistant as a headless productivity and cognitive backend.

## Evidence
- [project-discovery.md:L70-L72 (Workflow rule execution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L70-L72)
- [project-discovery.md:L111-L113 (Workflow & Automation functional scope)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L111-L113)
- [architecture-v2.md:L257-L259 (Workflow module definition)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L257-L259)
- [architecture-v2.md:L325 (WorkflowExecutionPort)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L325)
- [architecture-v2.md:L508 (Workflow triggers extension mechanism)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L508)

## Alternatives
- **Build all automation integrations natively in Java**: Rejected. Writing API wrappers and sync systems for dozens of SaaS platforms would delay the MVP significantly and inflate codebase maintenance costs.
- **Outsource all workflows to n8n exclusively**: Rejected. If basic task-notification rules rely entirely on an external n8n server, local execution is slowed down, offline capabilities are broken, and transactional rollbacks are impossible.

## Consequences
### Positive
- **Reduced Scope**: The development team does not need to build a complex drag-and-drop workflow UI or write dozens of third-party API adapters.
- **Decoupled Power**: Advanced power-users can link n8n to our platform, gaining access to over 400 n8n application integrations out-of-the-box.
- **Transactional Consistency**: Basic local automations (like creating a follow-up task when a parent task fails) execute locally within database transactions.

### Negative
- **Operational Complexity**: Advanced workflows require running and securing a separate n8n service alongside the monolith.
- **Sync Coordination**: Double-bookkeeping of workflow states: basic rules are persisted in `workflow.rules` in PostgreSQL; complex integrations reside in n8n json definitions.

## Implementation Notes
- The internal engine evaluates rules on event consumption: `WorkflowExecuted` is published on completion.
- Implement n8n webhook targets in the `Connector` context as driven adapters subscribing to specific domain events.
- Implement circular-path verification in the internal workflow builder service (`com.assistant.workflow.domain.RuleValidator`) to prevent infinite execution chains.
