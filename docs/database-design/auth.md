# Auth Bounded Context Database Design

This document details the logical database design for the **Auth** Bounded Context.

---

## 1. Context Overview

### Purpose
The Auth context manages user identity registration, credential validation, account status, security lockout logic, and global roles.

### Aggregate Ownership
- **UserIdentity** (Aggregate Root): Encapsulates user identity credentials and account status constraints.
- **SessionEvent** (Entity within UserIdentity boundary): Append-only audit record of session lifecycle events (logout, revocation, security invalidation). The **active deny-list itself lives in Redis**, not in this schema.

### Persistence Responsibility
The Auth context is the sole authority for writing and reading user login credentials and security states. No other context may access the `auth` schema directly.

---

## 2. Entity → Table Mapping

| Aggregate Root / Entity / Value Object | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **UserIdentity** (Aggregate Root) | `auth.user_identities` | Table |
| `UserId` (Value Object) | `id` (UUID) | Primary Key Column |
| `EmailAddress` (Value Object) | `email` (VARCHAR) | Column (Unique) |
| `PasswordHash` (Value Object) | `password_hash` (VARCHAR) | Column |
| `AccountStatus` (Value Object) | `status` (VARCHAR) | Column |
| `FailedLoginCounter` (Value Object) | `failed_login_attempts` (INTEGER) | Column |
| `GlobalRole` (Value Object Set) | `global_roles` (VARCHAR) | Comma-separated Column |
| **SessionEvent** (Entity) | `auth.session_events` | Table |

---

## 3. Table Definitions

### Table: `auth.user_identities`

#### Purpose
Stores registered user identities, password hashes, failed login counters, and administrative statuses.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier for the user identity. |
| `email` | `VARCHAR(255)` | `NOT NULL` | *None* | `UNIQUE`, `CHECK (length(trim(email)) > 0)` | User's normalized login email. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | *None* | *None* | Cryptographic hash and salt parameters (Bcrypt/Argon2). |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Active'` | `CHECK (status IN ('Active', 'Locked', 'Suspended'))` | Account lifecycle state. |
| `failed_login_attempts` | `INTEGER` | `NOT NULL` | `0` | `CHECK (failed_login_attempts >= 0)` | Counter of consecutive authentication failures. |
| `global_roles` | `VARCHAR(255)` | `NOT NULL` | `'EndUser'` | *None* | Comma-separated list of global system-level roles. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Timestamp when identity was registered. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Timestamp when identity was last modified. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Version field used for optimistic locking. |

---

### Table: `auth.session_events`

#### Purpose
Append-only **audit log** of session lifecycle events — logout (`POST /auth/logout`), password change, and account suspension. It is written alongside the Redis deny-list and is **never read on the request hot path**; it exists for compliance, forensics, and debugging.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `user_identity_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id`. |
| `jti` | `VARCHAR(64)` | `NULLABLE` | `NULL` | *None* | JWT identifier (claim `jti`) invalidated by the event, when applicable. |
| `event_type` | `VARCHAR(50)` | `NOT NULL` | *None* | `CHECK (event_type IN ('Logout', 'TokenRevoked', 'PasswordChanged', 'AccountSuspended'))` | Type of session lifecycle event. |
| `occurred_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Instant the event occurred. |
| `metadata` | `JSONB` | `NULLABLE` | `NULL` | *None* | Optional context (IP, user agent, reason) for forensics. |

#### Persistence Notes
- **Redis is the runtime source of truth** for the deny-list: on each revocation event the gateway writes key `revoked:jti` with `TTL = tokenExpiry - now`, so entries expire automatically and per-request checks are O(1) Redis lookups. Postgres is not involved in the per-request check.
- `auth.session_events` is an append-only audit trail; it is written in the same transaction as the domain action and is pruned/retained per compliance policy.
- This is an **event log, not a session store**; active-session listing remains a JWT concern.

---

## 4. Relationships

- **Composition**: `auth.user_identities` owns `auth.session_events` via a logical `user_identity_id` reference. No foreign key is declared (both tables live in the same schema; the constraint is optional but may be added intra-schema if desired).
- **Reference by ID**: Downstream tables in other schemas (such as `workspace.memberships` and `calendar.calendar_events`) refer to `auth.user_identities.id` via a logical `user_id` UUID column. No foreign keys cross context boundaries.
- **Infrastructure (non-relational)**: The active JWT deny-list is stored in Redis (key `revoked:jti`, TTL-scoped), not in this schema. `auth.session_events` only records that a revocation happened.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_user_identities` | `id` | B-Tree (Implicit PK) | Fast primary key lookup. |
| `uq_user_identities_email` | `email` | B-Tree (Implicit UQ) | Enforces unique emails and optimizes user login queries. |
| `pk_session_events` | `id` | B-Tree (Implicit PK) | Primary key lookup. |
| `idx_session_events_user` | `user_identity_id`, `occurred_at` | B-Tree (Composite) | Optimizes per-user audit history queries (forensics, compliance). |
| `idx_session_events_jti` | `jti` | B-Tree | Optimizes reverse lookup of a token's revocation history. |

> The per-request deny-list check is served by Redis (`revoked:jti`), so no Postgres index is required for hot-path lookups.

---

## 6. Query Optimization

### Expected Read Patterns
- **User Login**: Retrieve user by email. High volume, execution must be sub-millisecond. Satisfied by the unique index `uq_user_identities_email`.
- **Identity Check**: Retrieve status and roles by `id`. Very high volume, cached at the application gateway. Optimized by `pk_user_identities`.
- **Token Validity Check**: Not a Postgres query. The API gateway performs an O(1) Redis lookup (`revoked:jti`); only cache misses proceed to Postgres.
- **Audit History**: `SELECT * FROM auth.session_events WHERE user_identity_id = :userId ORDER BY occurred_at DESC LIMIT 100`. Optimized by `idx_session_events_user`. Low frequency, admin/compliance only.

### Expected Write Patterns
- **User Registration**: Insert new identity record (low frequency).
- **Record Failure**: Increment `failed_login_attempts` and toggle status to `Locked` if attempts >= 5. Optimized via primary key lookup.
- **Record Success**: Reset `failed_login_attempts` to 0. Optimized via primary key lookup.
- **Logout / Revocation**: Writes `revoked:jti` to Redis with TTL = remaining token lifetime and inserts a `session_events` audit row. The Redis write is on the hot path; the audit insert is fire-and-forget via a queue or the same application transaction.

---

## 7. Integrity Rules

### Business Constraints
- **Lockout Rule**: The application service enforces transition to `Locked` status when `failed_login_attempts` reaches `5`.
- **Email Validation**: Constraints block empty or whitespace-only emails.

### Referential Integrity
- Identity deletions are managed administratively. If an identity is deleted, the application publishes a `UserIdentityDeleted` event to clean up workspaces and data.

---

## 8. Persistence Notes

- **Optimistic Locking**: Handled via the `version` column.
- **Soft Delete**: Auth context does **not** support soft delete. Accounts are administratively suspended (`Suspended` status) or permanently hard-deleted.
- **Audit Columns**: `created_at` and `updated_at` track identity lifecycle changes.
- **Redis for the Deny-List**: The active token deny-list is an infrastructure concern and lives in Redis with per-key TTL (domain model: "marks token identifiers as revoked in infrastructure caches, e.g., Redis blacklist"). Enable Redis persistence (AOF) so a restart does not silently re-validate revoked tokens; the `session_events` audit log provides the recovery source.

---

## 9. Future Evolution

- **External Identity Provider Mapping**: If moving to external providers (OAuth2/OIDC), a mapping table `auth.external_providers (id, user_identity_id, provider_name, provider_user_id)` can be added cleanly in this schema.
- **Email Search**: The admin user list supports search by email pattern (`GET /admin/users?email=`). For prefix/contains matching at scale, enable the `pg_trgm` extension and add a GIN trigram index on `email` during the administration console hardening phase.
- **Partitioning**: Not a candidate for partitioning as user directories grow linearly and lookups are index-assisted. If `session_events` retention grows under compliance requirements, it is a candidate for range partitioning (e.g., by month) and archival, since it is append-only.
