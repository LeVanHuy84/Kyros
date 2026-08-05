# Entity Model — Workspace Bounded Context

Single aggregate: **Workspace**.

---

## Workspace Aggregate

### Aggregate Root: Workspace

#### Responsibilities

- Root security and data-isolation boundary for tenancy.
- Encapsulates workspace name, status, and ownerId.
- Validates that requests are authorized by the owner.
- Transitions workspace status (**Active**, **Suspended**, **Archived**).
- Rejects data operations when workspace is not active (per rules).

#### Identity

- **WorkspaceId** (system-wide unique).

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Provisioned** | Workspace created with initial owner. |
| **Active** | Tenancy valid; ownership enforced. |
| **Suspended** | Access restricted per policy. |
| **Archived** | Terminal or read-only archival state per domain rules. |

#### Public behaviors

- Rename workspace metadata.
- Suspend, reactivate, or archive workspace.
- Query whether a **UserId** matches the ownerId (for **TenantValidationPort** consumers).

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | Workspace | WorkspaceId |
