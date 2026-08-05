# Value Object Model — Auth Bounded Context

---

## UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifier. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null; unique system-wide when persisted. |

---

## EmailAddress

| Aspect | Description |
| --- | --- |
| **Fields** | Normalized email string used as login identifier. |
| **Immutability** | Replace-on-change if email change is supported; otherwise immutable after registration. |
| **Validation** | Valid email format; uniqueness enforced at repository level across all **UserIdentity** aggregates. |

---

## PasswordHash

| Aspect | Description |
| --- | --- |
| **Fields** | Cryptographic hash and associated salt parameters (structure defined by hashing strategy, not persistence). |
| **Immutability** | Replace-on-change when password is rotated. |
| **Validation** | Non-null; must never store plaintext password in the domain model. |

---

## Password (transient)

| Aspect | Description |
| --- | --- |
| **Fields** | User-supplied password at registration or change time only. |
| **Immutability** | Ephemeral; not persisted on the aggregate. |
| **Validation** | Must satisfy **CredentialPolicy** before hashing. |

---

## CredentialPolicy

| Aspect | Description |
| --- | --- |
| **Fields** | Minimum length 8; requires uppercase, lowercase, digit, and special character. |
| **Immutability** | Domain constant or configuration snapshot. |
| **Validation** | Applied to **Password** before acceptance. |

---

## AccountStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **Active**, **Locked**, **Suspended**. |
| **Immutability** | Changes only through aggregate root methods. |
| **Validation** | Legal transitions enforced on the aggregate (e.g. **Locked** from failed attempts). |

---

## GlobalRole

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration: **EndUser**, **SystemOperator**. |
| **Immutability** | Set membership updated by add/remove on the aggregate’s role collection. |
| **Validation** | At least one role may be required by policy; values are context-specific IAM claims, not workspace roles. |

---

## FailedLoginCounter

| Aspect | Description |
| --- | --- |
| **Fields** | Non-negative integer count of consecutive failed attempts. |
| **Immutability** | Replace-on-change on each failed or successful login. |
| **Validation** | When count reaches **5**, aggregate must transition to **Locked** (**AccountStatus**). |

---

## JwtClaims (conceptual payload)

| Aspect | Description |
| --- | --- |
| **Fields** | **UserId**, optional workspace/session claims assembled at token issuance (not stored on **UserIdentity**). |
| **Immutability** | Immutable for the lifetime of one issued token. |
| **Validation** | **UserId** must reference an **Active** identity at issuance time. |

---

## SessionInvalidationToken

| Aspect | Description |
| --- | --- |
| **Fields** | Token identifier or signature reference subject to revocation (blacklist entry). |
| **Immutability** | Immutable record of a revoked token. |
| **Validation** | Non-null identifier; used by session invalidation process (may live outside the User Identity aggregate). |
