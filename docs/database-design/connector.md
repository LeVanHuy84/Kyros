# Connector Bounded Context Database Design

This document details the logical database design for the **Connector** Bounded Context.

---

## 1. Context Overview

### Purpose
The Connector context serves as the integration hub and Anti-Corruption Layer (ACL) shielding productivity schemas from external SaaS APIs. It tracks connection authorizations, configures sync boundaries, and registers data collision conflicts.

### Aggregate Ownership
- **Connection** (Aggregate Root): Encapsulates external account status, sync schedules, and token storage keys.
- **SyncConflict** (Aggregate Root): Represents data collision state when remote data diverges from local task/calendar data.

### Persistence Responsibility
The Connector context is responsible for connection configs and mapping records. Credentials are stored encrypted inside Vault; this database schema stores only references to Vault credentials.

---

## 2. Entity → Table Mapping

| Bounded Context Aggregate / Entity / VO | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **Connection** (Aggregate Root) | `connector.connections` | Table |
| `ConnectionId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `ProviderType` (Value Object) | `provider_type` (VARCHAR) | Column |
| `SyncMode` (Value Object) | `sync_mode` (VARCHAR) | Column |
| `SyncFilterRules` (Value Object) | `sync_filter_rules` (JSONB) | Column |
| `CredentialVaultReference` (Value Object)| `credential_vault_reference` (VARCHAR)| Column |
| `ConnectionStatus` (Value Object) | `status` (VARCHAR) | Column |
| `SyncBackoffState` (Value Object) | `is_in_backoff`, `retry_after` | Column + Timestamp |
| `SyncRunTimestamp` | `last_successful_sync_at`, `last_failed_sync_at` | Columns (TIMESTAMPTZ) |
| `SyncErrorMessage` | `last_sync_error_message` (TEXT) | Column |
| **SyncConflict** (Aggregate Root) | `connector.sync_conflicts` | Table |
| `ConflictId` | `id` (UUID) | Primary Key Column |
| `EntityTypeReference` | `entity_type` (VARCHAR) | Column |
| `LocalEntityReference` | `local_entity_id` (VARCHAR) | Column |
| `RemoteEntityReference` | `remote_entity_id` (VARCHAR) | Column |
| `ConflictSnapshot` (Local/Remote) | `local_snapshot`, `remote_snapshot` | Columns (JSONB) |
| `ConflictStatus` | `status` (VARCHAR) | Column |
| `ResolutionStrategy` (Value Object) | `resolution_strategy` (VARCHAR) | Column |
| `ResolvedAt` | `resolved_at` (TIMESTAMPTZ) | Column |

---

## 3. Table Definitions

### Table: `connector.connections`

#### Purpose
Tracks configured external SaaS accounts and sync statuses.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global connection identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Tenant workspace separation. |
| `provider_type` | `VARCHAR(50)` | `NOT NULL` | *None* | `CHECK (provider_type IN ('GoogleCalendar', 'GitHub', 'Slack', 'Jira', 'TickTick', 'Notion', 'Outlook'))` | External integration system. |
| `sync_mode` | `VARCHAR(50)` | `NOT NULL` | `'Bidirectional'` | `CHECK (sync_mode IN ('Bidirectional', 'OneWayImport', 'OneWayExport'))` | Sync flow mode. |
| `sync_filter_rules` | `JSONB` | `NOT NULL` | `'{}'::jsonb` | *None* | Configuration criteria (folders, filters). |
| `credential_vault_reference`| `VARCHAR(255)`| `NOT NULL` | *None* | *None* | Key reference pointing to encrypted credentials in Vault. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Active'` | `CHECK (status IN ('Active', 'Suspended', 'Unauthorized', 'Syncing'))` | Execution status. |
| `last_successful_sync_at`| `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Timestamp of last successful execution. |
| `last_failed_sync_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Timestamp of last failed run. |
| `last_sync_error_message`| `TEXT` | `NULLABLE` | `NULL` | *None* | Truncated diagnostic text. |
| `is_in_backoff` | `BOOLEAN` | `NOT NULL` | `FALSE` | *None* | Marks a connection temporarily quiesced after repeated failures. |
| `retry_after` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Earliest instant the sync scheduler may retry the connection. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `connector.sync_conflicts`

#### Purpose
Stores data collisions detected during synchronization runs.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Tenant workspace separation. |
| `connection_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `connector.connections(id) ON DELETE CASCADE` | Physical FK to connection. |
| `entity_type` | `VARCHAR(50)` | `NOT NULL` | *None* | `CHECK (entity_type IN ('Task', 'Event'))` | Target system resource category. |
| `local_entity_id` | `VARCHAR(255)`| `NOT NULL` | *None* | *None* | Logical identifier of the local task or event record. |
| `remote_entity_id` | `VARCHAR(255)`| `NOT NULL` | *None* | *None* | External system ID of the resource. |
| `local_snapshot` | `JSONB` | `NOT NULL` | *None* | *None* | Snapshot of local properties before conflict. |
| `remote_snapshot` | `JSONB` | `NOT NULL` | *None* | *None* | Snapshot of provider properties before conflict. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Pending'` | `CHECK (status IN ('Pending', 'Resolved', 'Ignored'))` | Resolution status. |
| `resolution_strategy` | `VARCHAR(50)` | `NULLABLE` | `NULL` | `CHECK (resolution_strategy IN ('LocalWins', 'RemoteWins', 'Manual'))` | Strategy applied when the conflict was resolved. |
| `resolved_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant the conflict moved out of `Pending`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Instant collision was registered. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |

---

## 4. Relationships

- **Composition**: `connector.connections` has a physical foreign key to `connector.sync_conflicts` with cascade deletion.
- **Reference by ID**:
  - `workspace_id` links logically to `workspace.workspaces.id`.
  - `local_entity_id` references either `todo.tasks.id` or `calendar.calendar_events.id` logically. No constraints are enforced in the database.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_connections` | `id` | B-Tree (Implicit) | Primary key index. |
| `pk_sync_conflicts` | `id` | B-Tree (Implicit) | Primary key index. |
| `idx_connections_workspace` | `workspace_id` | B-Tree | Optimizes loading all integration profiles for a tenant. |
| `idx_connections_retry_due` | `retry_after` WHERE `is_in_backoff = TRUE` | B-Tree (Partial) | Optimizes the sync scheduler scan for connections whose backoff has elapsed. |
| `idx_conflicts_workspace_pending` | `workspace_id`, `status`, `created_at` | B-Tree (Composite) | **Critical** index to quickly retrieve outstanding conflicts for display in the client dashboard. |
| `idx_conflicts_connection` | `connection_id` | B-Tree | Optimizes lookup of conflicts related to a sync channel. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Active Conflicts Fetch**: `SELECT * FROM connector.sync_conflicts WHERE workspace_id = :wsId AND status = 'Pending' ORDER BY created_at ASC`. Optimized by composite index `idx_conflicts_workspace_pending`.
- **List Connections**: `SELECT * FROM connector.connections WHERE workspace_id = :wsId`. Optimized by index `idx_connections_workspace`.
- **Retry Scan**: `SELECT * FROM connector.connections WHERE is_in_backoff = TRUE AND retry_after <= NOW()`. Optimized by partial index `idx_connections_retry_due`.

### Expected Write Patterns
- **Conflict Insertion**: Occurs asynchronously during background sync runs when collisions are detected. Low concurrency.
- **Conflict Resolution**: Updates `status`, `resolution_strategy`, and `resolved_at` when the user resolves a conflict from the dashboard.

---

## 7. Integrity Rules

- **Conflict Isolation**: Conflicts block subsequent automatic sync runs for that specific resource until resolved (enforced in background sync logic).
- **Unique Connection Profile**: Typically, workspaces restrict mappings to one connection profile per `provider_type` to prevent double-syncing. This is enforced in application service validation.
- **Backoff Discipline**: A connection enters `is_in_backoff` after repeated failures; the scheduler must not pick it up before `retry_after`.

---

## 8. Persistence Notes

- **Optimistic Locking**: Tracked on `connections` via `version` column.
- **Vault Security**: Secret keys, refresh tokens, and passwords must never be persisted in this schema; they are managed inside Vault, referenced via the `credential_vault_reference` column.

---

## 9. Future Evolution

- **Sync Log Tracing**: A table `connector.sync_logs (id, connection_id, status, run_start, run_end, records_synced, error_summary)` will be introduced post-MVP to audit performance.
- **Auto-Resolve Policies**: Default conflict resolutions (e.g. `LocalWins`, `RemoteWins`) will be mapped as columns on `connections` when multi-system routing rules expand.
