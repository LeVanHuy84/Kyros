# Business Invariants — Auth Bounded Context

---

## Validation Rules

### INV-AUTH-01 — Email Uniqueness

| Aspect | Detail |
| --- | --- |
| **Rule** | The registration `EmailAddress` must be unique across all `UserIdentity` aggregates in the system. |
| **Enforcement** | Checked at the application/repository boundary before `register()` is called on the aggregate. The aggregate itself requires a non-null, valid-format email; uniqueness is a system-wide constraint enforced by the infrastructure. |
| **Violation** | Registration rejected with a domain error; `UserRegistered` is not published. |

---

### INV-AUTH-02 — Credential Policy

| Aspect | Detail |
| --- | --- |
| **Rule** | Any password (at registration or password change) must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character. |
| **Enforcement** | `CredentialPolicy` value object validates `Password` inside `register()` and `changePassword()` before hashing. |
| **Violation** | Operation rejected; aggregate state unchanged; no event published. |

---

### INV-AUTH-03 — No Plaintext Password Storage

| Aspect | Detail |
| --- | --- |
| **Rule** | The domain aggregate must never persist a plaintext password. Only `PasswordHash` (hash + salt) is stored. |
| **Enforcement** | `Password` is a transient value object; hashing is performed before or during the aggregate factory/command; the password reference is not held on the aggregate. |
| **Violation** | Architectural guardrail — any code path that stores plaintext is a defect. |

---

### INV-AUTH-04 — Brute-Force Lockout Threshold

| Aspect | Detail |
| --- | --- |
| **Rule** | An account must be automatically locked after exactly 5 consecutive failed login attempts. |
| **Enforcement** | `FailedLoginCounter` is incremented on each call to `recordFailedLogin()`. When the counter reaches 5, the aggregate transitions `AccountStatus → Locked` in the same operation. |
| **Violation** | If the lock is not triggered at exactly 5 failures the invariant is broken; no further logins may be attempted until the counter is reset by `unlock()`. |

---

### INV-AUTH-05 — No Authentication on Non-Active Accounts

| Aspect | Detail |
| --- | --- |
| **Rule** | Authentication attempts must be rejected when `AccountStatus` is `Locked` or `Suspended`. Credential mutations (`changePassword`) must also be blocked on `Suspended` accounts. |
| **Enforcement** | Aggregate guards check `AccountStatus` at the start of `authenticate()` and `changePassword()` methods. |
| **Violation** | Operation rejected with appropriate domain error; no counter change; no JWT issued. |

---

## Consistency Rules

### INV-AUTH-06 — Pre-Authentication Gate (System-Wide)

| Aspect | Detail |
| --- | --- |
| **Rule** | No domain operations in other bounded contexts may proceed unless a valid JWT signature has been verified. |
| **Enforcement** | Cross-cutting infrastructure concern: API gateway or application middleware validates JWT before routing requests. The `UserIdentity` aggregate does not enforce this directly, but its `Active` status is a precondition for token issuance. |
| **Scope** | System-wide; all bounded contexts depend on this guarantee. |

---

### INV-AUTH-07 — Global Role Integrity

| Aspect | Detail |
| --- | --- |
| **Rule** | A user's `GlobalRole` set may contain `EndUser`, `SystemOperator`, or both; it must not be empty (at least `EndUser` required). |
| **Enforcement** | `assignGlobalRole` and `revokeGlobalRole` operations on the aggregate enforce that the set does not drop below the minimum required role. |
| **Violation** | Revocation that would leave the set empty is rejected. |

---

### INV-AUTH-08 — Counter Reset on Successful Login

| Aspect | Detail |
| --- | --- |
| **Rule** | The `FailedLoginCounter` must be reset to 0 on every successful authentication. Consecutive failure tracking restarts fresh after each successful login. |
| **Enforcement** | `recordSuccessfulLogin()` unconditionally resets `FailedLoginCounter` to 0. |
| **Violation** | If counter is not reset, a user who previously failed logins but then succeeded could be locked out prematurely on subsequent legitimate failures. |

---

### INV-AUTH-09 — Session Token Issued Only for Active Accounts

| Aspect | Detail |
| --- | --- |
| **Rule** | A JWT may only be issued when `AccountStatus` is `Active` at the moment of issuance. |
| **Enforcement** | Application/infrastructure layer checks aggregate status before generating a token. |
| **Violation** | Token issuance for a non-Active account is a security defect. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-AUTH-01 | Validation | Email must be unique system-wide |
| INV-AUTH-02 | Validation | Password must satisfy 8-char complexity policy |
| INV-AUTH-03 | Validation | Plaintext password must never be persisted |
| INV-AUTH-04 | Validation | Lock account after 5 consecutive failed logins |
| INV-AUTH-05 | Validation | Block auth and mutations on Locked/Suspended accounts |
| INV-AUTH-06 | Consistency | All cross-context operations require valid JWT |
| INV-AUTH-07 | Consistency | GlobalRole set must not be empty |
| INV-AUTH-08 | Consistency | Reset failure counter on successful login |
| INV-AUTH-09 | Consistency | JWT issued only for Active accounts |
