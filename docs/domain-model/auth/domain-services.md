# Domain Services — Auth Bounded Context

---

## PasswordHashingService

### Purpose

Transform a policy-valid **Password** into a **PasswordHash** using salting and one-way hashing.

### Why not inside UserIdentity

Hashing algorithm choice, work factors, and pepper/key access are infrastructure concerns. The aggregate enforces *whether* a password may be set; the service performs the cryptographic operation without embedding algorithm details in entity behavior.

### Responsibilities

- Hash password with generated salt.
- Verify password against stored **PasswordHash** during `UserIdentity` authentication.

---

## JwtIssuanceService

### Purpose

Create signed JWT access tokens after successful authentication.

### Why not inside UserIdentity

Token signing uses private keys, expirations, and claim assembly that span session infrastructure. **UserIdentity** owns account state; session tokens are ephemeral artifacts not part of the aggregate consistency boundary.

### Responsibilities

- Build **JwtClaims** from authenticated **UserId** and application-supplied workspace/session facts.
- Sign token with **JWT Session Signature** (Auth-owned key material at infrastructure layer).

---

## SessionInvalidationService

### Purpose

Terminate active sessions (logout) by revoking token identifiers.

### Why not inside UserIdentity

Revocation lists and refresh-token stores track many sessions per user over time. Coupling them inside **UserIdentity** would widen the transaction boundary beyond one account’s credential metadata.

### Responsibilities

- Record **SessionInvalidationToken** for presented token on logout.
- Support verification that a token is not revoked (collaboration with gateway).

---

## EmailUniquenessPolicy (optional domain service)

If registration orchestration needs explicit cross-aggregate check before factory creation, a thin service may coordinate **UserIdentityRepository.existsByEmail** — otherwise this remains a repository responsibility at registration time.

---

## Factories

### UserIdentityFactory

**Used because** registration combines **UserId** generation, email validation, initial **GlobalRole**, **AccountStatus**, and first **PasswordHash**.

**Responsibilities**

- Create new **UserIdentity** in **Active** (or initial) status with default **EndUser** role unless specified.
- Reject duplicate email via repository check before instantiation.

**Not responsible for**

- Default workspace creation (**Workspace** via application orchestration).
- Issuing JWT after save.
