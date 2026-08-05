# Entity Model — AI Agent Bounded Context

Two aggregates: **AgentSession**, **ApprovalRequest**.

---

## Agent Session Aggregate

### Aggregate Root: AgentSession

#### Responsibilities

- Lifecycle of one goal-seeking cognitive run in a **WorkspaceId**.
- Encapsulates goal text, session status, re-planning attempt counter, and ordered **PlanStep** entities.
- Transitions: Planning → Awaiting Approval → Executing → Succeeded / Failed / Escalated.
- Increments re-plan counter on re-plan; escalates when count would exceed **3** replans (4th attempt halts).
- Enforces execution ordering and dependency rules on steps at domain level (ready steps only when dependencies satisfied).
- Soft-references related **ApprovalId**; does not lock **ApprovalRequest** aggregate.
- Records reflection outcomes per step (via step state updates).

#### Identity

- **AgentSessionId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Planning** | Plan being generated or revised. |
| **AwaitingApproval** | Plan presented; execution blocked pending approval aggregate. |
| **Executing** | Approved steps running via Tool Registry. |
| **Succeeded** | All steps completed successfully. |
| **Failed** | Unrecoverable failure without escalation path. |
| **Escalated** | Re-plan limit or unrecoverable error; needs user intervention. |

#### Public behaviors

- Start session with **Goal** text.
- Attach or replace **Plan** (collection of **PlanStep**).
- Transition to awaiting approval when plan ready.
- Begin execution only when approval invariant satisfied (external **ApprovalRequest** status **Approved** supplied to domain command).
- Mark step running, succeeded, failed.
- Trigger re-plan (increment counter, return to Planning or Escalated).
- Complete or fail session.

---

### Entity: PlanStep

#### Responsibilities

- One tool invocation slot: tool name/reference, parameters snapshot, status (**Pending**, **Running**, **Succeeded**, **Failed**), dependency links to other steps.

#### Identity

- **PlanStepId** within **AgentSession**.

#### Parent aggregate

- **AgentSession**.

---

## Approval Request Aggregate

### Aggregate Root: ApprovalRequest

#### Responsibilities

- Human-in-the-loop checkpoint decoupled from long-running session transactions.
- Encapsulates **AgentSessionId** soft reference, plan snapshot (steps/descriptions), status (**Pending**, **Approved**, **Rejected**), expiration time.
- Resolves with authorized actor (**UserId**): approve or reject.
- Emits domain events on request and resolution (application publishes).

#### Identity

- **ApprovalId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Pending** | Awaiting user decision. |
| **Approved** | Execution may proceed on linked session. |
| **Rejected** | Execution blocked; session should replan or halt. |
| **Expired** | Terminal if expiration enforced. |

#### Public behaviors

- Create from plan snapshot and session reference.
- Approve or reject with actor validation.
- Expire when past **ExpirationTimestamp** (if policy enabled).

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | AgentSession | AgentSessionId |
| Entity | PlanStep | PlanStepId |
| Aggregate root | ApprovalRequest | ApprovalId |

**Tool Registry** is a domain catalog (may be modeled as read-only registry module, not an aggregate root with mutable instance lifecycle per session).
