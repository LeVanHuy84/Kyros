# Database Migration Strategy

This document describes the tooling, versioning, deployment policies, and strategies to update the **AI Executive Assistant** database schema safely and without downtime.

---

## 1. Migration Tool Recommendation

We recommend **Flyway** as the database migration tool for the AI Executive Assistant.

### Rationale
- **Spring Boot Integration**: Flyway has first-class integration with Spring Boot, running migrations automatically during application startup if configured.
- **SQL-First Approach**: Flyway uses standard SQL files. Database engineers can write and tune raw SQL migrations directly without learning XML/YAML-based schema abstractions.
- **Multi-Schema Support**: Flyway can target different schemas sequentially or run separate migration folders per schema, matching our modular monolith schema architecture.

---

## 2. Migration Versioning Convention

Flyway migration scripts must be saved in standard locations and follow a strict naming pattern to prevent version clashes.

### Directory Structure
```
src/main/resources/db/migration/
  ├── auth/
  │    ├── V1.0.0__init_auth_schema.sql
  │    └── V1.1.0__add_lockout_index.sql
  ├── workspace/
  │    ├── V1.0.0__init_workspace_schema.sql
  │    └── ...
  ├── todo/
  │    └── V1.0.0__init_todo_schema.sql
  ...
```

### Script Naming Format
`V<Version>__<Description>.sql`

- **`V`**: Prefix for versioned migrations (cannot be modified).
- **`<Version>`**: Semantic versioning numbers separated by periods (e.g. `1.0.0` or `2026.08.04.12.00`).
- **`__`**: Two underscores separating the version and description.
- **`<Description>`**: Brief description of the changes in `snake_case` (e.g., `add_due_date_to_tasks`).

> [!NOTE]
> For local development, versions can use date-time prefixes (e.g. `V20260804120000__add_index`) to prevent version conflicts when multiple developers write migrations in parallel.

---

## 3. Backward Compatibility Strategy

To support zero-downtime deployments, every migration must preserve **backward compatibility**. The database schema must be able to support two versions of the application code running concurrently (the current production version and the new version being deployed).

### Rules for Compatibility
1. **No Destructive Operations**: Never drop columns or tables in the initial deployment step.
2. **Nullable on Addition**: Newly added columns must be `NULLABLE` or have a database-level `DEFAULT` value.
3. **Expand and Contract Pattern**: Deleting a column or changing a data type must be broken down into three distinct release phases:
   - **Phase 1 (Expand)**: Add the new column/table as nullable. The new code writes to both the old and new columns.
   - **Phase 2 (Migrate)**: Run a background job to copy historical data from the old column to the new column. The new code reads from the new column.
   - **Phase 3 (Contract)**: In a subsequent release, delete the old column.

---

## 4. Zero-Downtime Migration Guidelines

Executing migrations on busy production databases requires specific care to prevent tables from locking up.

### Lock Avoidance in PostgreSQL
- **Adding Columns with Defaults**: In PostgreSQL 11+, adding a column with a default value does not write to all rows immediately and is very fast. In older versions, avoid default values that cause a full table rewrite.
- **Creating Indexes**: Never create indexes with standard `CREATE INDEX` on active tables, as this locks reads and writes. Always use the `CONCURRENTLY` keyword:
  `CREATE INDEX CONCURRENTLY idx_tasks_due_date ON todo.tasks (due_date);`
- **Adding Constraints**: Add foreign keys and check constraints with the `NOT VALID` option first. This adds the constraint instantly without validating existing data. Validate the data subsequently in the background. This applies to **intra-schema** constraints only (e.g. `todo.tags → todo.tasks`):
  `ALTER TABLE todo.tags ADD CONSTRAINT fk_tags_tasks FOREIGN KEY (task_id) REFERENCES todo.tasks(id) NOT VALID;`
  `ALTER TABLE todo.tags VALIDATE CONSTRAINT fk_tags_tasks;`

> [!WARNING]
> Cross-schema foreign keys are **forbidden** by design (see `database-overview.md` §8). An `ALTER TABLE` that adds a foreign key from a table in schema `A` to a table in schema `B` (e.g. `todo.tasks.workspace_id → workspace.workspaces.id`) must **never** be written, not even with `NOT VALID`. Cross-context references are logical ID columns without constraints, resolved at the application layer or via read projections.

---

## 5. Rollback Strategy

Traditional down-migrations (`U` scripts) are brittle and prone to data loss if they drop columns containing active production data.

### Standard Rollback Policy
1. **Forward-Only Migrations**: The primary way to roll back a broken change is to deploy a new forward migration (`V` script) that reverts the schema changes or fixes the bug.
2. **Code Toggles**: Features relying on schema changes should be gated behind application feature flags. If the feature causes issues, the flag is disabled without requiring a database rollback.
3. **Hotfixes**: If a rollback must happen:
   - Run a manual script to safely extract data written to new columns since deployment.
   - Revert the schema using manual SQL commands validated in a staging environment.
   - Restore the database from the last transaction-consistent snapshot only as a last resort in case of catastrophic data corruption.
