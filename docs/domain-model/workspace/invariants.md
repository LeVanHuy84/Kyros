# Business Invariants — Workspace Bounded Context

---

## Validation Rules

### INV-WS-01 — Mandatory Primary Workspace

| Aspect | Detail |
| --- | --- |
| **Rule** | Every registered user must have exactly one primary workspace allocated at registration time. |
| **Enforcement** | `WorkspaceProvisioningPort` is called synchronously during user registration (after `UserRegistered`). `PrimaryWorkspaceMarker` is set to true on the provisioned workspace. |
| **Violation** | User exists without a primary workspace — system is in an inconsistent state. Registration orchestration must guarantee atomicity or compensate. |

---

### INV-WS-04 — Non-Empty Workspace Name

| Aspect | Detail |
| --- | --- |
| **Rule** | The workspace name (`WorkspaceName`) must be non-empty after trimming. |
| **Enforcement** | `WorkspaceName` value object rejects blank strings; validated on `provision()` and `rename()`. |
| **Violation** | Provisioning or rename with blank name rejected. |

---

## Consistency Rules

### INV-WS-05 — Access Isolation Constraint

| Aspect | Detail |
| --- | --- |
| **Rule** | No operation on data within a workspace may proceed unless the invoking user is the owner of that workspace. |
| **Enforcement** | `TenantValidationPort` is called at the application boundary of every cross-context operation that carries a `WorkspaceId`. The port loads the `Workspace` aggregate and verifies that `ownerId` matches the invoking `UserId`. |
| **Scope** | System-wide; enforced by all bounded contexts that use workspace-scoped data. |
| **Violation** | Cross-context request rejected with an authorization error. |

---

### INV-WS-06 — WorkspaceId Immutability

| Aspect | Detail |
| --- | --- |
| **Rule** | `WorkspaceId` is immutable for the lifetime of the workspace. It cannot be changed after provisioning. |
| **Enforcement** | `WorkspaceId` is set only in the `provision()` factory; no `setWorkspaceId()` method exists. |
| **Violation** | Architectural guardrail — no code path may alter a `WorkspaceId`. |

---

### INV-WS-07 — Archived Workspace is Read-Only

| Aspect | Detail |
| --- | --- |
| **Rule** | An Archived workspace must not accept any write operations (renames, data mutations in other contexts). |
| **Enforcement** | `archive()` is terminal; all mutable operations on the aggregate guard on `WorkspaceStatus != Archived`. Other contexts check workspace status via `TenantValidationPort` or workspace status events. |
| **Violation** | Mutation on an archived workspace is rejected. |

---

### INV-WS-08 — Suspended Workspace Blocks Data Mutations

| Aspect | Detail |
| --- | --- |
| **Rule** | A Suspended workspace must block all data mutations in other contexts (Todo, Calendar, Agent, etc.), but must still allow read-only access to support administrative review. |
| **Enforcement** | `TenantValidationPort` returns a suspended status; application layers in other contexts treat this as an authorization block for write operations. |
| **Violation** | Write operation on a suspended workspace is rejected. Read access is permitted per policy. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-WS-01 | Validation | Every user must have exactly one primary workspace |
| INV-WS-04 | Validation | Workspace name must be non-empty |
| INV-WS-05 | Consistency | Access requires workspace ownership |
| INV-WS-06 | Consistency | WorkspaceId is immutable after provisioning |
| INV-WS-07 | Consistency | Archived workspace is terminal — no writes |
| INV-WS-08 | Consistency | Suspended workspace blocks data mutations |
