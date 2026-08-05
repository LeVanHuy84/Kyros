# Domain Events — Memory Bounded Context

---

## ConversationStarted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Conversation` aggregate (via application layer) |
| **Trigger** | A new conversation is created in a workspace. |
| **Consumers** | `AI Agent` (attach to active session context) |
| **Business Meaning** | A new interactive chat thread has been opened. The agent can now append turns and ground its responses in the conversation history. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conversationId` | ConversationId | Unique identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Initiating user |
| `occurredAt` | Instant | Creation timestamp |

---

## ConversationTurnAppended

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Conversation` aggregate |
| **Trigger** | A new message turn (User or Agent) is appended to an active conversation. |
| **Consumers** | `AI Agent` (provide conversation context for next response), memory extraction service (post-MVP) |
| **Business Meaning** | The dialogue has advanced by one step. The agent uses the updated history to maintain coherent multi-turn context. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conversationId` | ConversationId | Parent conversation |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `turnId` | TurnId | New turn identifier |
| `senderRole` | SenderRole | User / Agent |
| `occurredAt` | TurnTimestamp | Turn timestamp |

---

## ConversationCleared

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Conversation` aggregate |
| **Trigger** | User requests clearing all turns from a conversation. |
| **Consumers** | `AI Agent` (invalidate cached context for this conversation) |
| **Business Meaning** | Conversation history purged on demand. The agent must treat the conversation as having no prior context. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conversationId` | ConversationId | Cleared conversation |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Clear timestamp |

---

## ConversationArchived

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Conversation` aggregate (via policy or user action) |
| **Trigger** | Conversation transitions to `Archived` state (read-only). |
| **Consumers** | `AI Agent` (stop appending to this conversation) |
| **Business Meaning** | The conversation is preserved for review but no longer accepts new turns. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `conversationId` | ConversationId | Archived conversation |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Archive timestamp |

---

## UserPreferencesInitialized

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserPreferences` aggregate (via application layer, triggered by `WorkspaceProvisioned`) |
| **Trigger** | Default preferences profile created for a new workspace/user. |
| **Consumers** | `Calendar` context (retrieve overlap preference), `Notification` context (retrieve channel preferences), `AI Agent` (ground planning defaults) |
| **Business Meaning** | A workspace has a known configuration baseline. All contexts that read preferences can now resolve defaults instead of failing on missing data. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `preferencesId` | PreferencesId | New preferences aggregate id |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Owner |
| `occurredAt` | Instant | Initialization timestamp |

---

## UserPreferencesUpdated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `UserPreferences` aggregate |
| **Trigger** | One or more preference fields are changed and saved. |
| **Consumers** | `Calendar` (re-read overlap preference on next operation), `Notification` (re-read channel preferences), `AI Agent` (refresh planning context) |
| **Business Meaning** | User configuration has changed. All downstream systems that cache or read preferences must treat the update as immediately effective for all subsequent operations. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `preferencesId` | PreferencesId | Updated preferences |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Owner |
| `changedFields` | string[] | Names of preference fields changed |
| `occurredAt` | Instant | Update timestamp |

---

## MemoryEntryCreated _(Post-MVP)_

| Attribute | Detail |
| --- | --- |
| **Publisher** | `MemoryEntry` aggregate (via extraction service) |
| **Trigger** | A semantic fact is extracted from conversation history and persisted. |
| **Consumers** | `AI Agent` (add fact to reasoning context), `Notification` (optional confirmation) |
| **Business Meaning** | A long-term user preference or fact has been captured. The agent can use it for future grounding without re-reading full conversation history. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `memoryId` | MemoryId | New memory entry |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `confidenceScore` | ConfidenceScore | Initial confidence (0.0–1.0) |
| `occurredAt` | Instant | Creation timestamp |

---

## MemoryEntryUpdated _(Post-MVP)_

| Attribute | Detail |
| --- | --- |
| **Publisher** | `MemoryEntry` aggregate |
| **Trigger** | User edits fact content or the confidence score is revised by the extraction process. |
| **Consumers** | `AI Agent` (refresh grounding context) |
| **Business Meaning** | A known fact has changed. The agent must use the updated version for future reasoning. |

---

## MemoryEntryDeleted _(Post-MVP)_

| Attribute | Detail |
| --- | --- |
| **Publisher** | `MemoryEntry` aggregate |
| **Trigger** | User explicitly deletes a stored fact (`Active → Deleted`). |
| **Consumers** | `AI Agent` (invalidate fact from context) |
| **Business Meaning** | User has revoked a fact. The agent must no longer reference it in responses. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `memoryId` | MemoryId | Deleted memory entry |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Deletion timestamp |

---

## MemoryUpdated _(composite)_

| Attribute | Detail |
| --- | --- |
| **Publisher** | Memory context application layer |
| **Trigger** | Any change to preferences or memory entries that requires downstream systems to refresh context. Serves as a consolidated signal. |
| **Consumers** | `AI Agent` reasoning loop |
| **Business Meaning** | The AI Agent's grounding context has changed. The agent should re-fetch relevant memory before the next planning step. |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| ConversationStarted | Conversation | Agent |
| ConversationTurnAppended | Conversation | Agent, Extraction Service |
| ConversationCleared | Conversation | Agent |
| ConversationArchived | Conversation | Agent |
| UserPreferencesInitialized | UserPreferences | Calendar, Notification, Agent |
| UserPreferencesUpdated | UserPreferences | Calendar, Notification, Agent |
| MemoryEntryCreated (post-MVP) | MemoryEntry | Agent |
| MemoryEntryUpdated (post-MVP) | MemoryEntry | Agent |
| MemoryEntryDeleted (post-MVP) | MemoryEntry | Agent |
| MemoryUpdated | Memory App Layer | Agent |
