# Domain Services — AI Agent Bounded Context

---

## PlanExecutionGateService

### Purpose

Verify mandatory user confirmation before any **PlanStep** executes.

### Why not inside AgentSession alone

**ApprovalRequest** is a separate aggregate with async lifecycle. Session must consult **ApprovalId** / repository read of **ApprovalStatus** without merging aggregates.

### Responsibilities

- Given **AgentSessionId**, load **ApprovalRequest** (or cached status) and confirm **Approved**.
- Deny execution start if **Pending**, **Rejected**, or **Expired**.

---

## ReplanPolicyService

### Purpose

Centralize re-plan ceiling enforcement (max 3 replans).

### Why not only on AgentSession

Policy is a documented invariant; service can be invoked from reflection loop and tests; optional if logic stays on root — documented here as coordination with **ReplanAttemptCount** on session (primary enforcement remains on **AgentSession.recordReplan()**).

### Responsibilities

- Advise whether next re-plan is allowed or session must **Escalate**.

*(If all logic lives on **AgentSession**, this service may be omitted; escalation is still enforced on the aggregate.)*

---

## ToolRegistry (domain catalog service)

### Purpose

Exclusive registry of invocable **ToolReference** entries.

### Why not an aggregate per tool

Tools are static capability metadata, not user-scoped transactional state. Registry is read-mostly catalog consulted by planner and executor.

### Responsibilities

- Register/deregister tools (admin lifecycle).
- Resolve schema and permissions for **PlanStep**.
- Reject unknown tools at plan validation.

---

## PlanDependencyOrderingService

### Purpose

Compute next executable **PlanStep** set from dependency graph.

### Why optional outside aggregate

Can live on **AgentSession**; extracted when graph algorithms should stay testable separately from state mutations.

### Responsibilities

- Return steps whose dependencies are **Succeeded** and status **Pending**.

---

## Factories

### AgentSessionFactory

Create session in **Planning** with **GoalText** and zero steps.

### ApprovalRequestFactory

Create **ApprovalRequest** from **PlanSnapshot**, **AgentSessionId**, **ExpirationTimestamp**.

**Not responsible for**

- LLM plan generation (cognitive infrastructure).
- Tool HTTP/API calls.

---

## GroundingPolicy

Enforced in cognitive/response layer: answers require **GroundingCitation** or explicit unknown response — not a persistence service; documented as domain rule on agent behavior, not a repository concern.
