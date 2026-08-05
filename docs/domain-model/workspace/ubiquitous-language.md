# Ubiquitous Language — Workspace Bounded Context

This document defines the core business terms and concepts within the **Workspace Bounded Context** (Workspace Tenancy) of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. Workspace
- **Definition**: The fundamental security and data isolation boundary in the application.
- **Synonyms**: Tenant Space, Tenancy Boundary, Tenant.
- **Context-Specific Meaning**: Every single user-created task, calendar event, conversation, note, and credential belongs strictly to one Workspace. Data cannot cross this boundary under any circumstance.

### 2. Workspace Tenancy
- **Definition**: The structural pattern of isolating data and operations on a per-workspace basis.
- **Synonyms**: Multi-Tenancy.
- **Context-Specific Meaning**: Checked at the API gateway and re-validated at every Port entry point to guarantee that no user can read or write data belonging to another workspace.

### 3. Primary Workspace
- **Definition**: The default workspace allocated to a user during account registration.
- **Synonyms**: Default Workspace.
- **Context-Specific Meaning**: New users are automatically bound to exactly one Primary Workspace during account creation.

### 4. Tenant Context
- **Definition**: The thread-local security context that propagates the active `WorkspaceId` throughout execution.
- **Synonyms**: Security context, Tenancy Context.
- **Context-Specific Meaning**: Captured from JWT session claims at the gateway and injected into the execution thread, allowing downstream services to enforce data isolation dynamically.

### 7. Provisioning
- **Definition**: The automatic system task that initializes and configures a workspace.
- **Synonyms**: Workspace Creation, Setup.
- **Context-Specific Meaning**: Triggered immediately during registration to configure a user's default workspace settings, folder structures, and profile.
