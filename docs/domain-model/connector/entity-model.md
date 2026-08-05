# Entity Model — Connector Bounded Context

Two aggregates: **Connection**, **SyncConflict**.

---

## Connection Aggregate

### Aggregate Root: Connection

#### Responsibilities

- Integration profile for one **ProviderType** in a **WorkspaceId**.
- Encapsulates sync mode (one-way / bidirectional), filter rules, connection status (**Active**, **Suspended**, **Unauthorized**, **Syncing**).
- Holds **CredentialVaultReference** (no plaintext secrets in aggregate).
- Records last successful sync, last failure, error message snapshot.
- Transitions status on auth loss, user suspend, sync start/end.

#### Identity

- **ConnectionId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Authorized** | Credentials valid; may sync. |
| **Active** | Ready for scheduled/triggered sync. |
| **Syncing** | Run in progress (optional transient status). |
| **Unauthorized** | Token invalid; sync blocked. |
| **Suspended** | User/admin disabled. |

#### Public behaviors

- Configure sync mode and filters.
- Mark sync started/completed/failed with timestamps and error text.
- Suspend, reactivate, mark unauthorized.
- Update credential vault reference after re-auth.

---

## Sync Conflict Aggregate

### Aggregate Root: SyncConflict

#### Responsibilities

- Long-lived conflict when local and remote copies diverge on same logical resource.
- References **ConnectionId**, entity type (**Task**, **Event**), local and remote entity ids, snapshot payloads (both sides).
- Status: **Pending**, **Resolved**, **Ignored**.
- Applies resolution strategy: local wins, remote wins, or merged representation (triggers port calls to Todo/Calendar, not direct DB writes).

#### Identity

- **ConflictId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Pending** | Awaiting user decision. |
| **Resolved** | Merge decision applied via ports. |
| **Ignored** | User declined to merge; auto-sync remains suspended for record per policy. |

#### Public behaviors

- Create conflict with snapshots.
- Resolve with chosen strategy.
- Ignore conflict.

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | Connection | ConnectionId |
| Aggregate root | SyncConflict | ConflictId |

Sync **job runs** are orchestration processes (application/domain services), not separate aggregate roots unless extended later.
