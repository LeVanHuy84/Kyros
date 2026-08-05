# Todo Bounded Context Database Design

This document details the logical database design for the **Todo** Bounded Context.

---

## 1. Context Overview

### Purpose
The Todo context handles task lifecycle management, including task creation, modification, completion, categorization tags, recurrence setups, and trash-bin recovery.

### Aggregate Ownership
- **Task** (Aggregate Root): Encapsulates task descriptions, status states, tags, and recurrence templates.

### Persistence Responsibility
The Todo context maintains the task schema and task tag lists. All table reads and writes are scoped to the active tenant workspace.

---

## 2. Entity → Table Mapping

| Bounded Context Concept / Value Object | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **Task** (Aggregate Root) | `todo.tasks` | Table |
| `TaskId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `ParentTaskId` (Value Object) | `parent_task_id` (UUID) | Logical Self-Reference Column |
| `Title` (Value Object) | `title` (VARCHAR) | Column |
| `Description` (Value Object) | `description` (TEXT) | Column |
| `Priority` (Value Object) | `priority` (VARCHAR) | Column |
| `TaskLifecycleStatus` (Value Object) | `status` (VARCHAR) | Column |
| `DueDate` (Value Object) | `due_date` (TIMESTAMPTZ) | Column |
| `RecurrencePattern` & `Interval` | `recurrence_rule` (VARCHAR) | Column (RFC 5545 Rule String) |
| `RecurrenceExecutionState` | `recurrence_status` (VARCHAR) | Column |
| `SoftDeleteMetadata` | `deleted_at` (TIMESTAMPTZ) | Column (Nullable) |
| `Tag` (Value Object Collection) | `todo.tags` | Child Table (Composition) |

---

## 3. Table Definitions

### Table: `todo.tasks`

#### Purpose
Stores user tasks, templates, and recurrence instances.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to tenant workspace. |
| `parent_task_id` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical self-ref pointing to parent template `TaskId`. |
| `title` | `VARCHAR(255)` | `NOT NULL` | *None* | `CHECK (length(trim(title)) > 0)` | Task title. |
| `description` | `TEXT` | `NULLABLE` | `NULL` | *None* | Optional task details. |
| `priority` | `VARCHAR(50)` | `NOT NULL` | `'Medium'` | `CHECK (priority IN ('High', 'Medium', 'Low'))` | Task priority rating. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Active'` | `CHECK (status IN ('Active', 'Completed'))` | Task lifecycle state. The soft-deleted state is derived from `deleted_at IS NOT NULL` rather than stored here. |
| `due_date` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Deadline timestamp. |
| `recurrence_rule` | `VARCHAR(255)` | `NULLABLE` | `NULL` | *None* | Recurrence specification (RFC 5545 rules). |
| `recurrence_status` | `VARCHAR(50)` | `NULLABLE` | `NULL` | `CHECK (recurrence_status IN ('Active', 'Paused', 'Stopped'))` | Execution state of parent template. |
| `title_tsv` | `TSVECTOR` | `NULLABLE` | *Generated* | *None* | `GENERATED ALWAYS AS (to_tsvector('english', title)) STORED`. Powers full-text title search. |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Timestamp of soft-deletion. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `created_by` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical audit ref to `auth.user_identities.id`. |
| `updated_by` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical audit ref to `auth.user_identities.id`. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `todo.tags`

#### Purpose
Stores tags associated with tasks (child table representing collection of value objects).

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key identifier. |
| `task_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `todo.tasks(id) ON DELETE CASCADE` | Physical foreign key to parent task. |
| `name` | `VARCHAR(100)` | `NOT NULL` | *None* | `CHECK (length(trim(name)) > 0)` | Tag name (case-sensitive). |

---

## 4. Relationships

- **Composition**: `todo.tasks` owns `todo.tags` with physical foreign key cascading deletions (`ON DELETE CASCADE`).
- **Reference by ID**:
  - `workspace_id` is a logical reference to `workspace.workspaces.id`.
  - `parent_task_id` is a logical self-reference pointing to `todo.tasks.id`.
  - `created_by` and `updated_by` are logical references to `auth.user_identities.id`.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_tasks` | `id` | B-Tree (Implicit) | Primary key. |
| `pk_tags` | `id` | B-Tree (Implicit) | Primary key. |
| `idx_tasks_workspace_status` | `workspace_id`, `status` | B-Tree | Optimizes primary active list fetches in a workspace. |
| `idx_tasks_workspace_status_due` | `workspace_id`, `status`, `due_date` | B-Tree (Composite) | Serves "active tasks in a workspace sorted by due date" (the default `GET /tasks` sort) in one index scan. |
| `idx_tasks_workspace_status_priority` | `workspace_id`, `status`, `priority` | B-Tree (Composite) | Optimizes priority filtering (`GET /tasks?priority=`). |
| `idx_tasks_parent` | `parent_task_id` | B-Tree | Optimizes listing recurrence child instances (`GET /tasks/{taskId}/instances`). |
| `idx_tasks_soft_deleted` | `workspace_id`, `deleted_at` | B-Tree (Partial, WHERE `deleted_at IS NOT NULL`) | Optimized index for Trash recovery bin and deleted-task listing. |
| `idx_tasks_deleted_at` | `deleted_at` | B-Tree (Partial, WHERE `deleted_at IS NOT NULL`) | Optimizes the global purge scheduler scan (workspace-agnostic). |
| `idx_tags_task_id` | `task_id` | B-Tree | Speeds up tag loading during task serialization. |
| `uq_tags_task_name` | `task_id`, `name` | B-Tree (Composite UQ) | Prevents duplicate tags on a single task. |
| `idx_tags_name_search` | `name` | B-Tree | Optimizes tag filtering searches (e.g. search tasks by tag name). |
| `idx_tasks_fts_title` | `title_tsv` | GIN | Full-text search index for task queries by title. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Active Task List**: `SELECT * FROM todo.tasks WHERE workspace_id = :wsId AND status = 'Active'`. Uses composite index `idx_tasks_workspace_status`.
- **Active Task List Sorted by Due Date**: `SELECT * FROM todo.tasks WHERE workspace_id = :wsId AND status = 'Active' ORDER BY due_date ASC`. Uses `idx_tasks_workspace_status_due` without a sort.
- **Search by Title**: `SELECT * FROM todo.tasks WHERE workspace_id = :wsId AND title_tsv @@ to_tsquery(:query)`. Uses GIN index `idx_tasks_fts_title`.
- **Trash Bin**: `SELECT * FROM todo.tasks WHERE workspace_id = :wsId AND deleted_at IS NOT NULL`. Optimized by partial index `idx_tasks_soft_deleted`.

### Expected Write Patterns
- **Task Creation / Instance Generation**: Insertion of task records.
- **Task Updating / Reopening / Completion**: Update records. Handled via `version` optimistic locking checks.
- **Recurrence Instance Generation**: Parent template generation of child instances runs in one transaction and increments the parent `version` to prevent double generation.

---

## 7. Integrity Rules

- **Soft Delete Recovery Window**: Logical deletes set `deleted_at` (soft-deleted state is derived from `deleted_at IS NOT NULL`). Tasks remain recoverable via `POST /tasks/{taskId}/recover` **for up to 2 hours**. A scheduled purge job physically deletes rows where `deleted_at` is older than **30 days**.
- **Cascades**: Physical task deletion cascade-deletes tags stored in `todo.tags` automatically.

---

## 8. Persistence Notes

- **Optimistic Locking**: Enforced via `version` column on `todo.tasks`.
- **Case-Sensitive Tags**: Tag creation trimmed, duplicates on a single task blocked via `uq_tags_task_name`.
- **Recurrence**: Recurrence rule configuration parsed in application code. Invalid recurrence patterns fail validation before persistence.

---

## 9. Future Evolution

- **Task Partitioning**: If task counts exceed tens of millions, list performance is maintained by partitioning `todo.tasks` tables using `LIST` partitioning on the `workspace_id` column (or hash ranges).
