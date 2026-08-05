# Aggregate Discovery — Connector Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Connector Bounded Context** (Connector Hub) of the AI Executive Assistant.

---

## 1. Business Capabilities

The Connector bounded context is responsible for the following business capabilities:

- **Connection Lifecycle Management**: Registering connector plugins, authorizing connections using OAuth/API tokens, and managing connection states (active, disabled, suspended).
- **Sync Job Orchestration**: Scheduling, executing, and tracking data synchronization runs, enforcing rate limits, and handling retry backoffs.
- **Model Translation (ACL)**: Abstracting and converting third-party service schemas (e.g. Google Calendar JSON, TickTick task objects) into clean internal domain representations.
- **Sync Conflict Resolution**: Detecting diverging edits between local and remote datasets, flagging conflicts, and applying user-resolved merge decisions.

---

## 2. Aggregate Candidates

To model the integration engine, the domain defines two Aggregate Candidates:

### 1. Connection Aggregate
- **Why it should be an Aggregate**:
  A Connection represents the active integration profile for a user's workspace and a specific provider. It manages the lifecycle state, sync configuration (one-way vs bidirectional), rates tracking, and security credentials reference. It has its own unique identity (`ConnectionId`) and is the primary aggregate for managing integration configurations.
- **Responsibilities**:
  - Encapsulates: Connection ID, Workspace ID, Provider Type (Google Calendar, GitHub, Slack, etc.), Status (Active, Suspended, Unauthorized, Syncing).
  - Stores sync configuration parameters (Sync Mode, Filter Rules).
  - Logs execution timestamps (Last Successful Sync, Last Failure Sync, Error Message).
  - Holds reference keys to encrypted credentials stored in the Vault.
  - Manages connection status transitions.
- **Consistency Boundary**:
  A single `Connection` instance and its configuration parameters.
- **Transaction Boundary**:
  Scoped to a single `ConnectionId` within a specific `WorkspaceId`.

### 2. Sync Conflict Aggregate
- **Why it should be an Aggregate**:
  A Sync Conflict represents a state where a resource (task, calendar event) has been updated concurrently in both local and remote locations since the last sync. Because conflict resolution requires manual human decisions, conflicts can persist for hours or days. Placing them in a separate aggregate decouples these long-lived resolution states from the short-lived, transient transaction of a sync execution run.
- **Responsibilities**:
  - Encapsulates: Conflict ID, Workspace ID, Connection ID, Target Entity Type (Task, Event), Local Entity ID reference, Remote Entity ID reference, Snapshot Data (both local and remote states), Status (Pending, Resolved, Ignored).
  - Resolves conflict (applying local wins, remote wins, or a custom merged representation).
  - Publishes resolution results to trigger synchronization updates.
- **Consistency Boundary**:
  A single `SyncConflict` instance.
- **Transaction Boundary**:
  Scoped to a single `ConflictId` within a specific `WorkspaceId`.

---

## 3. Aggregate Relationships

The aggregates within the Connector Bounded Context interact through soft references:

### Connection $\leftrightarrow$ Sync Conflict (Soft Reference)
- **Relationship Type**: One-to-Many ($1..*$) detection link.
- **Design Pattern**: **Soft Reference by ID**.
- **Reasoning**: A `Sync Conflict` soft-references its parent `ConnectionId`. When a sync job executes and detects concurrent modifications, it creates a `Sync Conflict` aggregate and commits it. The conflict is then resolved independently via user-facing ports, and the resolution applies updates back to the target entity, triggering a follow-up sync if necessary. This keeps the transaction boundaries clean.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Connector context:

1. **Strict Seam Isolation (No Direct DB Writing)**: The Connector Hub must never write or update database tables owned by other contexts (e.g. `todos` or `calendar_events`). All sync actions must go through public ports (`TodoPort`, `CalendarPort`).
2. **Credential Encryption Enclosure**: Plaintext integration credentials (passwords, OAuth access tokens) must never be stored in the connector database. They must be saved in the Vault via the `CredentialVaultPort`.
3. **WorkspaceTenancy isolation**: All Connections and Sync Conflicts must strictly belong to a single `WorkspaceId`. Synchronizing data across workspace boundaries is prohibited.
4. **Data Sanitization Rule**: All data imported from external sources must be validated and sanitized to match local invariants (e.g., tasks must have titles, priority must be High/Medium/Low) before calling internal ports.
5. **Conflict Interception**: If concurrent modifications are detected on a synchronized record, automatic sync must be suspended for that record, and a `Sync Conflict` aggregate must be created.
6. **Task Extraction Confirmation**: External task creation from incoming email processing (`CON-004`) must not execute automatically; it must be held in a pending state until user approval is resolved.

---

## 5. Domain Responsibilities

### What the Connector Context Owns
- The database schema for connection settings, sync jobs, and sync conflicts.
- Orchestrating the synchronization schedules, rates, and backoffs.
- Translating (ACL mapping) external API payloads into clean native value objects.
- Flagging and resolving sync conflicts.
- Emitting events: `ConnectorSynced`, `ConnectorSyncFailed`.

### What the Connector Context DOES NOT Own
- **User Authentication**: Managed by `Auth`.
- **Encrypted Storage of credentials**: Delegated to the `CredentialVaultPort` implementation.
- **Productivity business rules**: Owned by `Todo` and `Calendar`.
- **Notification delivery rules**: Managed by `Notification`.
- **Human approvals UI and workflow**: Managed by `AI Agent` (though Connector triggers it).
