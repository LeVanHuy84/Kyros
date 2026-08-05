# ADR-0010: Database Migration, Soft Delete, and Concurrency Policies

## Status
Approved

## Context
Relational database tables are modified by multiple concurrent processes (e.g., user REST requests, AI Agent planners, and background Connector sync jobs). This creates risks of the "Lost Update" concurrency problem. Additionally, users require a trash-bin feature to recover accidentally deleted tasks or events. Finally, updating schema structures in production must happen safely, without downtime, and in a backward-compatible manner.

## Decision
We enforce standardized policies for migrations, soft deletes, concurrency, and time storage:

1. **Database Migrations (Flyway)**: We use **Flyway** to manage database schemas. Migrations are SQL-first and structured in separate directories per bounded context schema. Versioning follows a strict semantic structure.
2. **Backward-Compatible Migrations**: Every migration must be backward-compatible (no immediate column drops, new columns must be nullable or have defaults) to support zero-downtime blue-green deployments. Indexes must be created using the `CONCURRENTLY` keyword.
3. **Concurrency Control**: We enforce optimistic locking on all aggregate roots by including a `version` integer column.
4. **Soft-Delete Recovery**: Selected tables (Tasks, Calendar events) implement soft deletion using a `deleted_at` timestamp.
   - **Recovery Window**: Soft-deleted rows are user-recoverable for a strict **2-hour** inactivity duration.
   - **Physical Purge**: An automated background scheduler permanently deletes soft-deleted records after **30 days**.
5. **Standardized Lead Times**: Lead times for notifications are stored as **integer minutes** (not string intervals) to allow simple database scheduler comparison queries (`NOW() >= event_start - lead_time_minutes`).

## Evidence
- [database-overview.md:L94-L121 (§6 Soft Delete Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L94-L121)
- [database-overview.md:L123-L133 (§7 Concurrency & Optimistic Locking)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L123-L133)
- [database-overview.md:L176-L179 (§10 Recurrence & Reminder Time Storage)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L176-L179)
- [migration-strategy.md:L7-L15 (§1 Migration Tool Recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L7-L15)
- [migration-strategy.md:L18-L34 (§2 Directory Structure)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L18-L34)
- [migration-strategy.md:L49-L77 (§3 Backward Compatibility & Zero-Downtime)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/migration-strategy.md#L49-L77)
- [requirements/user-stories-v2.md:L91-L101 (TODO-001 - Soft-delete story)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L91-L101)

## Alternatives
- **Automatic Hibernate Schema Generation (`ddl-auto=update`)**: Rejected. Highly dangerous for production databases, lacks change control, and does not support zero-downtime guidelines.
- **Hard Deletions**: Rejected. Violates the user stories requirement for a trash-bin recovery window.
- **Down-Migration Rollback Scripts (`U` scripts)**: Rejected. They are brittle and run a high risk of deleting active production data during automated rollbacks. We prefer forward-only migrations and feature toggles.

## Consequences
### Positive
- **Zero-Downtime Upgrades**: Application upgrades can deploy while old code versions continue to read and write to the database.
- **Lost Update Prevention**: Simultaneous edits from the UI and background workers are detected and handled safely via version checks.
- **Durable Recoverability**: Users can restore deleted tasks within the 2-hour window, while physical storage bloat is controlled by the 30-day purge scheduler.

### Negative
- **Application Query Filters**: Every select query must verify that `deleted_at IS NULL` to exclude trashed items, though partial indexes optimize this filter.
- **Constraint Complexity**: Unique indexes must be partial (e.g., `WHERE deleted_at IS NULL`) to allow creating new items with the same name as soft-deleted ones.

## Implementation Notes
- Add the `@Version` annotation to the `version` column in JPA aggregate entities.
- Place Flyway scripts under `src/main/resources/db/migration/<schema-name>/` named like `V1.0.0__init.sql`.
- Soft-deletable JPA entities should utilize the `@SQLDelete` and `@Where(clause = "deleted_at is null")` Hibernate annotations to automate soft deletes and filtering.
- Implement the purge scheduler as a background worker running a query to delete expired soft-deleted rows.
