# Entity Model — Calendar Bounded Context

Single aggregate: **CalendarEvent**, with **Reminder** entities inside the event boundary.

---

## Calendar Event Aggregate

### Aggregate Root: CalendarEvent

#### Responsibilities

- Consistency boundary for a scheduled time block within one **WorkspaceId**.
- Encapsulates title, description, start/end times, and owning **UserId** reference.
- Owns zero or more **Reminder** entities; all reminder changes go through the event root.
- Enforces chronological validity (end strictly after start), mandatory title and start time.
- Recalculates reminder trigger times when schedule is rescheduled.
- Cancels reminders on event deletion.
- Accepts **OverlapPolicyContext** (from Memory/preferences) when creating or rescheduling; rejects overlaps when prevention is enabled (via collaborating domain service + repository reads).
- Provides scheduling primitives: overlap detection, availability window computation, and time-slot discovery for AI Agent orchestration. Calendar does **not** make planning decisions; it only exposes available time ranges.

#### Identity

- **EventId** + **WorkspaceId** tenancy scope.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Scheduled** | Event active on calendar with valid time range. |
| **Rescheduled** | Start/end updated; reminders recalculated. |
| **Deleted** | Event removed; reminders cancelled (terminal). |

#### Public behaviors

- Create with title, time range, optional description, optional reminders.
- Update title, description, start/end (reschedule).
- Add, update, or remove **Reminder** configurations.
- Delete event (terminal).
- Mark reminder snoozed or dismissed (via **Reminder** entity behaviors invoked on root).
- Expose scheduled reminder trigger times for dispatch orchestration (application/Notification port).
- Query availability windows and discover available time slots for a given duration and constraints (read-only; no aggregate mutation).

---

### Entity: Reminder

#### Responsibilities

- Stores **LeadTime**, computed trigger time, and status (scheduled, triggered, snoozed, dismissed).
- Applies snooze (temporary future trigger) and dismiss (no further alerts).
- Ensures trigger time = start time minus lead time, valid at configuration time.

#### Identity

- **ReminderId** unique within parent **CalendarEvent**.

#### Parent aggregate

- **CalendarEvent**.

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | CalendarEvent | EventId |
| Entity | Reminder | ReminderId (scoped to event) |
