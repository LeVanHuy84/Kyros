# Domain Services — Todo Bounded Context

Domain services host logic that does not naturally belong on a single **Task** aggregate root. The Todo context uses two domain services. All other behavior lives on **Task**, **RecurrenceSchedule**, value objects, or **TaskFactory**.

---

## RecurrenceInstanceGenerationService

### Purpose

Materialize a new **Task** aggregate (recurrence instance) from an active parent template according to its recurrence settings and a computed occurrence **DueDate**.

### Why this logic cannot belong inside the Task aggregate

1. **Separate consistency boundaries**: Each recurrence instance is its own **Task** aggregate with its own **TaskId**. The parent **Task** must not create, own, or lock child aggregates in its object graph; aggregate discovery explicitly uses soft references by **ParentTaskId** to avoid cross-aggregate transactional coupling.

2. **Cross-aggregate invariant**: *No overlapping due dates* among instances from the same parent requires comparing the candidate **DueDate** against **all existing instances** for that **ParentTaskId**. The parent aggregate does not contain those sibling instances and should not load them as part of its consistency boundary.

3. **Scheduling orchestration**: Computing the next valid occurrence from the recurrence pattern/interval and deciding *when* to generate belongs to a process that loads the parent, consults the repository for existing instances, and invokes **TaskFactory**—orchestration that spans one parent aggregate, zero or many instance aggregates, and time-based rules.

### Responsibilities

- Given a parent **Task** in **Active** execution state, determine whether a new instance should be generated for a given scheduling tick or occurrence window.
- Compute the next **DueDate** from the parent’s recurrence settings (pattern and interval).
- Query **TaskRepository** for existing instances of the parent and reject generation when the **DueDate** would violate the no-overlap invariant.
- Build a **RecurrenceInstanceSeed** from the parent’s current **Priority** and **Tag** set at generation time.
- Delegate creation of the new instance aggregate to **TaskFactory** and return the unsaved **Task** for persistence via **TaskRepository**.

### Dependencies (conceptual)

- **TaskRepository** (lookup existing instances, load parent template).
- **TaskFactory** (construct instance aggregate with **ParentTaskId**, inherited fields, and **DueDate**).

---

## What is not a domain service

| Concern | Placement |
| --- | --- |
| Title, priority, tag validation | **Task** aggregate and value objects |
| Recurrence pattern validation | **RecurrencePattern** and **RecurrenceInterval** value objects |
| Pause / resume / stop recurrence | **Task** aggregate root |
| CRUD orchestration, event publishing | Application layer (explicitly out of scope for this document) |
| Workspace membership and roles | **Workspace** context |

---

## Factories

### TaskFactory

**Used because** aggregate creation involves combining multiple value objects, default priority, optional recurrence attachment, and distinct creation paths (manual task vs recurrence instance from **RecurrenceInstanceSeed**).

**Responsibilities**

- Create a new **Task** aggregate root with generated **TaskId**, **WorkspaceId**, **Title**, default or specified **Priority**, optional **Description**, **DueDate**, and tags.
- Create a recurrence **instance** **Task** from **RecurrenceInstanceSeed**, setting **ParentTaskId** and inherited **Priority** / **Tag** snapshot.
- Reject invalid construction input before an aggregate exists (delegating to value object constructors).

**Not responsible for**

- Persisting aggregates (**TaskRepository**).
- Deciding *when* to generate instances (**RecurrenceInstanceGenerationService**).
- Cross-workspace or auth checks beyond requiring valid **WorkspaceId** on the seed or creation command.
