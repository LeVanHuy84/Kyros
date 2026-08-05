# Aggregate Discovery — Todo Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Todo Bounded Context** of the AI Executive Assistant.

---

## 1. Business Capabilities

The Todo bounded context is responsible for the following business capabilities:

- **Task Lifecycle Management**: Provision of capabilities to create, read, update, soft-delete, and restore/recover tasks.
- **Task Prioritization and Tagging**: Triaging and organizing workloads by assigning exactly one priority level (High, Medium, Low) and zero or more case-sensitive string labels (tags).
- **Task Sorting and Filtering**: Searching, sorting, and filtering tasks based on priority, tags, status, and due dates.
- **Recurring Task Scheduling**: Automating routine tasks by defining recurrence schedules conforming to standard RFC 5545, generating task instances at designated intervals, and controlling the repetition (start, pause, stop).

---

## 2. Aggregate Candidates

### Task Aggregate
The primary and only aggregate within the Todo Bounded Context is the **Task**.

- **Why it should be an Aggregate**: 
  A Task is a business entity with a distinct identity (`TaskId`), a complex stateful lifecycle, and a set of strict business invariants that must be kept consistent. It is the boundary for transactional consistency when tasks are modified, completed, deleted, or generated.
- **Responsibilities**:
  - Encapsulates task fields: Title, Description, Priority, Due Date, WorkspaceId, and Tags.
  - Enforces task-level constraints (e.g. title presence, priority boundaries, tags formatting).
  - Controls task completion state transitions (Active $\leftrightarrow$ Completed).
  - Manages logical deletion state transitions (Active $\leftrightarrow$ Soft-Deleted $\rightarrow$ Hard-Purged) and verifies recovery validity against session activity.
  - Holds the optional Recurrence Rule (RRule) and handles its execution states (Active, Paused, Stopped).
- **Consistency Boundary**:
  A single `Task` instance. Changes to a task's fields, tags, priority, or status are atomic. Each task enforces its own integrity rules.
- **Transaction Boundary**:
  Scoped to a single `TaskId` in a specific `WorkspaceId`. Modifying one task does not affect or lock other tasks. Child instances generated from a recurring parent task are created in distinct transactions to minimize contention.
- **Lifecycle**:
  - **Draft/Created**: Task is initialized with a title and default/specified priority and tags.
  - **Active**: Task is active and trackable.
  - **Completed**: Task has been finished by the user. It can be reopened, which transitions it back to *Active*.
  - **Soft-Deleted**: Task is logically deleted and hidden from lists. It remains in a temporary recovery state.
  - **Hard-Deleted (Purged)**: Task is permanently removed from the system after the recovery window expires.
  - **Recurrence Lifecycle** (applicable if RRule is set):
    - *Active Recurrence*: The parent task schedule is active and generating child instances.
    - *Paused*: The schedule is temporarily halted; no child instances are generated.
    - *Stopped*: The schedule is terminated; no further instances will be created.

```
       [ Draft/Created ] ──► [ Active ] ◄──────────┐
                                │   │              │
                    ┌───────────┘   │ (Complete)   │ (Recover)
       (Soft-Delete)│               ▼              │
                    ▼         [ Completed ]        │
             [ Soft-Deleted ] ─────────────────────┘
                    │
                    │ (Purge after 2h inactivity)
                    ▼
             [ Hard-Deleted ]
```

---

## 3. Aggregate Relationships

Because the `Task` is the sole aggregate inside this bounded context, the only relationship is self-referential between a parent task and its generated child instances:

### Parent Task $\rightarrow$ Recurrence Instance (Soft Reference)
- **Relationship Type**: Zero-to-Many ($0..*$), self-referential relationship.
- **Design Pattern**: **Soft reference by ID**. Generated child task instances reference their parent task via `ParentTaskId`.
- **Reasoning**: To maintain strict aggregate isolation, parent and child tasks do not hold direct object references. If child tasks were part of the parent's aggregate tree, updating a single task instance would require locking the parent and all other children. Utilizing soft references ensures that modifying, completing, or deleting a child instance has no transactional dependency on the parent template.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the bounded context:

1. **Mandatory Title**: Every Task must have a non-empty, non-whitespace title.
2. **Single Priority constraint**: Every active or completed Task must have exactly one priority level assigned at all times (High, Medium, Low).
3. **Workspace Tenancy Scope**: A Task must belong to exactly one Workspace (`WorkspaceId`), which is validated upon every write or read operation to prevent cross-tenant data leakage.
4. **Soft-delete Trash Retention**: Soft-deleted tasks are placed in the Trash and can be recovered by the user. Expired tasks are permanently purged after 30 days.
5. **Standard Recurrence Rules**: Task recurrence schedules must configure a valid repeat pattern (Daily, Weekly, Monthly) and interval.
6. **Instance Property Inheritance**: Generated recurrence instances must inherit the parent task's priority and tags at the time of generation.
7. **No Overlapping Due Dates**: Task instances generated from the same parent task must not share the same due date.

---

## 5. Domain Responsibilities

### What the Todo Context Owns
- The system of record for all task data, tags, priorities, and recurrence rules.
- The business logic for CRUD operations, soft-deletion, and task recovery.
- Validating recurrence patterns.
- Orchestrating the generation of recurring task instances.
- Publishing domain events (`TaskCreated`, `TaskCompleted`, `TaskRecovered`) to notify the system of state changes.
- Restricting data access and modifications strictly within the tenant's workspace boundary.

### What the Todo Context DOES NOT Own
- **User Authentication and Credentials**: Managed by the `Auth` context.
- **Workspace Lifecycle and Member Roles**: Managed by the `Workspace` context.
- **Schedule Management**: Managed by the `Calendar` context (Calendar owns calendar event CRUD, schedules, and notifications/alerts for event starts).
- **External Third-Party Synchronization**: Managed by the `Connector` context (Connector acts as the Anti-Corruption Layer that translates Jira/TickTick/Notion models into `TodoPort` operations).
- **Automation rules**: Managed by the `Workflow` context (Workflow rules listen to Todo events and execute actions).
- **Urgency Policy and Notification Channels**: Managed by the `Notification` context.
- **Goal planning and natural language processing**: Managed by the `AI Agent` context. The Agent can call `TodoPort` via local tools in its registry, but does not own task business logic.
- **Conversation flows and personalized user memory**: Managed by the `Memory` context.
