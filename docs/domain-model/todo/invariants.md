# Business Invariants — Todo Bounded Context

---

## Validation Rules

### INV-TODO-01 — Mandatory Title

| Aspect | Detail |
| --- | --- |
| **Rule** | Every Task must have a non-empty, non-whitespace title at all times. |
| **Enforcement** | `Title` value object trims and rejects blank strings; `create()` and `update(title)` on the aggregate validate before mutating state. |
| **Violation** | Operation rejected; aggregate state unchanged. |

---

### INV-TODO-02 — Single Priority Constraint

| Aspect | Detail |
| --- | --- |
| **Rule** | Every Active or Completed task must have exactly one priority value (`High`, `Medium`, or `Low`) at all times. |
| **Enforcement** | `Priority` is a required field on `create()`; default `Medium` applied when not specified; update commands must supply a valid enum value. |
| **Violation** | Task creation or priority update rejected if value is absent or out of range. |

---

### INV-TODO-03 — Workspace Tenancy Scope

| Aspect | Detail |
| --- | --- |
| **Rule** | A Task must belong to exactly one `WorkspaceId` for its lifetime. All reads and writes verify that the operation's workspace context matches the task's `WorkspaceId`. |
| **Enforcement** | `WorkspaceId` is immutable after creation; application layer enforces scope on every load and save. |
| **Violation** | Cross-workspace access rejected at application boundary. |

---

### INV-TODO-04 — Tag Uniqueness (Case-Sensitive)

| Aspect | Detail |
| --- | --- |
| **Rule** | A task's tag collection must not contain duplicate tags (case-sensitive string equality). Tags must be non-empty after trimming. |
| **Enforcement** | `Tag` value object rejects blank labels; the aggregate's tag set enforces uniqueness on `addTag()`. |
| **Violation** | Duplicate or blank tag additions are rejected silently or with a domain error; no state change. |

---

### INV-TODO-05 — Standard Recurrence Rules

| Aspect | Detail |
| --- | --- |
| **Rule** | Recurrence schedules must specify a supported pattern (`DAILY`, `WEEKLY`, `MONTHLY`) and a positive interval (default: 1). |
| **Enforcement** | `RecurrencePattern` and `RecurrenceInterval` value objects validate values on construction; `attachRecurrence()` rejects invalid values. |
| **Violation** | Attachment rejected; recurrence not configured; no event published. |

---

### INV-TODO-06 — Instance Property Inheritance

| Aspect | Detail |
| --- | --- |
| **Rule** | Generated recurrence instances must inherit the parent task's `Priority` and `Tag` set at the time of generation. |
| **Enforcement** | `RecurrenceInstanceSeed` VO is assembled by the domain service at generation time by reading the parent aggregate's current fields. |
| **Violation** | Instances created with divergent priority or tags from the parent state at generation time violate the rule. |

---

### INV-TODO-07 — No Overlapping Instance Due Dates

| Aspect | Detail |
| --- | --- |
| **Rule** | Task instances generated from the same parent must not share the same due date. |
| **Enforcement** | `RecurrenceInstanceGenerationService` checks existing instance due dates (via repository query) before creating a new child task. The `DueDate` VO itself does not enforce uniqueness. |
| **Violation** | Duplicate-due-date generation attempt rejected; no child task created. |

---

## Consistency Rules

### INV-TODO-08 — Soft-Delete Trash Recovery Window

| Aspect | Detail |
| --- | --- |
| **Rule** | Soft-deleted tasks are placed in the Trash and can be recovered by the user. Expired tasks are permanently purged after 30 days. |
| **Enforcement** | `TaskRepository` exposes soft-deleted queries. Purge scheduling is handled by an infrastructure process that sweeps tasks deleted past 30 days. User recovery simply resets lifecycle status. |
| **Violation** | Recovery attempt on purged tasks fails (no longer exist). |

---

### INV-TODO-09 — Mutations Blocked on Deleted / Purged Tasks

| Aspect | Detail |
| --- | --- |
| **Rule** | Update, complete, reopen, and tag operations are rejected when the task's status is `SoftDeleted` or when the aggregate no longer exists (Purged). |
| **Enforcement** | Each aggregate command method guards on `TaskLifecycleStatus` before applying changes. |
| **Violation** | Operation rejected with a domain error. |

---

### INV-TODO-10 — Recurrence Resume from Stopped is Prohibited

| Aspect | Detail |
| --- | --- |
| **Rule** | A `RecurrenceExecutionState` of `Stopped` is terminal; it cannot be resumed or transitioned to `Active` or `Paused`. |
| **Enforcement** | `Task` aggregate root rejects any transition from `Stopped` state; only `stopRecurrence()` leads into this state. |
| **Violation** | Resume or re-activation attempted on a stopped schedule is rejected. |

---

### INV-TODO-11 — ParentTaskId Integrity

| Aspect | Detail |
| --- | --- |
| **Rule** | When `ParentTaskId` is present on a child instance, it must not equal the task's own `TaskId`, and it must reference an existing parent task in the same `WorkspaceId`. |
| **Enforcement** | Verified by `RecurrenceInstanceGenerationService` at creation time via repository lookup; not checked inside the `ParentTaskId` VO alone. |
| **Violation** | Instance creation rejected if parent not found or workspace mismatch. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-TODO-01 | Validation | Title must be non-empty |
| INV-TODO-02 | Validation | Exactly one Priority at all times |
| INV-TODO-03 | Validation | Task scoped to one WorkspaceId forever |
| INV-TODO-04 | Validation | Tags unique (case-sensitive), non-blank |
| INV-TODO-05 | Validation | Recurrence pattern must be Daily/Weekly/Monthly |
| INV-TODO-06 | Validation | Instances inherit parent Priority and Tags at generation |
| INV-TODO-07 | Validation | No duplicate due dates across sibling instances |
| INV-TODO-08 | Consistency | Soft-deleted tasks placed in Trash; purged after 30 days |
| INV-TODO-09 | Consistency | Mutations blocked on SoftDeleted / Purged tasks |
| INV-TODO-10 | Consistency | RecurrenceExecutionState Stopped is terminal |
| INV-TODO-11 | Consistency | ParentTaskId must reference a valid parent task |
