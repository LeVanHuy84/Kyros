# ADR-0005: Human-in-the-Loop Approvals and Self-Reflection Limits

## Status
Approved

## Context
Non-deterministic LLM behavior can lead to serious operational issues:
1. **Unintended Actions**: An agent could execute incorrect tools (e.g. deleting crucial events, sending emails with errors, or generating tasks with bad data from external email extraction).
2. **Infinite Loops**: When a tool execution fails, the agent might reflect and re-plan indefinitely, leading to runaway LLM token costs and system degradation.

## Decision
We enforce user-control safeguards via **Human-in-the-Loop (HITL) Approvals** and **Self-Reflection Limits**:

1. **Mandatory Approvals**: The AI Agent must halt execution and request explicit user confirmation before:
   - Executing any multi-step generated plan.
   - Creating tasks extracted from incoming emails (when the email sync connector is active).
2. **Hard Loop Boundary**: The AI Agent's self-reflection and re-planning loop is restricted to a maximum of **3 automatic attempts** per goal.
3. **Escalation Policy**: If a plan fails after 3 re-planning attempts, or if an unrecoverable failure occurs, the agent must immediately suspend execution, preserve the state, and escalate to the user with a summary of the issue.

## Evidence
- [architecture.md:L120-L123 (Planner limits)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L120-L123)
- [architecture.md:L146-L150 (Approval Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L146-L150)
- [architecture.md:L232-L235 (AD-005, AD-006)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L232-L235)
- [architecture-v2.md:L141-L142 (AD-005, AD-006)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L141-L142)
- [architecture-v2.md:L354-L356 (Planner limits)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L354-L356)
- [architecture-v2.md:L368-L372 (Approval Flow)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L368-L372)
- [requirements/user-stories-v2.md:L287-L308 (AI-001 - Human confirmation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L287-L308)
- [requirements/user-stories-v2.md:L331-L351 (AI-003 - Re-planning limit)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L331-L351)
- [requirements/user-stories-v2.md:L521-L542 (CON-004 - Email task confirmation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L521-L542)

## Alternatives
- **Fully Autonomous Execution**: Considered and rejected. Although fully autonomous execution provides high automation, it violates user safety, data privacy, and executive control principles.
- **Interactive Step-by-Step Approvals**: Considered and rejected. Asking the user to confirm every single minor tool call creates high friction and a poor user experience. The plan-level approval strikes the right balance.

## Consequences
### Positive
- **Execution Safety**: High-risk operations (e.g. bulk modifications) cannot happen without explicit user consent.
- **Cost Controls**: The 3-attempt reflection ceiling prevents infinite agent loops that could result in high LLM API invoices.
- **User Trust**: SURfacing plan previews to the user before running them increases trust in the system's decisions.

### Negative
- **Latency / Blocking**: Agent execution remains suspended until the user resolves the approval request, preventing fully hands-off automation.
- **State Management**: The application must support durable, long-running agent execution states that survive application restarts while waiting for user approvals.

## Implementation Notes
- Persist agent plans in the `agent.plans` database table with states: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXECUTING`, `COMPLETED`, `FAILED`.
- Submit approvals through `ApprovalRequestPort`, which publishes an `ApprovalRequested` event to notify the user. Expose a REST controller for the user to resolve approvals (`ApprovalResolved` event).
- Implement a counter in the executor loop. If the execution fails and the count is `< 3`, invoke the Planner to generate a correction. If `count >= 3`, publish a failure notification and halt.
