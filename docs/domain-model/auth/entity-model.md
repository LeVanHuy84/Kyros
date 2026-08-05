# Entity Model — Auth Bounded Context

This document defines aggregate roots and internal entities for the **Auth Bounded Context**. There is one aggregate: **User Identity**.

---

## User Identity Aggregate

### Aggregate Root: UserIdentity

#### Responsibilities

- Represents a registered user account and the consistency boundary for credentials and global access claims.
- Encapsulates email (unique login identifier), password hash and salt metadata, account status, and assigned **GlobalRole** values.
- Enforces **CredentialPolicy** on registration and password change.
- Verifies presented credentials against stored hash during authentication attempts.
- Tracks consecutive failed login attempts and transitions account to **Locked** when the lockout threshold is reached.
- Resets failed-attempt counters on successful authentication.
- Manages global roles (**End User**, **System Operator**); distinct from workspace roles in the Workspace context.
- Rejects authentication and credential mutations when status is **Locked** or **Suspended** (per allowed rules).

#### Identity

- Global identity: **UserId** (system-wide unique).

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Registered** | Account created with valid email and policy-compliant password hash. |
| **Active** | Account may authenticate and receive session tokens (issued outside aggregate by application/infrastructure). |
| **Locked** | Too many failed login attempts; authentication blocked until unlock policy applies. |
| **Suspended** | Administratively disabled; authentication blocked. |

#### Public behaviors

- Register with email and password (hashed before persistence via domain/infrastructure collaboration).
- Change password with policy validation.
- Record failed login attempt; lock when threshold (5 consecutive failures) is reached.
- Record successful login (reset failure counter, ensure **Active** where applicable).
- Unlock or suspend/reactivate (administrative transitions where business rules allow).
- Assign or revoke **GlobalRole** values on the identity.

---

### Internal entities

No child entities exist inside the **UserIdentity** aggregate. Credential metadata and lockout counters are value objects or embedded state on the root (see `value-object-model.md`).

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | UserIdentity | UserId |
