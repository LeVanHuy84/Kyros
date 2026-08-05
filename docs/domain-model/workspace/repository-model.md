# Repository Model — Workspace Bounded Context

**WorkspaceRepository** — one per **Workspace** aggregate root.

---

## WorkspaceRepository

### Responsibilities

- Load **Workspace** by **WorkspaceId**.
- Persist **Workspace** after status or name changes atomically.
- Find workspace by **UserId** for primary workspace lookup (MVP single-tenant ownership).
- Check whether **UserId** is the owner of **WorkspaceId** (for tenant validation).
- List workspaces owned by a **UserId**.

### Out of scope

- JWT validation (**Auth**).
- Productivity entity storage (**Todo**, **Calendar**, etc.).
- Implementing HTTP/gateway thread context injection.

### Contract expectations

- Saves update the workspace metadata and status.
- Never expose workspace data across **WorkspaceId** boundaries.
