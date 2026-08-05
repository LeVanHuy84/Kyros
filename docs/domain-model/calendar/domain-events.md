# Domain Events — Calendar Bounded Context

---

## CalendarEventCreated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate (via application layer) |
| **Trigger** | New event created with valid title, time range, and workspace scope. |
| **Consumers** | `Notification` context (schedule reminder dispatch), `AI Agent` (ground scheduling context), `Connector` (outbound sync to Google Calendar / Outlook) |
| **Business Meaning** | A time block is reserved on the user's calendar. Reminders are scheduled; external calendars may be updated. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Unique identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Event owner |
| `title` | EventTitle | Event name |
| `timeRange` | EventTimeRange | Start and end date-times |
| `reminderCount` | integer | Number of reminders configured |
| `occurredAt` | Instant | Creation timestamp |

---

## CalendarEventUpdated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate |
| **Trigger** | Title or description updated (no time change). |
| **Consumers** | `Connector` (outbound sync), `AI Agent` |
| **Business Meaning** | Event metadata changed. External calendars should reflect the new title or description. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Modified event |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `changedFields` | string[] | Fields modified |
| `occurredAt` | Instant | Timestamp |

---

## CalendarEventRescheduled

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate |
| **Trigger** | Start and/or end time updated (`Scheduled → Rescheduled` state). Reminders recalculated. |
| **Consumers** | `Notification` context (cancel old reminders, schedule new ones), `Connector` (sync new times), `AI Agent` |
| **Business Meaning** | Time slot moved. Notification context must cancel existing scheduled reminders and re-schedule at the new trigger times. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Rescheduled event |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `previousTimeRange` | EventTimeRange | Old start/end |
| `newTimeRange` | EventTimeRange | New start/end |
| `updatedReminderTriggers` | ReminderTriggerTime[] | Recalculated trigger times |
| `occurredAt` | Instant | Timestamp |

---

## CalendarEventDeleted

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate |
| **Trigger** | Event permanently removed; all reminders cancelled. |
| **Consumers** | `Notification` context (cancel all pending reminders for this event), `Connector` (remove from external calendar), `AI Agent` |
| **Business Meaning** | The time block no longer exists. Any scheduled notification triggers must be cancelled immediately. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Deleted event |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Deletion timestamp |

---

## CalendarEventConflictDetected

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate / domain service (overlap check) |
| **Trigger** | Overlap policy is enabled and an attempted create or reschedule would produce a time collision with an existing active event. The operation is **rejected**; this event is raised as a notification to the user. |
| **Consumers** | `Notification` context (alert user of the conflict), `AI Agent` (surface conflict for replanning) |
| **Business Meaning** | The system prevented double-booking. The user must choose a different time slot or disable the overlap policy. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `attemptedEventId` | EventId | Event whose creation/reschedule was rejected |
| `conflictingEventId` | EventId | Existing event causing the conflict |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `proposedTimeRange` | EventTimeRange | The rejected time slot |
| `occurredAt` | Instant | Detection timestamp |

---

## ReminderTriggered

| Attribute | Detail |
| --- | --- |
| **Publisher** | Reminder dispatch orchestrator (application/infrastructure) |
| **Trigger** | `ReminderTriggerTime` reached for a `Scheduled` reminder on an active event. |
| **Consumers** | `Notification` context (dispatch alert via configured channels) |
| **Business Meaning** | It is time to alert the user. Calendar delegates actual channel dispatch to the Notification context via `NotificationDispatchPort`. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Parent event |
| `reminderId` | ReminderId | Fired reminder |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Recipient |
| `eventTitle` | EventTitle | For notification rendering |
| `eventStartTime` | Instant | Event start for context |
| `triggeredAt` | Instant | Actual trigger time |

---

## ReminderSnoozed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate (via `Reminder` entity) |
| **Trigger** | User snoozes a triggered reminder; new trigger time = now + `SnoozeOffset`. |
| **Consumers** | Reminder re-scheduler / `Notification` context |
| **Business Meaning** | The user acknowledged the alert but is not ready to act. The system must re-fire the reminder after the snooze duration. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Parent event |
| `reminderId` | ReminderId | Snoozed reminder |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `newTriggerTime` | ReminderTriggerTime | Rescheduled fire time |
| `occurredAt` | Instant | Snooze action timestamp |

---

## ReminderDismissed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `CalendarEvent` aggregate (via `Reminder` entity) |
| **Trigger** | User dismisses a triggered reminder (`Triggered/Snoozed → Dismissed`). Terminal for this reminder. |
| **Consumers** | Reminder scheduler (remove from queue), `Notification` context |
| **Business Meaning** | User has acknowledged and closed the alert. No further firing for this reminder. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | EventId | Parent event |
| `reminderId` | ReminderId | Dismissed reminder |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Dismissal timestamp |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| CalendarEventCreated | CalendarEvent | Notification, Agent, Connector |
| CalendarEventUpdated | CalendarEvent | Connector, Agent |
| CalendarEventRescheduled | CalendarEvent | Notification, Connector, Agent |
| CalendarEventDeleted | CalendarEvent | Notification, Connector, Agent |
| CalendarEventConflictDetected | CalendarEvent / domain service | Notification, Agent |
| ReminderTriggered | Dispatch orchestrator | Notification |
| ReminderSnoozed | CalendarEvent | Notification, Re-scheduler |
| ReminderDismissed | CalendarEvent | Notification, Scheduler |
