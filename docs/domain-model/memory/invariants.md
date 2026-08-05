# Business Invariants — Memory Bounded Context

---

## Validation Rules

### INV-MEM-01 — Workspace Tenancy Scope

| Aspect | Detail |
| --- | --- |
| **Rule** | Conversation history, preferences, and memory entries must strictly belong to a single `WorkspaceId`. Cross-workspace reads or writes are prohibited. |
| **Enforcement** | `WorkspaceId` is immutable on each aggregate after creation; application layer validates scope on every load and save. |
| **Violation** | Cross-workspace access rejected at application boundary. |

---

### INV-MEM-02 — Chronological Messaging

| Aspect | Detail |
| --- | --- |
| **Rule** | Message turns in a `Conversation` must be appended in strictly increasing chronological order (`TurnTimestamp` of each new turn must be greater than the previous turn's timestamp). |
| **Enforcement** | `appendTurn()` validates that the supplied `TurnTimestamp` is strictly after the last recorded turn's timestamp on the aggregate. |
| **Violation** | Turn append rejected; conversation history remains intact. |

---

### INV-MEM-03 — Preference Bounds Validation

| Aspect | Detail |
| --- | --- |
| **Rule** | Preference values must be within valid, defined ranges: `DefaultTimezone` must be a valid IANA identifier; `DefaultTaskPriority` must be one of `High`, `Medium`, `Low`; `DefaultReminderLeadTime` must be a positive duration within allowed bounds; `NotificationChannelPreference` must be a subset of supported channels. |
| **Enforcement** | Each preference value object validates on construction; `update()` on the aggregate rejects any field failing validation. |
| **Violation** | Update with invalid preference value rejected; unchanged fields unaffected. |

---

### INV-MEM-04 — Confidence Score Range

| Aspect | Detail |
| --- | --- |
| **Rule** | A `MemoryEntry`'s `ConfidenceScore` must be a floating-point value in the inclusive range `[0.0, 1.0]`. |
| **Enforcement** | `ConfidenceScore` value object validates bounds on construction; rejected on `create()` and `revise()` if out of range. |
| **Violation** | Operation rejected; memory entry not created or updated. |

---

### INV-MEM-05 — Sensitive Data Screening

| Aspect | Detail |
| --- | --- |
| **Rule** | The `FactContent` of a `MemoryEntry` must be screened for sensitive personal data (credentials, passwords, financial information) before persistence. Content flagged as sensitive must not be stored without explicit user consent. |
| **Enforcement** | A domain service evaluates `FactContent` against screening rules and returns a `SensitiveDataScreeningResult`. If the result is `Rejected`, `create()` is blocked. |
| **Violation** | `MemoryEntry` creation blocked; `MemoryEntryCreated` not published. |

---

### INV-MEM-06 — Non-Empty Fact Content

| Aspect | Detail |
| --- | --- |
| **Rule** | `FactContent` on a `MemoryEntry` must be non-empty after trimming. |
| **Enforcement** | `FactContent` value object rejects blank strings; enforced on `create()` and `revise()`. |
| **Violation** | Operation rejected. |

---

## Consistency Rules

### INV-MEM-07 — One Preferences Aggregate per Workspace/User

| Aspect | Detail |
| --- | --- |
| **Rule** | There must be exactly one `UserPreferences` aggregate per `(WorkspaceId, UserId)` pair. |
| **Enforcement** | `initialize()` is idempotent at the application layer; if a preferences aggregate already exists for the pair, initialization is skipped. Infrastructure enforces uniqueness on `(WorkspaceId, UserId)`. |
| **Violation** | Duplicate preferences aggregates would produce conflicting settings for the same user/workspace. |

---

### INV-MEM-08 — Immediate Preference Effect

| Aspect | Detail |
| --- | --- |
| **Rule** | Changes to `UserPreferences` must take effect immediately for all subsequent system operations. There is no deferred or batched application of preference updates. |
| **Enforcement** | `UserPreferencesUpdated` is published immediately on `update()`. Consumers (Calendar, Notification, Agent) read preferences at operation time; they must not cache stale preferences beyond the current request. |
| **Violation** | An operation that uses a stale preference after an update has been committed violates this invariant. |

---

### INV-MEM-09 — Conversation Turns are Immutable Once Appended

| Aspect | Detail |
| --- | --- |
| **Rule** | A `ConversationTurn` cannot be edited or deleted after it has been appended. Only the full `clear()` operation can remove all turns. |
| **Enforcement** | No `editTurn()` or `deleteTurn()` operations exist on the aggregate. `ConversationTurn` entity has no mutable fields after creation. |
| **Violation** | Architectural guardrail — turn immutability ensures a trustworthy dialogue history. |

---

### INV-MEM-10 — Archived Conversation is Read-Only

| Aspect | Detail |
| --- | --- |
| **Rule** | An `Archived` conversation must not accept new turns or be cleared. |
| **Enforcement** | `appendTurn()` and `clear()` guard on `status != Archived`. |
| **Violation** | Mutation on archived conversation rejected. |

---

### INV-MEM-11 — Preferences Initialized Before First Use

| Aspect | Detail |
| --- | --- |
| **Rule** | `UserPreferences` must be initialized with default values when a workspace is provisioned. Contexts that read preferences must never encounter a missing preferences aggregate for an active workspace. |
| **Enforcement** | `UserPreferencesInitialized` event is published by the Memory context in response to `WorkspaceProvisioned`. Application layer guarantees preferences exist before any read operation. |
| **Violation** | A context attempting to read preferences for an uninitialized workspace is a provisioning defect. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-MEM-01 | Validation | All memory data scoped to one WorkspaceId |
| INV-MEM-02 | Validation | Conversation turns must be strictly chronological |
| INV-MEM-03 | Validation | Preference values must be within defined valid ranges |
| INV-MEM-04 | Validation | ConfidenceScore must be in [0.0, 1.0] |
| INV-MEM-05 | Validation | FactContent must pass sensitive-data screening |
| INV-MEM-06 | Validation | FactContent must be non-empty |
| INV-MEM-07 | Consistency | Exactly one UserPreferences per (WorkspaceId, UserId) |
| INV-MEM-08 | Consistency | Preference changes take effect immediately |
| INV-MEM-09 | Consistency | ConversationTurns are immutable once appended |
| INV-MEM-10 | Consistency | Archived conversation is read-only |
| INV-MEM-11 | Consistency | Preferences initialized before first use on workspace provisioning |
