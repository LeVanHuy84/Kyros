# Repository Model — Memory Bounded Context

One repository per aggregate root.

---

## ConversationRepository

**Aggregate root**: Conversation

### Responsibilities

- Load **Conversation** by **ConversationId** and **WorkspaceId** with ordered **ConversationTurn** entities.
- Persist append turn, title update, and clear-history operations atomically per aggregate.
- List conversations in workspace (search/filter by title or date).

---

## UserPreferencesRepository

**Aggregate root**: UserPreferences

### Responsibilities

- Load preferences by (**WorkspaceId**, **UserId**); at most one profile per pair.
- Persist full profile after atomic validation.
- Create default profile on workspace provisioning.

---

## MemoryEntryRepository

**Aggregate root**: MemoryEntry (post-MVP)

### Responsibilities

- Load by **MemoryId** and **WorkspaceId**.
- Persist create, update confidence/content, delete.
- Query entries by workspace for agent grounding (semantic retrieval is application/infrastructure; repository supplies domain loads).

---

### Out of scope (all repositories)

- NLP/fact extraction execution (**AI Agent** / async workers).
- Notification routing (**Notification**).
- Cross-workspace reads.

### Contract expectations

- All queries scoped by **WorkspaceId**.
- **Conversation** saves preserve chronological invariant on turns.
