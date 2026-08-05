# Domain Events — AI Agent Bounded Context

---

## AgentSessionStarted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate (via application layer) |
| **Trigger** | A new agent session is opened with a `GoalText` in a workspace. |
| **Consumers** | `Memory` context (attach to conversation), `Notification` context (optional status update) |
| **Business Meaning** | The cognitive orchestration loop has begun for a user goal. Planning will start immediately. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Unique session identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Requesting user |
| `goalText` | GoalText | Natural language objective |
| `occurredAt` | Instant | Start timestamp |

---

## PlanGenerated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | A plan (ordered list of `PlanStep` entities) is attached to the session; session transitions to `AwaitingApproval`. |
| **Consumers** | `ApprovalRequest` creation service, `Notification` context (inform user a plan is ready for review) |
| **Business Meaning** | The agent has decomposed the goal into executable steps. Human confirmation is required before execution begins. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Parent session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `stepCount` | integer | Number of plan steps |
| `occurredAt` | Instant | Generation timestamp |

---

## ApprovalRequested

| Attribute | Detail |
| --- | --- |
| **Publisher** | `ApprovalRequest` aggregate (via application layer) |
| **Trigger** | An `ApprovalRequest` is created from the plan snapshot and linked to the `AgentSession`. |
| **Consumers** | `Notification` context (send approval request to user via configured channels), audit log |
| **Business Meaning** | A formal checkpoint has been raised. Execution is blocked until the user approves or rejects the plan. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `approvalId` | ApprovalId | Unique approval identifier |
| `sessionId` | AgentSessionId | Linked session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `planSnapshot` | PlanSnapshot | Immutable step descriptions for user review |
| `expiresAt` | ExpirationTimestamp | Approval deadline (if policy enabled) |
| `occurredAt` | Instant | Request creation timestamp |

---

## ApprovalResolved

| Attribute | Detail |
| --- | --- |
| **Publisher** | `ApprovalRequest` aggregate |
| **Trigger** | User approves or rejects the plan (`Pending → Approved` or `Pending → Rejected`). |
| **Consumers** | `AgentSession` (resume execution on Approved; trigger replan or halt on Rejected), `Notification` context (confirmation to user) |
| **Business Meaning** | Human-in-the-loop decision recorded. If approved, the execution loop begins. If rejected, the session re-plans or is escalated. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `approvalId` | ApprovalId | Resolved approval |
| `sessionId` | AgentSessionId | Linked session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `resolution` | ApprovalStatus | Approved / Rejected |
| `actorId` | UserId | User who resolved |
| `occurredAt` | Instant | Resolution timestamp |

---

## ApprovalExpired

| Attribute | Detail |
| --- | --- |
| **Publisher** | Approval expiry scheduler (application/infrastructure) |
| **Trigger** | `ExpirationTimestamp` reached and approval is still `Pending`. |
| **Consumers** | `AgentSession` (treat as rejection; escalate or replan), `Notification` context |
| **Business Meaning** | The user did not respond within the allowed window. The session must not remain indefinitely blocked; it is escalated or re-planned per policy. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `approvalId` | ApprovalId | Expired approval |
| `sessionId` | AgentSessionId | Linked session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Expiry timestamp |

---

## PlanStepStarted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | A `PlanStep` transitions `Pending → Running` (dependencies satisfied, approval granted). |
| **Consumers** | Audit log, monitoring |
| **Business Meaning** | A tool invocation is in progress. The executor is running the registered tool. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Parent session |
| `stepId` | PlanStepId | Running step |
| `toolReference` | ToolReference | Tool being invoked |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Timestamp |

---

## ToolExecuted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate (via tool executor) |
| **Trigger** | A registered tool completes execution (success or failure). Step transitions to `Succeeded` or `Failed`. |
| **Consumers** | `Memory` context (append execution result to conversation), `Notification` context (optional progress update), audit log |
| **Business Meaning** | One unit of the plan has been executed. Results are available for reflection. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Parent session |
| `stepId` | PlanStepId | Executed step |
| `toolReference` | ToolReference | Tool invoked |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `success` | boolean | Execution outcome |
| `occurredAt` | Instant | Completion timestamp |

---

## SessionReplanned

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | A step failure triggers re-planning; session transitions back to `Planning`; `ReplanAttemptCount` incremented. |
| **Consumers** | `Notification` context (inform user of re-plan), audit log |
| **Business Meaning** | The agent is self-correcting after an execution failure. A new plan will be generated. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Session re-planning |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `replanAttempt` | integer | Current replan count after this trigger |
| `occurredAt` | Instant | Timestamp |

---

## SessionEscalated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | Re-plan limit exceeded (4th replan attempt) or unrecoverable failure; session transitions to `Escalated`. |
| **Consumers** | `Notification` context (urgent alert to user for manual intervention), audit log |
| **Business Meaning** | The agent cannot autonomously complete the goal. User intervention is required. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Escalated session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `replanCount` | integer | Total replan attempts made |
| `reason` | string | Escalation reason |
| `occurredAt` | Instant | Escalation timestamp |

---

## SessionSucceeded

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | All `PlanStep` entities complete with status `Succeeded`; session transitions to `Succeeded`. |
| **Consumers** | `Notification` context (goal completion notification), `Memory` context (record outcome) |
| **Business Meaning** | The goal has been fully achieved. Results are available for the user. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | AgentSessionId | Completed session |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `goalText` | GoalText | Original goal |
| `occurredAt` | Instant | Completion timestamp |

---

## SessionFailed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `AgentSession` aggregate |
| **Trigger** | Unrecoverable failure without escalation path; session transitions to `Failed`. |
| **Consumers** | `Notification` context (failure alert), audit log |
| **Business Meaning** | The goal could not be completed. The user is informed; no further automatic retries. |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| AgentSessionStarted | AgentSession | Memory, Notification |
| PlanGenerated | AgentSession | ApprovalRequest Service, Notification |
| ApprovalRequested | ApprovalRequest | Notification, Audit |
| ApprovalResolved | ApprovalRequest | AgentSession, Notification |
| ApprovalExpired | Expiry Scheduler | AgentSession, Notification |
| PlanStepStarted | AgentSession | Audit |
| ToolExecuted | AgentSession | Memory, Notification, Audit |
| SessionReplanned | AgentSession | Notification, Audit |
| SessionEscalated | AgentSession | Notification, Audit |
| SessionSucceeded | AgentSession | Notification, Memory |
| SessionFailed | AgentSession | Notification, Audit |
