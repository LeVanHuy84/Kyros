# Repository Model — AI Agent Bounded Context

---

## AgentSessionRepository

**Aggregate root**: AgentSession

### Responsibilities

- Load **AgentSession** by **AgentSessionId** and **WorkspaceId** with **PlanStep** collection.
- Persist session status transitions, plan replacements, step status updates, re-plan counter atomically.
- Query active sessions in workspace (monitoring, UI).

---

## ApprovalRequestRepository

**Aggregate root**: ApprovalRequest

### Responsibilities

- Load by **ApprovalId** and **WorkspaceId**.
- Persist create, approve, reject, expire transitions.
- Find pending approvals for user/workspace.
- Load by **AgentSessionId** soft reference when resolving session continuation.

---

### Out of scope

- Executing tools (adapters call **TodoPort**, **CalendarPort**, etc.).
- Storing chat logs (**Memory**).
- Delivering approval notifications (**Notification**).

### Contract expectations

- Session and approval saves never cross **WorkspaceId**.
- Approval resolution and session execution coordination happens via domain events/application layer, not cross-aggregate locking in one transaction.
