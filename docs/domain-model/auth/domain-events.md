# Domain Events — Auth Bounded Context

---

## UserRegistered

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via application layer) |
| **Trigger** | New account created with valid email and policy-compliant hashed password (`→ Active`). |
| **Consumers** | `Workspace` context (provision default workspace via `WorkspaceProvisioningPort`), `Notification` context (welcome alert) |
| **Business Meaning** | A new principal has joined the system. Workspace context must immediately provision a primary workspace so the user can operate on the platform. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Newly assigned identifier |
| `email` | EmailAddress | Normalized login email |
| `globalRoles` | GlobalRole[] | Initial roles (typically EndUser) |
| `occurredAt` | Instant | Registration timestamp |

---

## UserLoggedIn

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via authentication service) |
| **Trigger** | Credentials verified; failed-attempt counter reset; JWT session token issued. |
| **Consumers** | Audit log |
| **Business Meaning** | A valid session is established. Any partial lockout state is cleared. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Authenticated user |
| `occurredAt` | Instant | Login timestamp |

---

## LoginFailed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate |
| **Trigger** | Credential verification fails; failed-attempt counter incremented. |
| **Consumers** | Audit log, security monitoring |
| **Business Meaning** | An unsuccessful authentication attempt has been recorded. When the 5th consecutive failure occurs this event is immediately followed by `AccountLocked`. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Target account |
| `failureCount` | integer | Current consecutive failure count |
| `occurredAt` | Instant | Failure timestamp |

---

## AccountLocked

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate |
| **Trigger** | `FailedLoginCounter` reaches 5; account transitions to `Locked`. |
| **Consumers** | `Notification` context (security alert to registered email), audit log |
| **Business Meaning** | Brute-force protection engaged. User cannot authenticate until an admin or unlock policy resolves the lock. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Locked account |
| `email` | EmailAddress | For notification routing |
| `occurredAt` | Instant | Lock timestamp |

---

## AccountUnlocked

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via admin or automated unlock) |
| **Trigger** | Account transitions `Locked → Active`. |
| **Consumers** | `Notification` context (unlock confirmation), audit log |
| **Business Meaning** | Access is restored; failure counter is reset; user may authenticate again. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Unlocked account |
| `occurredAt` | Instant | Unlock timestamp |

---

## AccountSuspended

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via admin operation) |
| **Trigger** | Administrator transitions account to `Suspended`. |
| **Consumers** | `Workspace` context (restrict workspace operations), `Notification` context (suspension notice), audit log |
| **Business Meaning** | Account administratively disabled; all authentication attempts rejected. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Suspended account |
| `occurredAt` | Instant | Suspension timestamp |

---

## AccountReactivated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via admin operation) |
| **Trigger** | Account transitions `Suspended → Active`. |
| **Consumers** | `Notification` context (reactivation notice), audit log |
| **Business Meaning** | Full access restored after administrative suspension. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Reactivated account |
| `occurredAt` | Instant | Reactivation timestamp |

---

## PasswordChanged

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate |
| **Trigger** | User successfully rotates password with a policy-compliant credential. |
| **Consumers** | `Notification` context (security alert), session invalidation service |
| **Business Meaning** | Credentials rotated. Existing sessions should be invalidated to prevent use of potentially compromised tokens. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Account that changed password |
| `occurredAt` | Instant | Change timestamp |

---

## SessionInvalidated

| Attribute | Detail |
| --- | --- |
| **Publisher** | Session management service (application layer) |
| **Trigger** | User logs out or revocation triggered (password change, suspension). |
| **Consumers** | Token blacklist / revocation store, audit log |
| **Business Meaning** | Issued JWT is no longer valid. Any service validating tokens must treat it as revoked. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `userId` | UserId | Account owner |
| `tokenId` | SessionInvalidationToken | Revoked token reference |
| `occurredAt` | Instant | Invalidation timestamp |

---

## GlobalRoleAssigned / GlobalRoleRevoked

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserIdentity` aggregate (via admin operation) |
| **Trigger** | A `GlobalRole` (EndUser / SystemOperator) is added to or removed from a user identity. |
| **Consumers** | Session invalidation service (for revoke), audit log |
| **Business Meaning** | System-level access scope changed. Future JWT claims reflect the new role set; active sessions may need re-issuance. |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| UserRegistered | UserIdentity | Workspace, Notification |
| UserLoggedIn | UserIdentity | Audit |
| LoginFailed | UserIdentity | Audit, Security |
| AccountLocked | UserIdentity | Notification, Audit |
| AccountUnlocked | UserIdentity | Notification, Audit |
| AccountSuspended | UserIdentity | Workspace, Notification, Audit |
| AccountReactivated | UserIdentity | Notification, Audit |
| PasswordChanged | UserIdentity | Notification, Session Invalidation |
| SessionInvalidated | Session Service | Token Blacklist, Audit |
| GlobalRoleAssigned | UserIdentity | Audit |
| GlobalRoleRevoked | UserIdentity | Session Invalidation, Audit |
