# Domain Events — Todo Bounded Context

---

## TaskCreated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate (via application layer) |
| **Trigger** | New task initialized with valid title, workspace, and priority. |
| **Consumers** | `AI Agent` (ground active task lists), `Notification` (optional confirmation), `Memory` (conversation grounding) |
| **Business Meaning** | A trackable unit of work has entered the system. Agents may update context; workflow automations may trigger. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Unique identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `title` | Title | Task name |
| `priority` | Priority | High / Medium / Low |
| `dueDate` | DueDate? | Optional due date |
| `tags` | Tag[] | Zero or more tags |
| `parentTaskId` | ParentTaskId? | Set when recurrence instance |
| `occurredAt` | Instant | Creation timestamp |

---

## TaskUpdated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | Title, description, priority, due date, or tags changed on an active task. |
| **Consumers** | `Connector` (outbound sync to external providers), `AI Agent` (re-ground context) |
| **Business Meaning** | Work item content changed. Sync adapters propagate to Jira/TickTick/Notion. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Changed task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `changedFields` | string[] | Names of modified fields |
| `occurredAt` | Instant | Timestamp |

---

## TaskCompleted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | Active task marked complete (`Active → Completed`). |
| **Consumers** | `AI Agent` (session reflection, progress tracking), `Notification` (completion acknowledgement), `Connector` (sync status), `Memory` (conversation update) |
| **Business Meaning** | A unit of work is done. Agents track completion against a session goal. Connectors propagate status to external tools. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Completed task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `completedAt` | Instant | Completion timestamp |

---

## TaskReopened

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | Completed task reopened (`Completed → Active`). |
| **Consumers** | `AI Agent`, `Connector` |
| **Business Meaning** | Previously finished task needs more work. Session and external systems must treat it as active again. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Reopened task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Timestamp |

---

## TaskSoftDeleted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | Task logically deleted (`Active/Completed → SoftDeleted`). |
| **Consumers** | `Connector` (pause sync for this record), background purge scheduler |
| **Business Meaning** | Task hidden from work views. Sync paused. 2-hour recovery window starts. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Deleted task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `softDeletedAt` | Instant | Deletion timestamp (purge window start) |

---

## TaskRecovered

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | Soft-deleted task restored within recovery window (`SoftDeleted → Active`). |
| **Consumers** | `Connector` (resume sync), `AI Agent` |
| **Business Meaning** | User reversed deletion within the allowed window. Task re-enters the active queue and sync resumes. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Recovered task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `recoveredAt` | Instant | Recovery timestamp |

---

## TaskPurged

| Attribute | Detail |
| --- | --- |
| **Publisher** | Domain service / purge scheduler |
| **Trigger** | Soft-deleted task exceeds 2-hour inactivity window; permanently removed. |
| **Consumers** | `Connector` (remove sync mapping), audit log |
| **Business Meaning** | Task permanently erased. Connectors clean up external sync references. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Purged task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `purgedAt` | Instant | Purge timestamp |

---

## RecurrenceStarted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate (recurrence parent) |
| **Trigger** | Recurrence schedule attached and activated (`RecurrenceExecutionState = Active`). |
| **Consumers** | Recurrence instance generation service |
| **Business Meaning** | Scheduler begins generating child task instances at configured intervals. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `taskId` | TaskId | Parent template task |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `pattern` | RecurrencePattern | Recurrence pattern (DAILY, WEEKLY, MONTHLY) |
| `interval` | RecurrenceInterval | Interval multiplier |
| `occurredAt` | Instant | Activation timestamp |

---

## RecurrencePaused

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | User pauses active recurrence (`Active → Paused`). |
| **Consumers** | Recurrence instance generation service |
| **Business Meaning** | No new instances until resumed. Existing instances unaffected. |

---

## RecurrenceStopped

| Attribute | Detail |
| --- | --- |
| **Publisher** | `Task` aggregate |
| **Trigger** | User permanently stops recurrence (`Active/Paused → Stopped`). Terminal. |
| **Consumers** | Recurrence instance generation service |
| **Business Meaning** | No further instances ever generated from this parent. Parent task itself may remain active. |

---

## RecurrenceInstanceGenerated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `RecurrenceInstanceGenerationService` (domain service) |
| **Trigger** | New child `Task` successfully created from a recurring parent. |
| **Consumers** | `AI Agent`, `Notification` |
| **Business Meaning** | A scheduled work item materialized. Consumers can alert user or update planning context. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `instanceTaskId` | TaskId | Newly created child task |
| `parentTaskId` | TaskId | Source template |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `dueDate` | DueDate | Instance due date |
| `occurredAt` | Instant | Generation timestamp |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| TaskCreated | Task | Agent, Notification, Memory |
| TaskUpdated | Task | Connector, Agent |
| TaskCompleted | Task | Agent, Notification, Connector, Memory |
| TaskReopened | Task | Agent, Connector |
| TaskSoftDeleted | Task | Connector, Purge Scheduler |
| TaskRecovered | Task | Connector, Agent |
| TaskPurged | Purge Scheduler | Connector, Audit |
| RecurrenceStarted | Task | Generation Service |
| RecurrencePaused | Task | Generation Service |
| RecurrenceStopped | Task | Generation Service |
| RecurrenceInstanceGenerated | Generation Service | Agent, Notification |
