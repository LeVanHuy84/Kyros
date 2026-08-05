# ADR-0006: Memory-Agent Decoupling and RAG Grounding Policies

## Status
Approved

## Context
Personalization and grounding are critical to the AI Executive Assistant's performance. The system utilizes conversation history, user preferences, and documents to personalize the assistant. However, this creates architectural risks:
1. **Circular Dependencies**: If the Memory context depends on the AI Agent's models (e.g. for fact extraction) and the Agent depends on Memory for context, it creates a package dependency cycle.
2. **Boundary Drift**: Mixing documents (Notes/Knowledge) and conversation histories/preferences (Memory) into a single module pollutes schemas and limits scalability.
3. **Hallucinations**: Without strict grounding rules, the agent could make up facts when answering user queries about their documents.

## Decision
We enforce strict boundary separation and safety policies for RAG and Memory:

1. **Cycle Prevention**: The Memory context has **no dependency** on the AI Agent context. It never imports agent models. The Agent drives memory interactions by calling inbound ports (`ConversationHistoryPort`, `MemoryStorePort`) or by publishing domain events.
2. **Notes Boundaries**: Notes (Knowledge Base) is a reserved, separate context, deferred as an inactive placeholder until Notes CRUD requirements are approved. It is not merged into Memory.
3. **RAG Grounding Policy**: For RAG search, all responses must be strictly grounded in active workspace documents with mandatory source citations.
4. **Hallucination Safeguard**: If no workspace documents support the answer to a query, the agent must state "I do not know" instead of fabricating information.

## Evidence
- [architecture.md:L125-L129 (Grounding policies)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L125-L129)
- [architecture.md:L234-L235 (AD-007)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L234-L235)
- [architecture-v2.md:L48-L54 (ISS-02 - Notes owned by two boundaries)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L48-L54)
- [architecture-v2.md:L55-L60 (ISS-03 - Memory dependency cycle)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L55-L60)
- [architecture-v2.md:L121-L122 (Notes and Memory recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L121-L122)
- [architecture-v2.md:L142-L143 (AD-007)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L142-L143)
- [architecture-v2.md:L149-L150 (AD-013, AD-014)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L149-L150)
- [context-map.md:L380-L382 (Memory Cycle Prevention)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L380-L382)
- [context-map.md:L447-L450 (Notes and Memory Boundary Resolution)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L447-L450)
- [requirements/user-stories-v2.md:L353-L373 (AI-004 - Grounding requirement)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L353-L373)

## Alternatives
- **Merge Notes and Memory**: Rejected. While simpler in the short term, documents have different lifecycle, storage, and indexing profiles than conversation streams, and merging them creates a messy domain model.
- **Permissive LLM Generation**: Rejected. Letting the LLM generate answers from its pre-trained weights without grounding documentation violates security and correctness constraints.

## Consequences
### Positive
- **High Cohesion**: Clean package separation; Memory and Notes can scale or be extracted separately.
- **Traceability**: All grounded answers contain clickable markdown source document citations.
- **Safety**: Hallucinations are minimized, ensuring the assistant is trustworthy.

### Negative
- **Grounding Limitations**: The agent will decline to answer basic user queries if they cannot be mapped to a stored note or chat history.
- **Complex UI**: The frontend must support citation rendering and document source links.

## Implementation Notes
- Memory exposes `ConversationHistoryPort` (to append/retrieve turns) and `MemoryStorePort` (to save preferences).
- RAG and long-term semantic memory (pgvector/Qdrant) are post-MVP features. Implement basic session memory for MVP.
- Verify through ArchUnit that `com.assistant.memory` has zero compile-time references to `com.assistant.agent`.
