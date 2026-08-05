# Repository Model — Auth Bounded Context

One repository per aggregate root: **UserIdentityRepository**.

---

## UserIdentityRepository

**Aggregate root**: UserIdentity

### Responsibilities

- Load **UserIdentity** by **UserId**.
- Load **UserIdentity** by **EmailAddress** for login and uniqueness checks.
- Persist new or updated **UserIdentity** after in-memory invariants (policy, lockout, roles) are satisfied.
- Existence check for email uniqueness before registration (without exposing other users’ data).
- Support removal or archival of identities only when domain rules allow (if applicable).

### Out of scope

- Storing JWT signing keys, token blacklists implementation details, or gateway verification logic.
- Workspace provisioning (**Workspace** context).
- Tenancy validation on productivity data.

### Contract expectations

- Email uniqueness queries are scoped to the Auth context only.
- Repository never returns credential hashes to presentation layers without going through domain authentication behavior.
