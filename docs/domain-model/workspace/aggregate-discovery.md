# Aggregate Discovery — Workspace Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Workspace Bounded Context** (Workspace Tenancy) of the AI Executive Assistant.

---

## 1. Business Capabilities

The Workspace bounded context is responsible for the following business capabilities:

- **Workspace Provisioning & Management**: Setting up default workspaces during user registration, managing workspace metadata, and handling workspace archivals or suspensions.
- **Access Management**: Mapping workspaces to their owning users.
- **Tenancy Validation**: Exposing validation ports (`TenantValidationPort`) to verify that the active thread context has authorized access to the requested workspace.

---

## 2. Aggregate Candidates

To model the tenancy structure, the domain defines one primary Aggregate Candidate:

### Workspace Aggregate
- **Why it should be an Aggregate**:
  The Workspace represents the root security context. It has a distinct identity (`WorkspaceId`), complex states (Active, Suspended, Archived), and controls workspace access by associating it with a specific user. Validating workspace status and owner access must be transactionally atomic to prevent unauthorized data access.
- **Responsibilities**:
  - Encapsulates: Workspace ID, Name, Status, and ownerId.
  - Enforces invariant checks regarding ownership.
- **Consistency Boundary**:
  A single Workspace and its owner `UserId`.
- **Transaction Boundary**:
  Scoped to a single `WorkspaceId`.

---

## 3. Aggregate Relationships

The Workspace aggregate acts as the root boundary. There are no direct associations with aggregates in other contexts. Instead:

### Cross-Context References (Soft References)
- **Shared ID**: Other domains (Todo, Calendar, Notification, Memory, Agent) use `WorkspaceId` (a Shared Kernel Value Object) as a foreign reference to filter and isolate their data. These domains read `WorkspaceId` from the active security context but never import the `Workspace` aggregate or its schema directly.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Workspace context:

1. **Mandatory Primary Workspace**: Every user must have exactly one Primary Workspace allocated during registration.
2. **Access Isolation constraint**: No operation on data within a workspace can proceed unless the invoking user is the owner of that target workspace.

---

## 5. Domain Responsibilities

### What the Workspace Context Owns
- The database schema for workspaces.
- The business logic for provisioning default workspaces.
- Implementing the `TenantValidationPort` to intercept and authorize thread tenancy contexts.

### What the Workspace Context DOES NOT Own
- **User Authentication**: Validating login credentials and signing JWTs is owned by `Auth`.
- **Productivity data**: Storing task records or calendar event records is owned by `Todo` and `Calendar` respectively.
