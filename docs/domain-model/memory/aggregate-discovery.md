# Aggregate Discovery — Memory Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Memory Bounded Context** (Context & Memory) of the AI Executive Assistant.

---

## 1. Business Capabilities

The Memory bounded context is responsible for the following business capabilities:

- **Conversation History Management**: Storing and retrieving multi-turn dialogue between the user and the AI Agent. Allowing users to view, search, and wipe their active conversation logs.
- **User Preferences Storage**: Persistently storing configuration settings (notification preferences, default lead times, timezone, calendar overlap rules), initializing new workspaces with sensible defaults, and exposing settings for updates.
- **Long-Term Semantic Memory**: Extracting user facts and long-term preferences from conversations, assigning confidence scores, storing them persistently, and retrieving/deleting them (post-MVP).

---

## 2. Aggregate Candidates

To model these capabilities without violating boundaries or creating database contention, the domain is partitioned into three Aggregate Candidates:

### 1. Conversation Aggregate
- **Why it should be an Aggregate**:
  A Conversation represents a single interactive chat stream. It has a distinct identity (`ConversationId`) and maintains a chronological log of message turns. The state of the conversation and the collection of turns must remain consistent.
- **Responsibilities**:
  - Encapsulates conversation details: Conversation ID, Title, Workspace ID, Created Time, and Updated Time.
  - Manages the ordered list of message turns (Sender, Content, Timestamp).
  - Enforces invariant rules (e.g. chronological ordering of turns).
  - Performs the clearing action (purging turns).
- **Consistency Boundary**:
  A single `Conversation` instance and all of its appended turns.
- **Transaction Boundary**:
  Scoped to a single `ConversationId` inside a specific `WorkspaceId`. Appending a turn to one chat session does not affect other chat sessions.

### 2. User Preferences Aggregate
- **Why it should be an Aggregate**:
  This represents the active configuration profile of a user inside a workspace. Preferences are highly cohesive: changes to settings (such as notification channels, timezone, default priorities) must be validated together and saved atomically.
- **Responsibilities**:
  - Stores all workspace settings: Default Timezone, Default Task Priority, Calendar Overlap Prevention flag, Preferred Notification Channels, and Default Reminder Lead Time.
  - Validates value ranges (e.g. valid IANA timezone format).
  - Provides default profiles for new workspaces.
- **Consistency Boundary**:
  The entire configuration profile of a user/workspace.
- **Transaction Boundary**:
  Scoped to the `WorkspaceId` and `UserId`. There is exactly one User Preferences aggregate active per user workspace.

### 3. Memory Entry Aggregate (Post-MVP)
- **Why it should be an Aggregate**:
  A Memory Entry represents an independent, extracted semantic fact or rule about the user. Because memory entries are created, updated, verified, or deleted individually by the user, they do not belong to a single conversation's transaction boundary. Each fact has its own lifecycle.
- **Responsibilities**:
  - Stores the fact content, confidence score (0.0 to 1.0), and Workspace ID.
  - Manages confidence level updates based on new interactions.
  - Allows explicit user editing or deletion.
- **Consistency Boundary**:
  A single semantic `MemoryEntry` instance.
- **Transaction Boundary**:
  Scoped to a single `MemoryId` within a specific `WorkspaceId`.

---

## 3. Aggregate Relationships

The aggregates within the Memory Bounded Context are highly decoupled:

### Conversation $\rightarrow$ Memory Entry (Decoupled extraction)
- **Relationship Type**: Zero-to-Many ($0..*$) source relationship.
- **Design Pattern**: **Asynchronous/Decoupled via Events or Ports**.
- **Reasoning**: Memory entries are derived from analyzing conversation history. However, to avoid database locks and performance degradation on chat operations, the extraction process is separated. The AI Agent or a background process reads conversation turns, performs NLP analysis, and calls `MemoryStorePort` to write memory entries in separate transactions.

### Memory Entry $\rightarrow$ User Preferences (Decoupled updates)
- **Relationship Type**: Zero-to-One ($0..1$) influence relationship.
- **Design Pattern**: **Decoupled update**.
- **Reasoning**: If a user updates their preference during a chat (e.g. "always prioritize my team meetings"), the AI Agent extracts this fact and updates the `User Preferences` aggregate directly. There is no structural database connection between the memory entries and the preference settings.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Memory context:

1. **Workspace Tenancy Scope**: Conversation history, preferences, and memory entries must strictly belong to a single `WorkspaceId`. Cross-workspace reads or writes are strictly prohibited.
2. **Chronological Messaging**: Message turns in a conversation must be appended in strictly increasing chronological order.
3. **Preference Bounds Validation**: Preference settings must fall within valid, defined ranges (e.g., default priority must be one of High/Medium/Low; timezone must be a valid IANA database value).
4. **Confidence Score range**: A memory entry's confidence score must be a floating-point value between `0.0` and `1.0` (inclusive).
5. **Privacy and Consent screening**: Fact extraction logic must screen for and prevent the storage of sensitive personal data (e.g., credentials, passwords, financial info) without explicit user consent.
6. **Immediate Update Effect**: Changes to User Preferences must take effect immediately for all subsequent system actions and planning steps.

---

## 5. Domain Responsibilities

### What the Memory Context Owns
- Database models for conversation logs, user preferences, and semantic facts.
- Managing chat session retrieval, archiving, and deletion.
- Persistent configuration profiles for users/workspaces.
- Managing confidence scores and lifecycle of long-term facts.
- Publishing `MemoryUpdated` domain events to alert downstream systems (such as the AI Agent reasoning loop) of context modifications.

### What the Memory Context DOES NOT Own
- **User Authentication**: Managed by the `Auth` context.
- **Workspace lifecycle / membership**: Managed by the `Workspace` context.
- **Goal planning and natural language reasoning**: Managed by the `AI Agent` context. The Agent queries the memory ports to ground its plans, but does not persist the data itself.
- **Notification routing execution**: Managed by the `Notification` context (which reads preference data to dispatch alerts but does not store settings).
- **External syncing**: Managed by the `Connector` context.
- **Task/Event models**: Managed by `Todo` and `Calendar` respectively.
