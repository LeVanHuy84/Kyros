# Memory Bounded Context Database Design

This document details the logical database design for the **Memory** Bounded Context.

---

## 1. Context Overview

### Purpose
The Memory context retains user session conversation turns, default workspace and user-level preferences (lead times, timezones, overlap boundaries), and long-term semantic facts extracted for agent guidance.

### Aggregate Ownership
- **Conversation** (Aggregate Root): Represents an ordered chat stream within a workspace.
- **UserPreferences** (Aggregate Root): Stores configurations and personalization defaults for a user in a workspace.
- **MemoryEntry** (Aggregate Root - Post-MVP): Stores extracted long-term semantic knowledge facts.

### Persistence Responsibility
The Memory context stores conversational context and preferences. It exposes endpoints to read message history and provides configurations to guide AI Agent actions and constraints.

---

## 2. Entity → Table Mapping

| Bounded Context Aggregate / Entity / VO | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **Conversation** (Aggregate Root) | `memory.conversations` | Table |
| `ConversationId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `UserId` (Value Object) | `user_id` (UUID) | Logical Reference Column |
| `SessionId` (Value Object, Optional) | `session_id` (UUID) | Logical Reference Column |
| `ConversationTitle` (Value Object) | `title` (VARCHAR) | Column |
| `ConversationStatus` (Value Object) | `status` (VARCHAR) | Column |
| `LastTurnTimestamp` | `last_turn_timestamp` (TIMESTAMPTZ) | Column |
| **ConversationTurn** (Entity) | `memory.conversation_turns` | Table |
| `TurnId` | `id` (UUID) | Primary Key Column |
| `SenderRole` (Value Object) | `sender_role` (VARCHAR) | Column |
| `MessageContent` (Value Object) | `content` (TEXT) | Column |
| `TurnTimestamp` (Value Object) | `turn_timestamp` (TIMESTAMPTZ) | Column |
| **UserPreferences** (Aggregate Root) | `memory.user_preferences` | Table |
| `PreferencesId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `UserId` (Value Object) | `user_id` (UUID) | Logical Reference Column |
| `DefaultTimezone` (Value Object) | `timezone` (VARCHAR) | Column |
| `DefaultTaskPriority` (Value Object) | `default_task_priority` (VARCHAR) | Column |
| `CalendarOverlapPreference` (Value Object) | `prevent_calendar_overlap` (BOOLEAN) | Column |
| `NotificationChannelPreference` | `preferred_notification_channels` | Column (Comma-separated VARCHAR) |
| `DefaultReminderLeadTime` (Value Object) | `default_reminder_lead_time_minutes` (INTEGER) | Column |
| **MemoryEntry** (Aggregate Root - Post-MVP) | `memory.memory_entries` | Table |
| `MemoryId` | `id` (UUID) | Primary key column |
| `UserId` (Value Object) | `user_id` (UUID) | Logical Reference Column |
| `FactContent` | `content` (TEXT) | Column |
| `ConfidenceScore` | `confidence_score` (REAL) | Column |

---

## 3. Table Definitions

### Table: `memory.conversations`

#### Purpose
Stores user-agent chat sessions.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to tenant workspace. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id` (conversation owner). |
| `session_id` | `UUID` | `NULLABLE` | `NULL` | *None* | Optional logical ref to `agent.sessions.id` linking a chat thread to an agent run. |
| `title` | `VARCHAR(150)` | `NULLABLE` | `NULL` | *None* | Display name of the chat log. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Active'` | `CHECK (status IN ('Active', 'Cleared', 'Archived'))` | Conversation lifecycle state. |
| `last_turn_timestamp` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant of the most recent turn; updated on append, powers retention and list sorting. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Session creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Session last active timestamp. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `memory.conversation_turns`

#### Purpose
Tracks ordered dialog steps within a conversation session.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key identifier. |
| `conversation_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `memory.conversations(id) ON DELETE CASCADE` | Physical link to parent session. |
| `sender_role` | `VARCHAR(50)` | `NOT NULL` | *None* | `CHECK (sender_role IN ('User', 'Agent'))` | Identity role of message sender. |
| `content` | `TEXT` | `NOT NULL` | *None* | `CHECK (length(trim(content)) > 0)` | Text content of the turn. |
| `turn_timestamp` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Instant the turn occurred. |

---

### Table: `memory.user_preferences`

#### Purpose
Maintains default timezone and configuration overrides for each user membership.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global preferences identity. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to workspace context. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id`. |
| `timezone` | `VARCHAR(100)` | `NOT NULL` | `'UTC'` | *None* | User timezone setting (IANA zone name). |
| `default_task_priority` | `VARCHAR(50)` | `NOT NULL` | `'Medium'` | `CHECK (default_task_priority IN ('High', 'Medium', 'Low'))` | Priority set on new tasks by default. |
| `prevent_calendar_overlap` | `BOOLEAN` | `NOT NULL` | `FALSE` | *None* | Flag enforcing schedule isolation. |
| `preferred_notification_channels`| `VARCHAR(255)`| `NOT NULL` | `'InApp,Email'` | *None* | Comma-separated preferred routes. |
| `default_reminder_lead_time_minutes` | `INTEGER` | `NOT NULL` | `15` | `CHECK (default_reminder_lead_time_minutes > 0)` | Default alert lead window in minutes (maps to API `leadTimeMinutes`). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `memory.memory_entries` (Post-MVP)

#### Purpose
Stores extracted semantic details and facts.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key fact identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Tenant separation. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id` (fact owner). |
| `content` | `TEXT` | `NOT NULL` | *None* | *None* | Text detail of fact. |
| `confidence_score` | `REAL` | `NOT NULL` | `1.0` | `CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)` | System confidence rating. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

## 4. Relationships

- **Composition**: `memory.conversations` owns `memory.conversation_turns` with physical cascading deletes (`ON DELETE CASCADE`).
- **Reference by ID**:
  - `workspace_id` points logically to `workspace.workspaces.id`.
  - `user_id` in `memory.user_preferences`, `memory.conversations`, and `memory.memory_entries` points logically to `auth.user_identities.id`.
- **Thread linkage**: `memory.conversations.session_id` optionally points logically to `agent.sessions.id` when the conversation belongs to an agent run.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_conversations` | `id` | B-Tree (Implicit) | Primary key. |
| `pk_conversation_turns` | `id` | B-Tree (Implicit) | Primary key. |
| `pk_user_preferences` | `id` | B-Tree (Implicit) | Primary key. |
| `idx_turns_chronological` | `conversation_id`, `turn_timestamp` | B-Tree (Composite) | **Critical** index to load conversation log in chronological order. |
| `idx_conversations_workspace` | `workspace_id`, `last_turn_timestamp` | B-Tree (Composite) | Optimizes per-workspace conversation list sorted by recency. |
| `uq_preferences_workspace_user` | `workspace_id`, `user_id` | B-Tree (Composite UQ) | Enforces and optimizes lookup of a user's single preference profile in a workspace. |
| `idx_memory_entries_workspace` | `workspace_id`, `user_id` | B-Tree (Composite) | Optimizes retrieval of semantic facts for a workspace/user. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Load Recent History**: `SELECT * FROM memory.conversation_turns WHERE conversation_id = :convId ORDER BY turn_timestamp ASC LIMIT 20`. Optimized by composite index `idx_turns_chronological`.
- **Fetch Profile Preferences**: `SELECT * FROM memory.user_preferences WHERE workspace_id = :wsId AND user_id = :userId`. Optimized by unique index `uq_preferences_workspace_user`.
- **List Conversations**: `SELECT * FROM memory.conversations WHERE workspace_id = :wsId ORDER BY last_turn_timestamp DESC`. Optimized by composite index `idx_conversations_workspace`.

### Expected Write Patterns
- **Append Turn**: Inserts turn record and bumps `conversations.last_turn_timestamp` in the same transaction. Done frequently during active agent discussions. Optimized by targeting single parent ID.

---

## 7. Integrity Rules

- **Uniqueness**: A user must have exactly one user preferences record per workspace, enforced via `uq_preferences_workspace_user`.
- **Sequence order**: Turn timestamp constraints require new entries to be saved in forward chronological order.

---

## 8. Persistence Notes

- **Optimistic Locking**: Tracked on `conversations`, `user_preferences`, and `memory_entries` via `version` columns.
- **Screening**: Fact content must pass sensitive data screening (PII filter, context check) in application code before being saved to `memory_entries`.

---

## 9. Future Evolution

- **pgvector Integration**: In the post-MVP grounding phase, a column `embedding vector(1536)` (using `pgvector`) will be added to `memory.memory_entries` to allow semantic search queries. An HNSW vector index will be defined concurrently.
- **History Archiving**: Conversation turns older than 3 months will be partitioned or archived to cold storage to preserve list performance.
