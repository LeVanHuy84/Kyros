# Ubiquitous Language — Todo Bounded Context

This document defines the core business terms and concepts within the **Todo Bounded Context** of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. Task
- **Definition**: A discrete, tracked unit of work that a user intends to perform. It acts as the primary entity within the Todo domain.
- **Synonyms**: Work Item, Todo Item, Action Item.
- **Context-Specific Meaning**: In this context, a Task is restricted to a single Workspace and is always associated with exactly one priority. It has a lifecycle that supports creation, update, soft-deletion, recovery, and completion.

### 2. Priority
- **Definition**: The level of importance and urgency assigned to a Task.
- **Synonyms**: Priority Level, Task Importance.
- **Context-Specific Meaning**: Every Task must have exactly one Priority level at all times. The valid values are **High**, **Medium**, and **Low**. If not explicitly set by the user, it defaults to **Medium**.

### 3. Tag
- **Definition**: A user-defined, case-sensitive string label attached to a Task for classification and organization.
- **Synonyms**: Classification Label, Category, Label.
- **Context-Specific Meaning**: Tags are unstructured strings. A Task can have zero, one, or multiple tags. They are used for filtering and sorting tasks.

### 4. Recurrence Pattern
- **Definition**: A specification defining how and when a Task should repeat automatically.
- **Synonyms**: Repeat Schedule, Recurrence Rule.
- **Context-Specific Meaning**: Recurrence settings in this context are configured as simple patterns (daily, weekly, monthly) with an optional interval multiplier (e.g., every 2 weeks).

### 5. Parent Task
- **Definition**: A Task configured with a Recurrence Pattern that serves as the template/source for generating recurring task instances.
- **Synonyms**: Recurring Template, Parent.
- **Context-Specific Meaning**: A Parent Task maintains the recurrence schedule and serves as the template for all child instances. It inherits the workspace boundary.

### 6. Recurrence Instance
- **Definition**: An individual task instance generated automatically from a Parent Task according to its Recurrence Pattern.
- **Synonyms**: Recurring Task Instance, Child Task.
- **Context-Specific Meaning**: Each instance is a standalone Task aggregate with its own unique identifier (`TaskId`). It inherits the parent's priority and tags but has a unique due date and independent status (e.g. completion status).

### 7. Soft-Delete
- **Definition**: The operation of marking a Task as deleted without immediately removing it from the persistent storage.
- **Synonyms**: Logical Delete, Temporary Deletion.
- **Context-Specific Meaning**: Soft-deleted tasks are hidden from normal list views but are retained in the database during a specific recovery window. This allows users to undo accidental deletions.

### 8. Hard-Delete
- **Definition**: The permanent, irreversible removal of a Task's data from persistent storage.
- **Synonyms**: Permanent Delete, Physical Deletion.
- **Context-Specific Meaning**: Occurs automatically once the Trash retention period expires. Once hard-deleted, a task cannot be recovered.

### 9. Trash Retention
- **Definition**: The period during which a soft-deleted Task is eligible to be recovered from the Trash by the user.
- **Synonyms**: Retention Window, Recovery Period.
- **Context-Specific Meaning**: Tasks remain in the Trash for a default period (e.g., 30 days) during which they can be recovered. After this period, they are permanently hard-deleted.

### 10. Workspace
- **Definition**: The logical boundary for all data isolation and tenancy.
- **Synonyms**: Tenant Space, Tenancy Boundary.
- **Context-Specific Meaning**: A Task is strictly bound to a single Workspace. Operations on a task are validated against the workspace context, and no task can be shared or accessed across different workspaces.
