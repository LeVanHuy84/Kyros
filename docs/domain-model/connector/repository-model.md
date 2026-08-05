# Repository Model — Connector Bounded Context

---

## ConnectionRepository

**Aggregate root**: Connection

### Responsibilities

- Load **Connection** by **ConnectionId** and **WorkspaceId**.
- Persist configuration and status changes.
- List connections for workspace (by **ProviderType**, status).
- Find connections due for scheduled sync (query responsibility; scheduling not persistence design).

---

## SyncConflictRepository

**Aggregate root**: SyncConflict

### Responsibilities

- Load **SyncConflict** by **ConflictId** and **WorkspaceId**.
- Persist create, resolve, ignore.
- List pending conflicts for **ConnectionId** or workspace.
- Existence check for open conflict on local entity id (block auto-sync for that record).

---

### Out of scope

- Writing Todo/Calendar tables directly (forbidden; ports only).
- Storing plaintext credentials (**CredentialVaultPort**).
- User approval UI (**AI Agent**).

### Contract expectations

- All operations scoped to **WorkspaceId**.
- Conflict records reference **ConnectionId** by id only.
