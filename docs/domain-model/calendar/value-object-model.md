# Value Object Model — Calendar Bounded Context

---

## EventId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifier. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null. |

---

## WorkspaceId

| Aspect | Description |
| --- | --- |
| **Fields** | Tenancy boundary reference (shared kernel). |
| **Immutability** | Immutable on event. |
| **Validation** | Non-null; all operations scoped to this value. |

---

## UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Event owner reference (Auth identity, soft reference). |
| **Immutability** | Immutable or replace-on-change per product rules. |
| **Validation** | Non-null at creation. |

---

## EventTitle

| Aspect | Description |
| --- | --- |
| **Fields** | Non-empty title string. |
| **Immutability** | Replace-on-change. |
| **Validation** | Trimmed content not empty/whitespace. |

---

## EventDescription

| Aspect | Description |
| --- | --- |
| **Fields** | Optional text. |
| **Immutability** | Replace-on-change. |
| **Validation** | May be empty. |

---

## EventTimeRange

| Aspect | Description |
| --- | --- |
| **Fields** | **StartTime**, **EndTime** (date-time). |
| **Immutability** | Replace-on-change on reschedule. |
| **Validation** | **StartTime** required; **EndTime** strictly after **StartTime**. |

---

## LeadTime

| Aspect | Description |
| --- | --- |
| **Fields** | Duration before event start (e.g. 15 minutes, 1 hour). |
| **Immutability** | Immutable on a given reminder configuration until replaced. |
| **Validation** | Positive duration; trigger = start − lead must not be in the past at creation time. |

---

## ReminderStatus

| Aspect | Description |
| --- | --- |
| **Fields** | **Scheduled**, **Triggered**, **Snoozed**, **Dismissed**. |
| **Immutability** | Transitions via **Reminder** / **CalendarEvent** methods. |
| **Validation** | **Dismissed** is terminal for firing. |

---

## SnoozeOffset

| Aspect | Description |
| --- | --- |
| **Fields** | Short delay (e.g. 5 or 10 minutes) from “now” when user snoozes. |
| **Immutability** | Applied once per snooze action. |
| **Validation** | Positive duration. |

---

## ScheduleInterval

| Aspect | Description |
| --- | --- |
| **Fields** | Half-open or closed interval `[Start, End]` for overlap checks. |
| **Immutability** | Derived from **EventTimeRange**. |
| **Validation** | Valid only if end after start. |

---

## OverlapPolicyContext

| Aspect | Description |
| --- | --- |
| **Fields** | Boolean **preventCalendarOverlap** (sourced from Memory preferences at operation time). |
| **Immutability** | Immutable per create/reschedule command. |
| **Validation** | When true, overlapping active events in same workspace must be rejected by domain service. |

---

## ReminderTriggerTime

| Aspect | Description |
| --- | --- |
| **Fields** | Absolute date-time when reminder should fire. |
| **Immutability** | Recalculated on reschedule or snooze. |
| **Validation** | Must align with **LeadTime** and current **EventTimeRange** unless snoozed. |

---

## AvailabilityWindow

| Aspect | Description |
| --- | --- |
| **Fields** | `startTime: Instant`, `endTime: Instant` representing a continuous free period. |
| **Immutability** | Immutable once computed. |
| **Validation** | `endTime` must be strictly after `startTime`. Derived from gaps between active events in a workspace. |

---

## TimeSlot

| Aspect | Description |
| --- | --- |
| **Fields** | `startTime: Instant`, `endTime: Instant`, `duration: Duration`. |
| **Immutability** | Immutable once computed. |
| **Validation** | Must fit within an **AvailabilityWindow**; `endTime` strictly after `startTime`. |

---

## SchedulingConstraint

| Aspect | Description |
| --- | --- |
| **Fields** | `workingHoursStart: Instant?`, `workingHoursEnd: Instant?`, `minimumNotice: Duration`, `maxSlotDuration: Duration`. |
| **Immutability** | Immutable per query. |
| **Validation** | If present, all values must be non-negative; `workingHoursEnd` must be after `workingHoursStart`. |

---

## SlotQuery

| Aspect | Description |
| --- | --- |
| **Fields** | `workspaceId: WorkspaceId`, `rangeStart: Instant`, `rangeEnd: Instant`, `desiredDuration: Duration`, `constraints: SchedulingConstraint?`. |
| **Immutability** | Immutable per request. |
| **Validation** | `rangeEnd` must be after `rangeStart`; `desiredDuration` must be positive. |
