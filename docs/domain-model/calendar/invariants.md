# Business Invariants — Calendar Bounded Context

---

## Validation Rules

### INV-CAL-01 — Mandatory Title

| Aspect | Detail |
| --- | --- |
| **Rule** | Every `CalendarEvent` must have a non-empty, non-whitespace title at all times. |
| **Enforcement** | `EventTitle` value object trims and rejects blank strings; validated on `create()` and `updateMetadata()`. |
| **Violation** | Operation rejected; aggregate state unchanged. |

---

### INV-CAL-02 — Mandatory Start Time

| Aspect | Detail |
| --- | --- |
| **Rule** | Every `CalendarEvent` must have a valid `StartTime`. |
| **Enforcement** | `EventTimeRange` requires a non-null `StartTime` on construction; `create()` and `reschedule()` validate before persisting. |
| **Violation** | Event creation or reschedule without a start time is rejected. |

---

### INV-CAL-03 — Chronological Consistency

| Aspect | Detail |
| --- | --- |
| **Rule** | `EndTime` must be strictly after `StartTime`. |
| **Enforcement** | `EventTimeRange` value object validates `EndTime > StartTime` on construction. |
| **Violation** | `EventTimeRange` construction rejected; operation fails before the aggregate is mutated. |

---

### INV-CAL-04 — Reminder Timing Constraint

| Aspect | Detail |
| --- | --- |
| **Rule** | A reminder's trigger time (`StartTime − LeadTime`) must be a positive duration and must not be in the past at the moment the reminder is configured. |
| **Enforcement** | `addReminder(leadTime)` on the aggregate computes `triggerTime = startTime − leadTime` and validates it is after the current time (supplied by the application layer). |
| **Violation** | Reminder configuration rejected; reminder entity not created. |

---

### INV-CAL-05 — Reminder Must Have a Parent Event

| Aspect | Detail |
| --- | --- |
| **Rule** | A `Reminder` entity cannot exist independently of a `CalendarEvent`. |
| **Enforcement** | `Reminder` is an entity inside the `CalendarEvent` aggregate boundary. It is created through the aggregate root and cancelled when the event is deleted. |
| **Violation** | Architectural guardrail — no `Reminder` can be persisted without an owning `EventId`. |

---

## Consistency Rules

### INV-CAL-06 — No-Overlap Enforcement (Conditional)

| Aspect | Detail |
| --- | --- |
| **Rule** | If the user preference `preventCalendarOverlap = true`, the system must reject any `create()` or `reschedule()` whose time range `[StartA, EndA]` overlaps with an existing active event `[StartB, EndB]` in the same workspace. |
| **Enforcement** | A domain service performs a read-only query for overlapping events before `create()` or `reschedule()` is committed. The `OverlapPolicyContext` VO carries the preference flag. |
| **Violation** | Operation rejected; `CalendarEventConflictDetected` event raised to notify the user. |

---

### INV-CAL-07 — Workspace Tenant Boundary

| Aspect | Detail |
| --- | --- |
| **Rule** | All calendar events and reminders must belong strictly to one `WorkspaceId`. Cross-workspace reads or writes are prohibited. |
| **Enforcement** | `WorkspaceId` is immutable on the aggregate after creation; application layer validates workspace scope on every load and save. |
| **Violation** | Cross-workspace access rejected at application boundary. |

---

### INV-CAL-08 — Reminder Cancellation on Deletion

| Aspect | Detail |
| --- | --- |
| **Rule** | When a `CalendarEvent` is deleted, all its associated `Reminder` entities must be cancelled in the same transaction. |
| **Enforcement** | `delete()` operation on the aggregate iterates all owned reminders and transitions them to `Dismissed` (or removes them) before publishing `CalendarEventDeleted`. |
| **Violation** | Orphaned reminders that fire after event deletion constitute a bug; they must not trigger notifications for non-existent events. |

---

### INV-CAL-09 — Reminder Recalculation on Reschedule

| Aspect | Detail |
| --- | --- |
| **Rule** | When a `CalendarEvent` is rescheduled, all `Scheduled` reminders must have their trigger times recalculated based on the new `StartTime`. |
| **Enforcement** | `reschedule(newTimeRange)` iterates all reminders in `Scheduled` state and recomputes `triggerTime = newStartTime − leadTime`. Reminders already `Triggered`, `Snoozed`, or `Dismissed` are unaffected. |
| **Violation** | Reminders with stale trigger times (pointing to the old start) would fire at incorrect moments. |

---

### INV-CAL-10 — Dismissed Reminder is Terminal

| Aspect | Detail |
| --- | --- |
| **Rule** | A reminder in `Dismissed` state cannot be re-scheduled, snoozed, or triggered again. |
| **Enforcement** | `Reminder` entity guards on `ReminderStatus = Dismissed` and rejects any further state transitions. |
| **Violation** | Attempting to snooze or trigger a dismissed reminder is rejected. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-CAL-01 | Validation | Event title must be non-empty |
| INV-CAL-02 | Validation | StartTime is mandatory |
| INV-CAL-03 | Validation | EndTime must be strictly after StartTime |
| INV-CAL-04 | Validation | Reminder trigger time must be positive and not in the past |
| INV-CAL-05 | Validation | Reminder must always belong to a CalendarEvent |
| INV-CAL-06 | Consistency | No overlapping events when overlap policy enabled |
| INV-CAL-07 | Consistency | Event scoped to one WorkspaceId |
| INV-CAL-08 | Consistency | All reminders cancelled when event deleted |
| INV-CAL-09 | Consistency | Reminder triggers recalculated on reschedule |
| INV-CAL-10 | Consistency | Dismissed reminder is terminal |
