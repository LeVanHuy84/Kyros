# Value Object Model — Workspace Bounded Context

**WorkspaceId** is shared-kernel value used by other contexts; defined here for workspace domain completeness.

---

## WorkspaceId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifier. |
| **Immutability** | Immutable for workspace lifetime. |
| **Validation** | Non-null. |

---

## UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Reference to Auth **UserIdentity** (soft reference by ID only). |
| **Immutability** | Immutable on a **Workspace** once created. |
| **Validation** | Non-null; must reference existing user at provisioning time (verified at application boundary). |

---

## WorkspaceName

| Aspect | Description |
| --- | --- |
| **Fields** | Human-readable workspace label. |
| **Immutability** | Replace-on-change. |
| **Validation** | Non-empty after trim. |

---

## WorkspaceStatus

| Aspect | Description |
| --- | --- |
| **Fields** | **Active**, **Suspended**, **Archived**. |
| **Immutability** | Changed via aggregate methods only. |
| **Validation** | Legal transitions enforced on **Workspace**. |

---

## TenantContext

| Aspect | Description |
| --- | --- |
| **Fields** | **WorkspaceId**, **UserId**. |
| **Immutability** | Immutable per request/thread scope. |
| **Validation** | Must match the owner of the target **Workspace** (validated via domain/application seam). |

---

## PrimaryWorkspaceMarker

| Aspect | Description |
| --- | --- |
| **Fields** | Boolean or flag indicating user’s mandatory primary workspace (MVP: one per user). |
| **Immutability** | Set at provisioning. |
| **Validation** | Every user must have exactly one primary workspace allocated at registration. |
