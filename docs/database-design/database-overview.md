# Database Design Overview

This document establishes the canonical database design standards, conventions, and architectural rules for the **AI Executive Assistant** logical database model.

---

## 1. Database Engine & Version

The database engine for this project is **PostgreSQL (15+)**.

### Rationale
- **Relational Integrity**: Strong ACID compliance, robust referential integrity, and transaction boundaries are required to manage productivity data (Tasks, Calendar events) reliably.
- **JSONB Support**: Powerful document handling features (JSONB) are critical for storage of semi-structured connector payloads, tool parameter snapshots, and template configurations.
- **pgvector Extension**: The post-MVP roadmap requires vector storage for semantic memory and RAG grounding. Storing relational data and vector embeddings in the same database minimizes operational footprint and ensures consistent transaction boundaries.

---

## 2. Schema Architecture

To support the modular monolith architecture and ensure that modules are extraction-ready for future microservices, the database is partitioned into **isolated PostgreSQL schemas** corresponding to each bounded context.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Executive Assistant DB                    │
└─────────────────────────────────────────────────────────────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│   auth    │  │ workspace │  │   todo    │  │ calendar  │ ...
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

| Schema Name | Bounded Context | Purpose | Persistence Level |
| :--- | :--- | :--- | :--- |
| `auth` | Auth | User credentials, security states, global roles. | High (Critical Security) |
| `workspace` | Workspace | Tenant boundaries, memberships, configurations. | High (Critical Core) |
| `todo` | Todo | Task CRUD, tags, recurrence rules. | Standard |
| `calendar` | Calendar | Calendar events, scheduling, reminders. | Standard |
| `memory` | Memory | Conversation turns, user preferences, facts (post-MVP). | Standard / High (Semantic) |
| `notification` | Notification | In-app alerts, channel profiles, templates. | Standard |
| `agent` | AI Agent | Agent sessions, execution step DAGs, approvals. | High (Traceability) |
| `connector` | Connector | External connection profiles, conflict tables. | Standard / Encrypted |

---

## 3. Database Naming Conventions

Consistency in object naming ensures high code readability and simplifies programmatic mapping (e.g. via JPA).

| Object Type | Case Convention | Plurality | Example |
| :--- | :--- | :--- | :--- |
| **Schema** | `lower_case` | Singular | `todo` |
| **Table** | `lower_case_snake` | Plural | `tasks`, `calendar_events` |
| **Column** | `lower_case_snake` | Singular | `due_date`, `is_deleted` |
| **Primary Key** | `pk_tablename` | Singular | `pk_tasks` |
| **Foreign Key** | `fk_tablename_targettable` | Singular | `fk_reminders_calendar_events` |
| **Unique Index** | `uq_tablename_columnnames` | Singular | `uq_users_email` |
| **Non-Unique Index** | `idx_tablename_columnnames` | Singular | `idx_tasks_workspace_id` |
| **Check Constraint** | `chk_tablename_description` | Singular | `chk_tasks_due_date_after_created` |

---

## 4. UUID & Key Strategy

### UUID v4 as Default
Every primary key in the database must use **UUID v4** (PostgreSQL `uuid` type) to guarantee global uniqueness across contexts and systems.

### Rationale
- **Decoupled ID Generation**: Identifiers can be safely generated in application memory before saving to the database.
- **Microservices Extraction**: Merging or splitting schemas into separate databases is trivial, as primary keys will never collide.
- **Obfuscation**: IDs exposed in public REST URLs do not leak sequence counts or total records.

> [!NOTE]
> Database-side default UUID generation is handled using the `gen_random_uuid()` function in PostgreSQL.

---

## 5. Audit & Traceability Fields

All mutable entities must include standard audit fields to trace when and by whom data was created or modified.

| Column Name | Data Type | Nullability | Purpose | Default Value |
| :--- | :--- | :--- | :--- | :--- |
| `created_at` | `timestamp with time zone` | `NOT NULL` | Instant of row creation. | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | `NOT NULL` | Instant of last modification. | `CURRENT_TIMESTAMP` |
| `created_by` | `uuid` | `NULLABLE` | `UserId` that initiated creation. | `NULL` |
| `updated_by` | `uuid` | `NULLABLE` | `UserId` that initiated modification. | `NULL` |

> [!IMPORTANT]
> The audit fields `created_by` and `updated_by` store soft ID references matching a `UserId` in the `auth` schema. No foreign key constraints are declared across schemas for these columns.

---

## 6. Soft Delete Strategy

To support trash-bin recovery features (specifically the 2-hour recovery window in the Todo context) and preserve relational integrity, select tables implement soft deletion.

### Soft-Deletable Tables

| Table | Recovery Window | Physical Purge Retention | Rationale |
| :--- | :--- | :--- | :--- |
| `todo.tasks` | 2 hours | 30 days | User-facing trash bin (`TODO-001`). |
| `calendar.calendar_events` | 2 hours | 30 days | Cancel/delete lifecycle with sync conflict referencing (`CAL-001`). |
| `memory.memory_entries` | n/a | 30 days | User-visible semantic facts may be deleted (`MEM-003`). |
| `notification.in_app_notifications` | n/a | 30 days after `Read`/`Dismissed` | Inbox retention policy (`NOTIF-001`). |

> [!IMPORTANT]
> The recovery window (2 hours) and the physical purge retention (30 days) are distinct policies. Rows are recoverable only within the recovery window; hard deletion happens only after the purge retention expires. This resolves the earlier ambiguity where the Todo purge was documented as running after only 2 hours, which would have made the 2-hour trash-bin recovery impossible to guarantee.

### Column Mapping
- `deleted_at`: `timestamp with time zone` (nullable, defaults to `NULL`).
- An active row has `deleted_at IS NULL`.
- A deleted row has `deleted_at` set to the timestamp of deletion.
- The soft-deleted state must be derived from `deleted_at IS NOT NULL` rather than maintained in a parallel `status` value, to keep a single source of truth. Where a `status` column coexists (e.g. `calendar.calendar_events`), the two must be updated atomically in the same transaction.

### Rules
1. **Uniqueness Constraints**: Standard unique indexes block multiple rows with identical keys if some are soft-deleted. To resolve this, unique indexes on soft-deletable tables must be partial indexes (e.g. `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`).
2. **Cascades**: Soft deletes do not trigger cascading deletes on child tables. Instead, the application services handle logical deletion states consistently across parent-child structures.
3. **Data Purging**: A background task (scheduler) queries rows where `deleted_at` exceeds the purge retention (30 days for Todo tasks and Calendar events) and runs a hard delete (`DELETE FROM ...`). A dedicated partial index on `deleted_at` supports the global (workspace-agnostic) purge scan.

---

## 7. Concurrency & Optimistic Locking

To prevent the "Lost Update" problem in a modular monolith with concurrent users and background worker syncs:

- All **Aggregate Roots** must include a `version` integer column.
- **Default value**: `0`.
- Every UPDATE query must increment the `version` column and check that the current database version matches the version retrieved on read:
  `UPDATE table_name SET ..., version = version + 1 WHERE id = :id AND version = :version`
- If no rows are updated, the application throws an `OptimisticLockingFailureException`.

---

## 8. Cross-Context Relationship Rules

Strict physical boundaries are enforced to prevent context coupling:

```
                  Synchronous Query (REST/gRPC/Port)
                 ┌────────────────────────────────┐
                 │                                ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Schema A (e.g., "todo")     │        │  Schema B (e.g., "workspace")│
│                              │        │                              │
│  Table: tasks                │        │  Table: workspaces           │
│  [id, workspace_id (UUID)]   │        │  [id (UUID), name]           │
└──────────────────────────────┘        └──────────────────────────────┘
                 X──────────────────────X
                     No Foreign Keys
                     No SQL Joins
```

### Rule 1: No Cross-Schema Foreign Keys
Tables in schema `A` must not define SQL foreign key constraints pointing to tables in schema `B`. References are made purely by storing the upstream ID as a standard UUID data column.

### Rule 2: No Cross-Schema Joins
SQL queries must never JOIN tables across different schemas. Cross-context queries must be solved either at the Application Layer (e.g. reading from `todo` repository, then querying `WorkspacePort` for workspace properties) or by building local read-only projections listening to domain events.

### Rule 3: Cascading Deletions
Standard database `ON DELETE CASCADE` is forbidden across schemas. If a workspace is deleted, the Workspace module publishes a `WorkspaceDeleted` event. Downstream contexts subscribe to this event and run their own local purging logic inside their own schema transactions.

---

## 9. Indexing Best Practices

To ensure high performance across anticipated read/write patterns:

1. **Foreign Keys**: Every foreign key column inside a schema must have a corresponding index to optimize join and cascade performance.
2. **Covering Indexes**: Use `INCLUDE` columns for high-throughput queries to allow index-only scans.
3. **Partial Indexes**: Apply indexes with `WHERE` clauses to ignore soft-deleted rows (`deleted_at IS NOT NULL`), status-archived records, or null values.
4. **Text Search**: Use `gin` indexes on `to_tsvector` columns for full-text search features in the Todo and Notes domains. Prefer a **stored generated column** (e.g. `title_tsv`) so the indexed expression can be referenced directly in application queries (JPA/Hibernate) without duplicating the `to_tsvector` expression.
5. **Sort & Filter Covering**: Composite indexes must be ordered to serve the most common `WHERE` + `ORDER BY` combinations. For example, `(workspace_id, status, due_date)` serves "active tasks in a workspace sorted by due date" in a single index scan.
6. **Pagination**: All list endpoints use offset pagination (`page`/`size`) except the Connector context, which uses cursor pagination (`limit`/`cursor`). Indexes must support stable `ORDER BY` keys (PK or unique column) for cursor pagination.

## 10. Recurrence & Reminder Time Storage

Lead times for reminders are stored as **integer minutes** (not `VARCHAR` interval strings) so that `trigger_time = start_time - lead_time_minutes` is computed and stored at write time, and scheduler polling can compare `trigger_time <= NOW()` directly without parsing interval text. This aligns the database with the API field `leadTimeMinutes`.
