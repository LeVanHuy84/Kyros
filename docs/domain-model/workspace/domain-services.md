# Domain Services — Workspace Bounded Context

---

## WorkspaceProvisioningService

### Purpose

Create a default **Primary Workspace** for a newly registered **UserId**.

### Why not inside Workspace aggregate alone

Registration is orchestrated from **Auth** without compile-time coupling. Provisioning must create a new aggregate for the user in one business operation, often triggered by an application event after **UserIdentity** exists.

### Responsibilities

- Invoke **WorkspaceFactory** to create workspace with default name/settings.
- Set the **UserId** as the owner of the workspace.
- Persist via **WorkspaceRepository**.

### Dependencies

- **WorkspaceFactory**, **WorkspaceRepository**.

---

## TenantAccessValidationService

### Purpose

Answer whether an operation may proceed for a given **TenantContext**.

### Why not inside Workspace only as instance method

Callers across contexts need a stable domain seam (**TenantValidationPort**) without loading full aggregates on every read path; service coordinates repository owner queries and **WorkspaceStatus**.

### Responsibilities

- Verify **Workspace** is **Active** (or allowed state).
- Verify **UserId** is the owner of the workspace.
- Return allow/deny for port adapters.

---

## Factories

### WorkspaceFactory

**Used because** provisioning must generate **WorkspaceId**, default **WorkspaceName**, **WorkspaceStatus**, and ownerId in one valid graph.

**Responsibilities**

- Create **Workspace** aggregate with ownerId.

**Not responsible for**

- Auth registration or JWT claims.
