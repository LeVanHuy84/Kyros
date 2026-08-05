# Business Invariants — Connector Bounded Context

---

## Validation Rules

### INV-CON-01 — Strict Seam Isolation (No Direct DB Writing)

| Aspect | Detail |
| --- | --- |
| **Rule** | The Connector context must never write or update database tables owned by other contexts (e.g., `todos`, `calendar_events`). All sync actions must route through public domain ports (`TodoPort`, `CalendarPort`). |
| **Enforcement** | The sync orchestration service only calls registered port interfaces; it has no compile-time dependency on other contexts' repositories or ORM entities. |
| **Violation** | Any direct write to another context's tables is an architectural defect. |

---

### INV-CON-02 — Credential Encryption Enclosure

| Aspect | Detail |
| --- | --- |
| **Rule** | Plaintext integration credentials (OAuth tokens, API keys, passwords) must never be stored in the Connector's own database. They must be saved in the Vault via `CredentialVaultPort`. Only the opaque `CredentialVaultReference` key is stored on the `Connection` aggregate. |
| **Enforcement** | `register()` and `reauthorize()` accept a `CredentialVaultReference`; no method on the aggregate accepts a plaintext secret. The vault call is made before the aggregate command. |
| **Violation** | Storing a plaintext credential on the aggregate or in the connector schema is a security defect. |

---

### INV-CON-03 — Workspace Tenancy Isolation

| Aspect | Detail |
| --- | --- |
| **Rule** | All `Connection` and `SyncConflict` aggregates must strictly belong to a single `WorkspaceId`. Synchronizing data across workspace boundaries is prohibited. |
| **Enforcement** | `WorkspaceId` is immutable on each aggregate after creation; application layer validates workspace scope on every operation. |
| **Violation** | Cross-workspace sync operation rejected. |

---

### INV-CON-04 — Data Sanitization Before Port Application

| Aspect | Detail |
| --- | --- |
| **Rule** | All data imported from external sources must be validated and sanitized into a `SanitizedExternalPayload` before calling `TodoPort` or `CalendarPort`. Tasks must have non-empty titles; priority must be one of `High`, `Medium`, `Low`; calendar time ranges must be valid. |
| **Enforcement** | ACL (Anti-Corruption Layer) mapping service produces `SanitizedExternalPayload` VO; sanitization validates and transforms the external payload. Port calls are only made with sanitized payloads. |
| **Violation** | Unsanitized data passed to a port is rejected by the target context's aggregate invariants, causing sync failure. |

---

### INV-CON-05 — Conflict Interception on Concurrent Modification

| Aspect | Detail |
| --- | --- |
| **Rule** | If concurrent modifications are detected on a synchronized record (both local and remote changed since last sync), automatic sync for that record must be suspended and a `SyncConflict` aggregate must be created immediately. |
| **Enforcement** | Sync orchestration service compares local and remote snapshots. On divergence, `SyncConflict.create()` is called and the conflicting record is excluded from the current sync run. |
| **Violation** | Automatically overwriting a local change with a remote change (or vice versa) without user approval is a data loss defect. |

---

### INV-CON-06 — External Task Extraction Requires User Approval

| Aspect | Detail |
| --- | --- |
| **Rule** | External task creation from incoming email processing must not execute automatically. It must be held in a pending state and require explicit user approval before `TodoPort.createTask()` is called. |
| **Enforcement** | Sync orchestration service emits `ExternalTaskExtractionPending` and does not call `TodoPort` until the user approves. A separate approval flow resolves the pending item. |
| **Violation** | Auto-creating tasks from external emails without approval violates user control and may generate unwanted items. |

---

### INV-CON-07 — ProviderType is Immutable on Connection

| Aspect | Detail |
| --- | --- |
| **Rule** | The `ProviderType` on a `Connection` is fixed at registration and cannot be changed. A new connection must be registered for a different provider. |
| **Enforcement** | `ProviderType` is set only in `register()`; no `changeProviderType()` method exists on the aggregate. |
| **Violation** | Changing a provider type mid-connection would invalidate all sync history and vault references. |

---

## Consistency Rules

### INV-CON-08 — Sync Blocked on Unauthorized / Suspended Connections

| Aspect | Detail |
| --- | --- |
| **Rule** | Sync runs must not start when `ConnectionStatus` is `Unauthorized` or `Suspended`. |
| **Enforcement** | `markSyncStarted()` guards on `status = Active`. The sync scheduler checks connection status before initiating a run. |
| **Violation** | Starting a sync with invalid credentials would produce repeated failures and API rate limit consumption. |

---

### INV-CON-09 — No Duplicate Active Conflict for Same Record

| Aspect | Detail |
| --- | --- |
| **Rule** | Only one `Pending` `SyncConflict` may exist at a time for the same `(connectionId, localEntityId)` combination. |
| **Enforcement** | `SyncConflict.create()` is guarded by a repository check for an existing `Pending` conflict on the same record. Duplicate creation is rejected. |
| **Violation** | Multiple unresolved conflicts for the same record would produce ambiguous resolution outcomes. |

---

### INV-CON-10 — Resolved / Ignored SyncConflict is Terminal

| Aspect | Detail |
| --- | --- |
| **Rule** | A `SyncConflict` in `Resolved` or `Ignored` status cannot be re-resolved or changed. |
| **Enforcement** | `resolve()` and `ignore()` guard on `status = Pending`. Terminal statuses have no mutation methods. |
| **Violation** | Re-resolving a settled conflict is rejected. |

---

### INV-CON-11 — SyncErrorMessage Must Not Contain Secrets

| Aspect | Detail |
| --- | --- |
| **Rule** | The `SyncErrorMessage` stored on the aggregate and emitted in `ConnectorSyncFailed` must not contain credentials, tokens, or other sensitive values. |
| **Enforcement** | Sync orchestration service sanitizes error messages before passing them to `markSyncFailed()`. |
| **Violation** | Exposing secrets in error messages or events is a security defect. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-CON-01 | Validation | Never write directly to other contexts' tables — use ports |
| INV-CON-02 | Validation | No plaintext credentials in connector storage — vault only |
| INV-CON-03 | Validation | All connections/conflicts scoped to one WorkspaceId |
| INV-CON-04 | Validation | External data must be sanitized before port calls |
| INV-CON-05 | Validation | Concurrent modifications must raise SyncConflict and suspend record sync |
| INV-CON-06 | Validation | Email-extracted tasks require explicit user approval before creation |
| INV-CON-07 | Validation | ProviderType is immutable after registration |
| INV-CON-08 | Consistency | Sync blocked when connection is Unauthorized or Suspended |
| INV-CON-09 | Consistency | Only one Pending conflict per (connection, local entity) |
| INV-CON-10 | Consistency | Resolved/Ignored SyncConflict is terminal |
| INV-CON-11 | Consistency | Error messages must not contain secrets |
