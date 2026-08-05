# Entity Model — Memory Bounded Context

Three aggregates: **Conversation**, **UserPreferences**, **MemoryEntry** (post-MVP).

---

## Conversation Aggregate

### Aggregate Root: Conversation

#### Responsibilities

- Bounded chat thread in one **WorkspaceId**.
- Holds title, created/updated timestamps.
- Owns ordered **ConversationTurn** entities (append-only chronology).
- Enforces strictly increasing turn timestamps.
- Clears history (purge all turns) on user request.

#### Identity

- **ConversationId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Active** | Accepts new turns; history readable. |
| **Cleared** | All turns removed; conversation metadata may remain. |
| **Archived** | Optional terminal/read-only if introduced by policy. |

#### Public behaviors

- Append turn (**Sender**, content, timestamp).
- Update conversation title.
- Clear all turns.
- Read ordered turn sequence (domain query on loaded aggregate).

---

### Entity: ConversationTurn

#### Responsibilities

- One message step: sender role (User / Agent), content, timestamp.

#### Identity

- **TurnId** or monotonic sequence within **Conversation**.

#### Parent aggregate

- **Conversation**.

---

## User Preferences Aggregate

### Aggregate Root: UserPreferences

#### Responsibilities

- Single configuration profile per (**WorkspaceId**, **UserId**).
- Stores default timezone, default task priority, calendar overlap prevention flag, preferred notification channels, default reminder lead time.
- Validates preference bounds (IANA timezone, priority enum, channel lists).
- Applies updates atomically; changes effective immediately for subsequent operations system-wide.

#### Identity

- **PreferencesId** or composite (**WorkspaceId**, **UserId**) as aggregate identity.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Initialized** | Default profile for new workspace/user. |
| **Active** | Current settings; mutable. |

#### Public behaviors

- Replace or patch individual preference fields with validation.
- Reset to workspace defaults where supported.

---

## Memory Entry Aggregate (Post-MVP)

### Aggregate Root: MemoryEntry

#### Responsibilities

- Long-term semantic fact in a **WorkspaceId**.
- Stores fact content and **ConfidenceScore**.
- Updates confidence from verification interactions.
- User edit or delete of fact.
- Rejects storage of disallowed sensitive content per consent/screening rules (via domain service at creation).

#### Identity

- **MemoryId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Active** | Fact used for grounding. |
| **Deleted** | Removed (terminal). |

#### Public behaviors

- Revise content or confidence.
- Delete entry.

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | Conversation | ConversationId |
| Entity | ConversationTurn | TurnId (scoped to Conversation) |
| Aggregate root | UserPreferences | PreferencesId or (WorkspaceId, UserId) |
| Aggregate root | MemoryEntry | MemoryId |

No structural link between aggregates; extraction from **Conversation** to **MemoryEntry** is asynchronous via ports/events.
