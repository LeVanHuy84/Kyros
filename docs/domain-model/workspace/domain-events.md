# Domain Events — Workspace Bounded Context

---

## WorkspaceProvisioned

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate (via `WorkspaceProvisioningPort` application service) |
| **Trigger** | New workspace created with initial `Owner` membership; triggered by `UserRegistered` from Auth context. |
| **Consumers** | `Memory` (initialize default `UserPreferences`), `Notification` (optional welcome), audit log |
| **Business Meaning** | A new tenancy boundary is live. Memory must bootstrap default preferences; all other contexts may now accept data scoped to this `WorkspaceId`. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | New workspace identifier |
| `ownerId` | UserId | Founding owner |
| `primaryWorkspace` | boolean | True — MVP single-user workspace |
| `occurredAt` | Instant | Provisioning timestamp |

---

## WorkspaceRenamed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate |
| **Trigger** | Workspace name updated to a non-empty value. |
| **Consumers** | Audit log, UI read model |
| **Business Meaning** | Display metadata change only; tenancy rules unaffected. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Target workspace |
| `newName` | WorkspaceName | Updated name |
| `occurredAt` | Instant | Change timestamp |

---

## WorkspaceSuspended

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate (via admin operation) |
| **Trigger** | Workspace transitions `Active → Suspended`. |
| **Consumers** | `Todo` (block writes), `Calendar` (block writes), `Agent` (block new sessions), `Notification` (suspension notice to owner) |
| **Business Meaning** | Access restricted. All contexts gated on `TenantValidationPort` begin rejecting mutations. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Suspended workspace |
| `occurredAt` | Instant | Suspension timestamp |

---

## WorkspaceReactivated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate (via admin operation) |
| **Trigger** | Workspace transitions `Suspended → Active`. |
| **Consumers** | All previously restricted contexts, `Notification` (reactivation notice) |
| **Business Meaning** | Full access restored. Contexts may resume normal operations. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Reactivated workspace |
| `occurredAt` | Instant | Reactivation timestamp |

---

## WorkspaceArchived

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate |
| **Trigger** | Workspace transitions to `Archived` (terminal / read-only). |
| **Consumers** | All contexts (block writes), `Connector` (suspend all sync jobs), `Agent` (terminate active sessions), audit log |
| **Business Meaning** | Workspace permanently decommissioned or read-only. No further data mutations permitted. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Archived workspace |
| `occurredAt` | Instant | Archival timestamp |

---

## MemberAdded

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate |
| **Trigger** | A user is added with an assigned `WorkspaceRole`. |
| **Consumers** | `Notification` (welcome member alert), audit log |
| **Business Meaning** | New principal authorized to access workspace data. `TenantValidationPort` will pass for this user. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Workspace |
| `userId` | UserId | Newly added member |
| `role` | WorkspaceRole | Owner / Member |
| `joinedAt` | JoinedAt | Membership timestamp |

---

## MemberRoleChanged

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate |
| **Trigger** | A member's `WorkspaceRole` is changed (Owner ↔ Member). |
| **Consumers** | Audit log |
| **Business Meaning** | Access scope within the workspace changed. Role-sensitive operations permitted or restricted accordingly. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Workspace |
| `userId` | UserId | Affected member |
| `previousRole` | WorkspaceRole | Old role |
| `newRole` | WorkspaceRole | New role |
| `occurredAt` | Instant | Change timestamp |

---

## MemberRemoved

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Workspace` aggregate |
| **Trigger** | Membership removed; Owner obligation invariant satisfied by remaining members. |
| **Consumers** | `Notification` (optional removal notice), audit log |
| **Business Meaning** | User no longer authorized. `TenantValidationPort` will reject access for this user. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Workspace |
| `userId` | UserId | Removed member |
| `occurredAt` | Instant | Removal timestamp |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| WorkspaceProvisioned | Workspace | Memory, Notification, Audit |
| WorkspaceRenamed | Workspace | Audit |
| WorkspaceSuspended | Workspace | Todo, Calendar, Agent, Notification |
| WorkspaceReactivated | Workspace | All restricted contexts, Notification |
| WorkspaceArchived | Workspace | All contexts, Connector, Agent, Audit |
| MemberAdded | Workspace | Notification, Audit |
| MemberRoleChanged | Workspace | Audit |
| MemberRemoved | Workspace | Notification, Audit |
