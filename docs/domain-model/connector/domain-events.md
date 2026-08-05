# Domain Events — Connector Bounded Context

---

## ConnectionRegistered

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate (via application layer) |
| **Trigger** | A new integration profile is created for a `ProviderType` in a workspace; credentials stored in vault. |
| **Consumers** | `Notification` context (connection confirmation alert), audit log |
| **Business Meaning** | A new external integration is configured and ready for authorization and sync. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Unique identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `providerType` | ProviderType | Google Calendar / Jira / Slack etc. |
| `occurredAt` | Instant | Registration timestamp |

---

## ConnectionAuthorized

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate |
| **Trigger** | OAuth / API token flow completes; `CredentialVaultReference` updated; status transitions to `Active`. |
| **Consumers** | `Notification` context (authorization success), Sync scheduler |
| **Business Meaning** | Credentials are valid. Scheduled sync runs may now begin. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Authorized connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `providerType` | ProviderType | Provider |
| `occurredAt` | Instant | Authorization timestamp |

---

## ConnectionSuspended

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate (via user or admin action) |
| **Trigger** | User/admin suspends the connection (`Active → Suspended`). |
| **Consumers** | Sync scheduler (halt scheduled runs), `Notification` context |
| **Business Meaning** | Sync is paused by user choice. No new sync runs until reactivated. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Suspended connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Suspension timestamp |

---

## ConnectionReactivated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate |
| **Trigger** | Suspended connection returned to `Active`. |
| **Consumers** | Sync scheduler (resume), `Notification` context |
| **Business Meaning** | Sync may resume from the last successful run. |

---

## ConnectionUnauthorized

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate |
| **Trigger** | Token revoked or expired; status transitions to `Unauthorized`. |
| **Consumers** | `Notification` context (alert user to re-authorize), sync scheduler (halt runs) |
| **Business Meaning** | Credentials are no longer valid. All sync runs are blocked until the user re-authorizes and updates the vault reference. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Unauthorized connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Timestamp |

---

## ConnectorSynced

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate (via sync orchestration service) |
| **Trigger** | A sync run completes successfully; last-successful-sync timestamp updated. |
| **Consumers** | `Notification` context (optional sync summary), audit log |
| **Business Meaning** | Local data is up to date with the external provider for this connection. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Synced connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `syncedAt` | SyncRunTimestamp | Last successful sync instant |
| `recordsProcessed` | integer | Items imported/exported |

---

## ConnectorSyncFailed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Connection` aggregate (via sync orchestration service) |
| **Trigger** | A sync run fails; last-failure timestamp and error message recorded on the aggregate. |
| **Consumers** | `Notification` context (failure alert), audit log, retry scheduler |
| **Business Meaning** | Sync did not complete. Backoff retry will be scheduled. Repeated failures may trigger connection suspension or re-authorization. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Failed connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `failedAt` | SyncRunTimestamp | Failure instant |
| `errorMessage` | SyncErrorMessage | Diagnostic text (no secrets) |

---

## SyncConflictRaised

| Attribute | Detail |
| --- | --- |
| **Publisher** | `SyncConflict` aggregate (via sync orchestration service) |
| **Trigger** | Concurrent modifications detected on the same logical resource; a `SyncConflict` aggregate is created with both snapshots. Automatic sync suspended for the affected record. |
| **Consumers** | `Notification` context (alert user to resolve conflict), `AI Agent` (optional: surface conflict for assisted resolution) |
| **Business Meaning** | A data integrity hazard has been detected. The user must choose a resolution strategy before the record can be synced again. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conflictId` | ConflictId | Unique conflict identifier |
| `connectionId` | ConnectionId | Source connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `entityType` | EntityTypeReference | Task / Event |
| `localEntityId` | LocalEntityReference | Local record id |
| `remoteEntityId` | RemoteEntityReference | Provider-native record id |
| `occurredAt` | Instant | Detection timestamp |

---

## SyncConflictResolved

| Attribute | Detail |
| --- | --- |
| **Publisher** | `SyncConflict` aggregate |
| **Trigger** | User applies a resolution strategy (`LocalWins`, `RemoteWins`, `CustomMerge`); conflict transitions `Pending → Resolved`. |
| **Consumers** | Sync orchestration service (apply resolved data to `TodoPort` or `CalendarPort`), `Notification` context (resolution confirmation) |
| **Business Meaning** | The data divergence has been merged. Sync for the affected record resumes via the appropriate domain port. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conflictId` | ConflictId | Resolved conflict |
| `connectionId` | ConnectionId | Source connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `strategy` | ConflictResolutionStrategy | LocalWins / RemoteWins / CustomMerge |
| `occurredAt` | Instant | Resolution timestamp |

---

## SyncConflictIgnored

| Attribute | Detail |
| --- | --- |
| **Publisher** | `SyncConflict` aggregate |
| **Trigger** | User ignores the conflict (`Pending → Ignored`); auto-sync remains suspended for the record per policy. |
| **Consumers** | `Notification` context (optional note), audit log |
| **Business Meaning** | User declined to merge. The record will not be auto-synced unless the conflict is later revisited or the connection is re-configured. |

---

## ExternalTaskExtractionPending

| Attribute | Detail |
| --- | --- |
| **Publisher** | Sync orchestration service |
| **Trigger** | Incoming email processing detects a potential task; placed in pending state awaiting user approval before creation via `TodoPort`. |
| **Consumers** | `Notification` context (alert user for approval), `AI Agent` (optional assisted triage) |
| **Business Meaning** | An automated extraction must not execute without user confirmation per the invariant. The user must explicitly approve or reject the task creation. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `connectionId` | ConnectionId | Source connection |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `extractedPayload` | SanitizedExternalPayload | Proposed task fields |
| `occurredAt` | Instant | Detection timestamp |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| ConnectionRegistered | Connection | Notification, Audit |
| ConnectionAuthorized | Connection | Notification, Sync Scheduler |
| ConnectionSuspended | Connection | Sync Scheduler, Notification |
| ConnectionReactivated | Connection | Sync Scheduler, Notification |
| ConnectionUnauthorized | Connection | Notification, Sync Scheduler |
| ConnectorSynced | Connection / Sync Service | Notification, Audit |
| ConnectorSyncFailed | Connection / Sync Service | Notification, Retry Scheduler, Audit |
| SyncConflictRaised | SyncConflict | Notification, Agent |
| SyncConflictResolved | SyncConflict | Sync Service (TodoPort / CalendarPort), Notification |
| SyncConflictIgnored | SyncConflict | Notification, Audit |
| ExternalTaskExtractionPending | Sync Service | Notification, Agent |
