# Domain Services — Calendar Bounded Context

---

## ScheduleOverlapValidationService

### Purpose

Determine whether a proposed **EventTimeRange** collides with existing events when overlap prevention is enabled.

### Why not inside CalendarEvent

Invariant #5 requires comparing the candidate event against **other** aggregates in the same workspace. A single **CalendarEvent** cannot see sibling events without breaking aggregate isolation.

### Responsibilities

- Given **WorkspaceId**, candidate interval, optional excluding **EventId**, and **OverlapPolicyContext**, query **CalendarEventRepository** for overlaps.
- Return validation result (allow/reject) before persist on create/reschedule.

---

## ReminderDispatchSchedulingService (domain coordination)

### Purpose

Identify reminders that should fire and hand off payload to **NotificationDispatchPort** (application adapter).

### Why not inside CalendarEvent

Dispatch spans all events in a workspace at a point in time, multiple aggregates, and external Notification context. The service orchestrates reads and port calls without bloating one event root.

### Responsibilities

- Query repository for reminders due at or before **now**.
- Build dispatch descriptors (event title, start time, urgency) for the port.

---

## Factories

### CalendarEventFactory

**Used because** creation combines **EventId**, **EventTimeRange** validation, initial **Reminder** list, and workspace/user references.

**Responsibilities**

- Instantiate **CalendarEvent** with valid invariants on value objects.
- Attach initial **Reminder** entities with computed **ReminderTriggerTime**.

**Not responsible for**

- Overlap checks (delegated to **ScheduleOverlapValidationService** before save).
- Actual notification delivery.

---

## What is not a domain service

| Concern | Placement |
| --- | --- |
| End after start, title rules | **CalendarEvent** / value objects |
| Snooze/dismiss | **Reminder** entity via aggregate root |
| User timezone display | Application / preferences from **Memory** |
