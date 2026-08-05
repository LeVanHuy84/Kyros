# Ubiquitous Language — Memory Bounded Context

This document defines the core business terms and concepts within the **Memory Bounded Context** (Context & Memory) of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. Conversation
- **Definition**: A continuous, multi-turn chat interaction thread between a User and the AI Agent.
- **Synonyms**: Chat Session, Interaction Thread.
- **Context-Specific Meaning**: Conversations are bounded strictly by Workspace. They record the context and exchange of messages to enable multi-turn continuity.

### 2. Conversation Turn
- **Definition**: A single, discrete message exchange step within a Conversation.
- **Synonyms**: Message, Chat Turn.
- **Context-Specific Meaning**: Each turn holds the sender's identity (User or AI Agent), message content, and a creation timestamp.

### 3. Conversation History
- **Definition**: The ordered sequence of all Conversation Turns within a given Conversation or Workspace.
- **Synonyms**: Chat Log, Session Context.
- **Context-Specific Meaning**: History is retrieved by the AI Agent to maintain context and is managed (can be cleared) by the user.

### 4. User Preference
- **Definition**: A persistent configuration setting that defines a user's working style and system behavior rules within a Workspace.
- **Synonyms**: User Setting, Workspace Preference.
- **Context-Specific Meaning**: Includes configurations such as default timezone, default reminder lead time, default task priority, preferred notification channels, and the calendar overlap prevention flag.

### 5. Memory Entry
- **Definition**: A long-term fact or preference extracted from conversation history that represents semantic knowledge about the user.
- **Synonyms**: Fact, Semantic Memory.
- **Context-Specific Meaning**: Stored as independent entries, each possessing a confidence score. They are used to ground AI planning and responses across multiple sessions.

### 6. Confidence Score
- **Definition**: A numerical valuation representing the system's confidence in the reliability and accuracy of an extracted Memory Entry.
- **Synonyms**: Accuracy Score, Reliability Metric.
- **Context-Specific Meaning**: Expressed as a floating-point number between `0.0` (unreliable) and `1.0` (fully verified).

### 7. Fact Extraction
- **Definition**: The analytical process of scanning conversation history to discover and record long-term user facts and settings.
- **Synonyms**: Semantic Ingestion, Memory Extraction.
- **Context-Specific Meaning**: An asynchronous cognitive operation that creates or updates Memory Entries while screening for and omitting sensitive information.

### 8. Clearing History
- **Definition**: The user-initiated action of deleting all conversation logs.
- **Synonyms**: Wipe Conversation, Clear Logs.
- **Context-Specific Meaning**: Performs a purge of all message turns associated with a conversation or workspace, resetting the immediate context window for the AI.
