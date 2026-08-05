# Value Object Model — Todo Bounded Context

Value objects describe immutable (or replace-on-change) concepts attached to the **Task** aggregate. They carry no independent lifecycle outside the aggregate.

---

## TaskId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifier (e.g. UUID or equivalent). |
| **Immutability** | Immutable once assigned to an aggregate. |
| **Validation** | Non-null; must be unique system-wide when persisted (enforced at repository/application boundary, not by the VO alone). |

---

## WorkspaceId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque identifier of the owning workspace (tenant boundary). |
| **Immutability** | Immutable for the lifetime of the task; cannot be changed after creation. |
| **Validation** | Non-null; must match the workspace context on every load and save operation. |

---

## ParentTaskId

| Aspect | Description |
| --- | --- |
| **Fields** | **TaskId** of the recurring template that generated this instance. |
| **Immutability** | Set at instance creation; immutable thereafter. |
| **Validation** | Optional (absent on non-instance tasks). When present, must not equal the task’s own **TaskId**; must reference an existing parent in the same **WorkspaceId** (verified when creating instances via domain service + repository). |

---

## Title

| Aspect | Description |
| --- | --- |
| **Fields** | Non-empty string representing the task name. |
| **Immutability** | Replace-on-change: updating title produces a new **Title** value. |
| **Validation** | Mandatory; trimmed content must not be empty or whitespace-only. |

---

## Description

| Aspect | Description |
| --- | --- |
| **Fields** | Optional free-text body. |
| **Immutability** | Replace-on-change. |
| **Validation** | May be null or empty; if length limits are introduced at domain level, enforce maximum length on construction. |

---

## Priority

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **High**, **Medium**, **Low**. |
| **Immutability** | Replace-on-change when user changes priority. |
| **Validation** | Exactly one value required at all times for non-purged tasks; default **Medium** when not specified at creation. |

---

## Tag

| Aspect | Description |
| --- | --- |
| **Fields** | Case-sensitive string label. |
| **Immutability** | Immutable string value; the task’s tag collection is updated by adding/removing **Tag** instances. |
| **Validation** | Non-empty after trim; no duplicate tags on the same task (case-sensitive equality); reject blank or whitespace-only labels. |

---

## DueDate

| Aspect | Description |
| --- | --- |
| **Fields** | Calendar date or date-time representing when the task is due (domain chooses date vs date-time consistently). |
| **Immutability** | Replace-on-change. |
| **Validation** | Optional on generic tasks; required when materialized as a recurrence **instance** at generation time. For instances from the same parent, due dates must be unique (enforced when generating instances, not inside a single **DueDate** VO). |

---

## RecurrencePattern

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **DAILY**, **WEEKLY**, **MONTHLY**. |
| **Immutability** | Replace-on-change. |
| **Validation** | Must be one of the supported enum values. |

---

## RecurrenceInterval

| Aspect | Description |
| --- | --- |
| **Fields** | Positive integer. |
| **Immutability** | Replace-on-change. |
| **Validation** | Must be >= 1. |

---

## RecurrenceExecutionState

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **Active**, **Paused**, **Stopped**. |
| **Immutability** | Replace-on-change on pause, resume, or stop. |
| **Validation** | Only meaningful on parent tasks with recurrence configured; transitions must be explicit (e.g. cannot resume from **Stopped**). |

---

## TaskLifecycleStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **Active**, **Completed**, **SoftDeleted** (purged tasks have no aggregate). |
| **Immutability** | Changes only through aggregate root behavior methods. |
| **Validation** | Transitions must follow allowed lifecycle (see `aggregate-discovery.md`); illegal transitions rejected at aggregate level. |

---

## SoftDeleteMetadata

| Aspect | Description |
| --- | --- |
| **Fields** | Timestamp when soft-delete occurred; optional markers for purge scheduling. |
| **Immutability** | Created at soft-delete. |
| **Validation** | Present only when **TaskLifecycleStatus** is **SoftDeleted**; timestamp required when status is soft-deleted. |

---

## RecurrenceInstanceSeed

| Aspect | Description |
| --- | --- |
| **Fields** | **WorkspaceId**, **ParentTaskId**, **Title** (often from parent), **Priority**, set of **Tag**, **DueDate** for the new instance. |
| **Immutability** | Immutable bundle passed from domain service to factory when creating a child **Task**. |
| **Validation** | Priority and tags copied from parent at generation time; **DueDate** must not collide with an existing instance for the same parent (checked outside the VO via domain service + repository). |

---

## Composition on Task

| Value object / type | Cardinality on Task |
| --- | --- |
| TaskId | 1 |
| WorkspaceId | 1 |
| ParentTaskId | 0..1 (instances only) |
| Title | 1 |
| Description | 0..1 |
| Priority | 1 |
| Tag | 0..* |
| DueDate | 0..1 (required on generated instances) |
| TaskLifecycleStatus | 1 |
| SoftDeleteMetadata | 0..1 |
| RecurrenceSchedule (entity holding RecurrenceRule + RecurrenceExecutionState) | 0..1 (parent templates) |
