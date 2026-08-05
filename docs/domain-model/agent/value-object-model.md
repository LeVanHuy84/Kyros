# Value Object Model — AI Agent Bounded Context

---

## AgentSessionId / ApprovalId / PlanStepId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque identifiers. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null. |

---

## WorkspaceId / UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Tenancy and approver identity. |
| **Immutability** | Immutable on aggregate. |
| **Validation** | Session and tools limited to same **WorkspaceId**. |

---

## GoalText

| Aspect | Description |
| --- | --- |
| **Fields** | Natural language user objective. |
| **Immutability** | Immutable for session lifetime (re-plan creates new steps, same goal). |
| **Validation** | Non-empty after trim. |

---

## AgentSessionStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Planning, AwaitingApproval, Executing, Succeeded, Failed, Escalated. |
| **Immutability** | Transitions via aggregate methods. |
| **Validation** | Legal state machine enforced on **AgentSession**. |

---

## PlanStepStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Pending, Running, Succeeded, Failed. |
| **Immutability** | Transitions via session/step behavior. |
| **Validation** | Execution only when dependencies satisfied and approval granted. |

---

## ToolReference

| Aspect | Description |
| --- | --- |
| **Fields** | Registered tool name/id in **Tool Registry**. |
| **Immutability** | Fixed on **PlanStep** unless re-planned. |
| **Validation** | Must exist in registry; no direct DB bypass. |

---

## ToolParameterSnapshot

| Aspect | Description |
| --- | --- |
| **Fields** | Structured parameters for tool invocation. |
| **Immutability** | Immutable on step unless plan replaced. |
| **Validation** | Must conform to tool schema from registry. |

---

## StepDependency

| Aspect | Description |
| --- | --- |
| **Fields** | Reference to prerequisite **PlanStepId**(s). |
| **Immutability** | Defined with plan. |
| **Validation** | Acyclic dependency graph. |

---

## ReplanAttemptCount

| Aspect | Description |
| --- | --- |
| **Fields** | Integer 0..3 allowed replans before escalation on 4th trigger. |
| **Immutability** | Incremented on each re-plan. |
| **Validation** | Must not exceed 3 completed replans; 4th attempt → **Escalated**. |

---

## ApprovalStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Pending, Approved, Rejected, Expired. |
| **Immutability** | Terminal approve/reject immutable. |
| **Validation** | Only **Pending** may resolve. |

---

## PlanSnapshot

| Aspect | Description |
| --- | --- |
| **Fields** | Immutable copy of step descriptions and tool references for user review. |
| **Immutability** | Frozen at approval request creation. |
| **Validation** | Non-empty step list when approval required. |

---

## ExpirationTimestamp

| Aspect | Description |
| --- | --- |
| **Fields** | Instant when approval request expires. |
| **Immutability** | Set at creation. |
| **Validation** | Must be after creation time if used. |

---

## GroundingCitation

| Aspect | Description |
| --- | --- |
| **Fields** | Source document/reference id for RAG answers. |
| **Immutability** | Attached to response artifact (may live outside session aggregate in read models). |
| **Validation** | Required for assertions; absent sources → “I do not know” policy. |

---

## ToolRegistryEntry (catalog value)

| Aspect | Description |
| --- | --- |
| **Fields** | Tool id, description, parameter schema, permission scope. |
| **Immutability** | Registry updates are administrative; entries immutable per version. |
| **Validation** | Executor may invoke only registered tools. |
