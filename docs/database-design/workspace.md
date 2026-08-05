# Workspace Bounded Context Database Design

This document details the logical database design for the **Workspace** Bounded Context.

---

## 1. Context Overview

### Purpose
The Workspace context establishes tenant boundaries, memberships, and user access permissions per workspace. Every resource in the system belongs to a workspace tenant.

### Aggregate Ownership
- **Workspace** (Aggregate Root): Encapsulates workspace status, name, and owner identity.
- **Membership** (Entity within Workspace boundary): Tracks user membership permissions inside a workspace.

### Persistence Responsibility
The Workspace context owns the schemas for workspaces, user memberships, and tenancy settings. Downstream contexts synchronously call `TenantValidationPort` to verify memberships.

---

## 2. Entity → Table Mapping

| Bounded Context Entity / Value Object | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **Workspace** (Aggregate Root) | `workspace.workspaces` | Table |
| `WorkspaceId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceName` (Value Object) | `name` (VARCHAR) | Column |
| `WorkspaceStatus` (Value Object) | `status` (VARCHAR) | Column |
| `ownerId` (UserId Value Object) | `owner_id` (UUID) | Logical Reference Column |
| **Membership** (Entity) | `workspace.memberships` | Table |
| `MembershipId` | `id` (UUID) | Primary Key Column |
| `role` | `role` (VARCHAR) | Column |
| `isPrimary` (Value Object) | `is_primary` (BOOLEAN) | Column |

---

## 3. Table Definitions

### Table: `workspace.workspaces`

#### Purpose
Stores primary workspace accounts and tenancy details.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier for the tenant. |
| `name` | `VARCHAR(100)` | `NOT NULL` | *None* | `CHECK (length(trim(name)) > 0)` | Workspace display name. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Active'` | `CHECK (status IN ('Active', 'Suspended', 'Archived'))` | Tenancy state. |
| `owner_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit update timestamp. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Concurrency version indicator. |

---

### Table: `workspace.memberships`

#### Purpose
Maps user identities to workspaces and dictates workspace-level user roles.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `workspace.workspaces(id) ON DELETE CASCADE` | Physical parent relationship. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id`. |
| `role` | `VARCHAR(50)` | `NOT NULL` | `'Member'` | `CHECK (role IN ('Owner', 'Admin', 'Member'))` | User's capability role in workspace. |
| `is_primary` | `BOOLEAN` | `NOT NULL` | `FALSE` | *None* | Marks the user's primary workspace. Exactly one per user is enforced by the application service. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit update timestamp. |

---

## 4. Relationships

- **Composition (Parent-Child)**: `workspace.workspaces` owns `workspace.memberships` through a physical SQL foreign key relationship.
- **Reference by ID (Cross-Context)**:
  - `owner_id` and `user_id` hold logical references to `auth.user_identities.id`.
  - No database-level cascading exists between Auth identities and Workspace records; cleanup is event-driven.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_workspaces` | `id` | B-Tree (Implicit PK) | Primary key lookup. |
| `pk_memberships` | `id` | B-Tree (Implicit PK) | Primary key lookup. |
| `idx_workspaces_owner` | `owner_id` | B-Tree | Optimizes queries showing workspaces owned by a user. |
| `idx_memberships_user` | `user_id` | B-Tree | Critical index for resolving a user's active workspaces list. |
| `uq_memberships_workspace_user` | `workspace_id`, `user_id` | B-Tree (Composite UQ) | Prevents duplicate user memberships in the same workspace. |
| `idx_memberships_user_primary` | `user_id` WHERE `is_primary = TRUE` | B-Tree (Partial) | Optimizes `GET /workspaces/primary` resolution for a user. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Verify Tenant Membership**: Check if `user_id` belongs to `workspace_id` and get role. Executed on almost every API call at the gateway. Optimized by the composite unique index `uq_memberships_workspace_user`.
- **List Workspace Members**: Retrieve membership detail for a workspace. Optimized by `uq_memberships_workspace_user` (prefix column matches `workspace_id`).

### Expected Write Patterns
- **Provision Default Workspace**: Inserting a workspace and default owner membership during registration. Run inside a single workspace transaction.

---

## 7. Integrity Rules

- **Owner Rule**: Every workspace must have exactly one owner. The owner's membership is initialized when the workspace is provisioned.
- **Cascade Deletion**: Deleting a workspace physically deletes all memberships via database cascade constraints (`ON DELETE CASCADE`).

---

## 8. Persistence Notes

- **Optimistic Locking**: Handled on `workspace.workspaces` via `version` column.
- **Soft Delete**: Not applied here. Workspaces transition status to `Archived` to disable access without deleting records immediately.

---

## 9. Future Evolution

- **Granular RBAC**: Expansion to granular workspace permissions will map to a new table `workspace.permissions (id, membership_id, permission_name)` inside this schema.
- **Partitioning**: Workspaces are the logical partition key for all other contexts; however, the `workspace` schema itself remains central and is not a candidate for database partitioning.
