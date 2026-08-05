# Domain Services — Connector Bounded Context

---

## ModelTranslationService (ACL)

### Purpose

Convert provider payloads to **SanitizedExternalPayload** and reverse for outbound sync.

### Why not inside Connection

Translation is stateless per plugin type; **Connection** holds configuration, not mapping algorithms. Keeps Anti-Corruption Layer pluggable per **Connector Plugin**.

### Responsibilities

- Map external JSON/models to port commands and value objects.
- Map local port reads to outbound provider format.

---

## SyncOrchestrationService

### Purpose

Execute a sync run for a **Connection**: fetch, translate, call **TodoPort** / **CalendarPort**, record timestamps on **Connection**.

### Why not inside Connection

A run touches external APIs, rate limits, many records, and may spawn **SyncConflict** aggregates in separate transactions. Orchestration spans infrastructure timing and multiple aggregates.

### Responsibilities

- Drive sync steps; update **Connection** status and **SyncRunTimestamp**.
- On concurrent modification, create **SyncConflict** instead of silent merge.
- Enforce **RateLimitBackoff** between API calls.

---

## SyncConflictResolutionService

### Purpose

Apply **ConflictResolutionStrategy** by invoking appropriate ports with merged **SanitizedExternalPayload**.

### Why not inside SyncConflict alone

Resolution must coordinate port calls and follow-up sync; aggregate records decision and snapshots, service performs cross-context commands.

### Responsibilities

- Translate strategy + snapshots into port operations.
- Mark **SyncConflict** resolved after successful port application.

---

## ExternalTaskApprovalHoldService

### Purpose

Enforce CON-004: email-extracted tasks remain pending until user approval (**AI Agent** approval flow).

### Why not inside Connection

Approval is cross-context (Agent); Connector only holds pending import state or delegates to Agent port without owning approval aggregate.

### Responsibilities

- Block automatic **TodoPort** create until approval resolved.

---

## DataSanitizationService

### Purpose

Validate imported data against local invariants before port calls.

### Why not inside each aggregate in Todo/Calendar

Sanitization happens at the seam before foreign models enter bounded contexts; central service shared by all plugins.

### Responsibilities

- Reject invalid payloads; normalize priority, titles, time ranges.

---

## Factories

### ConnectionFactory

Create **Connection** with **ProviderType**, **SyncMode**, initial **CredentialVaultReference**, **Active** status.

### SyncConflictFactory

Create **SyncConflict** from detection context and **ConflictSnapshot** pair.

**Not responsible for**

- OAuth token exchange (infrastructure + vault).
- Plugin registration wiring (module composition).
