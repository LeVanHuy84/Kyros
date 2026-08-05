# Repository Model — Todo Bounded Context

One repository exists per aggregate root: **TaskRepository** for the **Task** aggregate.

Persistence technology, mapping, and SQL are out of scope. This document describes domain-facing responsibilities only.

---

## TaskRepository

**Aggregate root**: Task

### Responsibilities

**Identity and tenancy**

- Load a **Task** by **TaskId** scoped to **WorkspaceId**; return empty when the task does not exist or belongs to another workspace.
- Persist (insert or update) a **Task** aggregate after in-memory invariants and lifecycle rules have been applied.
- Remove a **Task** from storage when the domain has reached the **Purged** terminal state (hard-delete).

**Consistency with domain operations**

- Support saving a newly created task or recurrence instance produced by factories and domain services in a single unit of work per aggregate instance.
- Ensure optimistic concurrency or equivalent conflict detection when the same **TaskId** is updated concurrently (responsibility stated at domain boundary; mechanism not specified here).

**Recurrence**

- Load parent template tasks that have an active **RecurrenceSchedule** when scheduling processes need candidates for instance generation (query responsibility, not scheduling logic).
- Find existing recurrence **instances** for a given **ParentTaskId** within a **WorkspaceId**, including their **DueDate** values, so the domain service can enforce **no overlapping due dates** among instances from the same parent.
- Persist new instance aggregates independently of the parent (separate save per **TaskId**).

**Soft-delete and purge**

- Find soft-deleted tasks that exceed the Trash retention period and are eligible for purge.
- Support recovery flows by loading soft-deleted tasks by **TaskId** and **WorkspaceId** when the aggregate allows recovery.

**Read-oriented access (domain-aligned queries)**

- List or search tasks within a **WorkspaceId** filtered by priority, tags, lifecycle status, and due date ranges for use cases that operate on aggregate loads or domain-specified filters (not API design).
- Count or existence-check tasks matching filter criteria without loading full aggregates when the domain operation only needs confirmation (e.g. duplicate due date check for recurrence).

### Out of scope

- Cross-workspace queries or joins with Auth, Workspace, Calendar, or Connector data.
- Publishing domain events (handled after successful persistence in the application layer).
- Computing next occurrence dates (domain service / value object validation, not repository).

### Contract expectations

- Every mutating call assumes the caller holds a valid, workspace-scoped **Task** aggregate instance.
- Repository implementations must never return a task from a different **WorkspaceId** than requested.
- One repository interface per **Task** aggregate root; recurrence settings are persisted as part of the **Task** aggregate.
