# Entity Model — Todo Bounded Context

This document defines aggregate roots, internal entities, and their responsibilities for the **Todo Bounded Context**. There is a single aggregate: **Task**.

---

## Task Aggregate

### Aggregate Root: Task

#### Responsibilities

- Acts as the consistency boundary for all task data and state within one `WorkspaceId`.
- Encapsulates core task content: title, description, priority, optional due date, and tags.
- Enforces task-level invariants (mandatory title, single priority, workspace scope, tag rules).
- Controls lifecycle transitions between active work, completion, and logical deletion.
- Optionally owns a **RecurrenceSchedule** when the task is configured as a recurring template (parent task).
- Holds an optional **ParentTaskId** soft reference when the task is a recurrence instance (child task); does not load or mutate the parent aggregate.
- Records domain-significant state changes as domain events (e.g. task created, completed, recovered) for publication by the application layer.
- Rejects mutations when the task is soft-deleted, purged, or when workspace scope does not match the operation context.

#### Identity

- Global identity: **TaskId** (unique within the system).
- Tenancy: every task is permanently bound to exactly one **WorkspaceId**; identity checks for reads and writes always include workspace scope.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Created** | Task initialized with valid title, priority (default Medium if unspecified), workspace, and optional fields. |
| **Active** | Task is visible and mutable; completion and soft-delete are allowed. |
| **Completed** | Task marked finished; may transition back to **Active** (reopen). |
| **Soft-deleted** | Task hidden from normal views; recovery allowed only while recovery policy permits. |
| **Purged** | Task permanently removed from the domain; aggregate ceases to exist (terminal). |

Recurrence template tasks additionally drive **RecurrenceSchedule** execution state (see entity below). Child instance tasks follow the same task lifecycle independently of the parent.

#### Public behaviors

**Creation and content**

- Initialize a new task with title, workspace, priority, optional description, due date, and tags (via factory when rules are non-trivial).
- Update title, description, priority, and due date while active (and where business rules allow for completed tasks, if any).
- Add, remove, or replace tags (case-sensitive uniqueness within the task’s tag set).

**Completion**

- Mark complete (Active → Completed).
- Reopen (Completed → Active).

**Deletion and recovery**

- Soft-delete (Active or Completed → Soft-deleted).
- Recover (Soft-deleted → Active) from the Trash before permanent purging.

**Recurrence (parent / template tasks only)**

- Attach or replace recurrence configuration (pattern and interval) directly on the Task.
- Pause, resume, or stop recurrence execution.
- Parent task does **not** create child instance aggregates directly; instance creation is delegated to a domain service (see `domain-services.md`).

**Recurrence instances**

- Behave as normal tasks for update, complete, soft-delete, and recovery.
- Carry **ParentTaskId** for traceability; mutating an instance does not require locking the parent.

**Queries (on loaded aggregate)**

- Expose current lifecycle status, priority, tags, due date, and recurrence role (none / parent / instance).

---

### Entities outside this aggregate (related by ID only)

**Recurrence instance tasks** are full **Task** aggregate roots with their own **TaskId**, not entities inside the parent. Relationship: optional **ParentTaskId** value on the child points to the parent template’s **TaskId**.

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | Task | TaskId (+ WorkspaceId for tenancy) |

No other entities exist inside the Task aggregate. Tags, priority, titles, and references are modeled as value objects (see `value-object-model.md`).
