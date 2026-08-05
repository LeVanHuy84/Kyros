# Aggregate Discovery — Auth Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Auth Bounded Context** (IAM/Authentication) of the AI Executive Assistant.

---

## 1. Business Capabilities

The Auth bounded context is responsible for the following business capabilities:

- **User Registration & Credential Verification**: Registering new user accounts, enforcing password complexity policies, salting/hashing passwords, and verifying credentials during login.
- **Session Management**: Generating JSON Web Tokens (JWT) upon successful login, verifying token signatures, and invalidating tokens during logout.
- **Global Access Role Management**: Managing system-level access roles (End User, System Operator).

---

## 2. Aggregate Candidates

To model identity and access control, the domain defines one primary Aggregate Candidate:

### User Identity Aggregate
- **Why it should be an Aggregate**:
  The User Identity represents a registered user account. It holds the credentials, security metadata (failed login counters, lock status), and global role claims. Enforcing email uniqueness, validating passwords, and handling account lockouts must be transactionally isolated per user account.
- **Responsibilities**:
  - Encapsulates: User ID, Email (unique), Password Hash, Status (Active, Locked, Suspended), and Global Roles.
  - Enforces credential policies (password complexity rules) during creation/updates.
  - Matches login credentials against stored password hashes.
  - Manages account lock status (e.g. locks account after consecutive failed attempts).
- **Consistency Boundary**:
  A single `User Identity` and its credential metadata.
- **Transaction Boundary**:
  Scoped to a single `UserId`.

---

## 3. Aggregate Relationships

The User Identity aggregate is decoupled from other domains, using application-level orchestration or events for cross-context flows:

### User Identity $\rightarrow$ Workspace (Application Seam)
- **Relationship Type**: Outbound creation call.
- **Design Pattern**: **Application Orchestration**.
- **Reasoning**: During user registration, the Auth application service registers the new `User Identity` and then invokes the Workspace context's `WorkspaceProvisioningPort` to create a default workspace. This avoids compile-time circular imports and transaction locking between Auth and Workspace aggregates.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Auth context:

1. **Email Uniqueness**: The registration email address must be unique across all User Identities in the system.
2. **Credential Policy Enforcement**: Password strings must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character.
3. **Pre-Authentication Enclosure**: No domain operations in other bounded contexts can proceed unless a valid JWT signature has been verified.
4. **Brute Force Lockout**: Accounts must be locked automatically after 5 consecutive failed login attempts to prevent brute-force attacks.

---

## 5. Domain Responsibilities

### What the Auth Context Owns
- Database models for user account credentials and global roles.
- Enforcing password validation and computing cryptographic hashes/salts.
- Creating JWT session tokens and validating token signatures.
- Invalidating sessions (blacklisting tokens/revoking refresh tokens).

### What the Auth Context DOES NOT Own
- **Workspace lifecycle & tenancy verification**: Managed by `Workspace` (Workspace Tenancy owns workspace CRUD, memberships, and role verification).
- **Productivity & Agent security context checking**: Individual domain contexts read the `WorkspaceId` from the thread context to validate data access, not the Auth context.
