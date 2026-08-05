# Aggregate Discovery — AI Agent Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **AI Agent Bounded Context** (Cognitive Orchestration) of the AI Executive Assistant.

---

## 1. Business Capabilities

The AI Agent bounded context is responsible for the following business capabilities:

- **Goal Decomposition & Planning**: Parsing natural language intents, breaking them down into sequenced, dependency-aware plans, and managing plan revisions.
- **Dynamic Tool Execution**: Registering and validating capabilities (Tools) in a secure registry, executing tools on behalf of the agent, and logging invocation details.
- **Human-in-the-Loop Validation**: Managing blocking approvals for plan execution and sensitive operations (like email-task creation), and resolving user decisions.
- **Self-Reflection & Recovery**: Evaluating execution outcomes, tracking retry loops, and executing re-planning or escalating failures.
- **Context Grounding (RAG)**: Formulating responses based strictly on retrieved files/context and generating citations.

---

## 2. Aggregate Candidates

To model the stateful cognitive process, the domain defines two Aggregate Candidates:

### 1. Agent Session Aggregate
- **Why it should be an Aggregate**:
  An Agent Session represents the lifecycle of a single goal-seeking execution. It tracks the original Goal, the current generated Plan, individual step statuses, reflection history, and the count of re-planning attempts. Keeping these attributes transactionally consistent is vital to prevent race conditions in autonomous execution loops.
- **Responsibilities**:
  - Encapsulates: Session ID, Goal text, Workspace ID, Current Status (Planning, Awaiting Approval, Executing, Succeeded, Failed, Escalated).
  - Manages the ordered list of Plan Steps and their execution states (Pending, Running, Succeeded, Failed).
  - Tracks and increments the re-planning counter.
  - Controls transition from Executing to Escalated if retry limits are hit.
- **Consistency Boundary**:
  A single `AgentSession` instance and its constituent Plan Steps.
- **Transaction Boundary**:
  Scoped to a single `AgentSessionId` within a specific `WorkspaceId`.

### 2. Approval Request Aggregate
- **Why it should be an Aggregate**:
  An Approval Request represents a formal, human-in-the-loop checkpoint before execution. Because user approvals are long-lived asynchronous processes (a user might take hours to approve), this state must not block database transactions on the main `Agent Session`. By decoupling the Approval Request as a separate aggregate, we can safely query, display, and resolve it without locking the session.
- **Responsibilities**:
  - Encapsulates: Approval ID, Workspace ID, Associated Session ID, Plan Snapshot (steps, descriptions), Status (Pending, Approved, Rejected), and Expiration Timestamp.
  - Handles the user resolution logic (verifying actor authorization and updating status).
  - Emits event notifications: `ApprovalRequested`, `ApprovalResolved`.
- **Consistency Boundary**:
  A single `ApprovalRequest` instance.
- **Transaction Boundary**:
  Scoped to a single `ApprovalId` within a specific `WorkspaceId`.

---

## 3. Aggregate Relationships

The aggregates within the AI Agent context are connected via asynchronous coordination:

### Agent Session $\leftrightarrow$ Approval Request (Soft Reference)
- **Relationship Type**: One-to-One ($1..1$) lifecycle link.
- **Design Pattern**: **Decoupled via ID Soft Reference and Domain Events**.
- **Reasoning**: The `Approval Request` aggregate soft-references `AgentSessionId`. When the planner generates a Plan, the `Agent Session` transitions to `Awaiting Approval` and triggers the creation of an `Approval Request` aggregate. The session transaction commits, freeing database resources. Later, when the user resolves the approval, the `Approval Request` aggregate updates its status and publishes `ApprovalResolved`. The Agent Session event listener intercepts this event, updates the session state, and triggers the Executor loop.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the AI Agent context:

1. **Mandatory User Confirmation**: No Plan Step can be executed by the Executor until the associated `Approval Request` status is resolved as `Approved`.
2. **Re-planning Ceiling**: The number of automatic re-planning attempts for a single Goal in an `Agent Session` must not exceed **3**. If a 4th re-planning attempt is triggered, the execution loop must halt and transition the session to `Escalated`.
3. **Execution Ordering**: Plan steps must be executed strictly according to their defined dependencies and sequential order.
4. **Workspace Tenant Boundary**: All sessions, plans, and approvals must belong to a single `WorkspaceId`. An agent session can only invoke tools on target entities belonging to its own workspace.
5. **Tool Registry Exclusivity**: The Executor must only invoke capabilities defined in the `Tool Registry`. Direct database modification or service calls bypassing the registry are prohibited.
6. **Strict Grounding Rule (RAG)**: Answers must be grounded in user documents. If no documents exist in context, the agent must state "I do not know".

---

## 5. Domain Responsibilities

### What the AI Agent Context Owns
- Orchestrating the Goal $\rightarrow$ Plan $\rightarrow$ Execute $\rightarrow$ Reflect loop.
- The stateful database models of `AgentSession` and `ApprovalRequest`.
- Registering tools and exposing the `Tool Registry`.
- Tracking re-planning counters and routing escalations.
- Enforcing plan approvals and resolving decisions.
- Publishing events: `ApprovalRequested`, `ApprovalResolved`, `ToolExecuted`.

### What the AI Agent Context DOES NOT Own
- **Actual Tool Execution Logic**: The tools in the registry are adapters that call public inbound ports of other modules (e.g. `TodoPort`, `CalendarPort`). The Agent does not own task or event schemas.
- **Persistence of productivity data**: Todo tables and Calendar tables are private to their respective contexts.
- **Chat Log Persistence**: Storing multi-turn conversation logs is owned by `Memory`.
- **Notification Delivery**: Translating `ApprovalRequested` into emails or Slack webhooks is owned by `Notification`.
- **Synchronization Hub**: Syncing external tasks/events is owned by `Connector`.
