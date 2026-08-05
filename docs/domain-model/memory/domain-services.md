# Domain Services — Memory Bounded Context

---

## SensitiveFactScreeningService

### Purpose

Enforce privacy/consent invariant before persisting **MemoryEntry** content.

### Why not inside MemoryEntry

Screening rules may evolve (pattern lists, consent flags) and be shared with async extraction pipelines that do not yet have a fully formed aggregate. Central service keeps **MemoryEntry** focused on fact lifecycle.

### Responsibilities

- Evaluate **FactContent** (and optional context) → **SensitiveDataScreeningResult**.
- Block creation when **Rejected**.

---

## DefaultPreferencesProvisioningService

### Purpose

Initialize **UserPreferences** when a workspace is provisioned.

### Why not inside UserPreferences alone

Triggered from workspace lifecycle outside Memory; must align defaults with workspace setup in one coordinated operation.

### Responsibilities

- Use **UserPreferencesFactory** with sensible defaults (timezone, Medium priority, overlap flag, channels, lead time).
- Persist via **UserPreferencesRepository**.

---

## ConversationTurnOrderingPolicy

Optional thin domain helper (or method on **Conversation**) — append validation is on the aggregate; no separate service required unless extraction batch reads many conversations (then read-only query stays on repository).

---

## FactExtractionOrchestration (not a domain service in Memory)

Fact extraction is owned by **AI Agent** / background processes calling **MemoryStorePort**; Memory context only persists **MemoryEntry** results after screening.

---

## Factories

### ConversationFactory

Create **Conversation** with **ConversationId**, **WorkspaceId**, initial title.

### UserPreferencesFactory

Create default **UserPreferences** profile for (**WorkspaceId**, **UserId**).

### MemoryEntryFactory

Create **MemoryEntry** after screening passes, with initial **ConfidenceScore**.

**Not responsible for**

- Running LLM extraction.
- Updating **UserPreferences** from chat (Agent orchestration).
