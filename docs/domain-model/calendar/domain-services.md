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

## AvailabilityQueryService

### Purpose

Compute free time windows and candidate slots for the AI Agent or other downstream consumers. Calendar exposes scheduling primitives; it does **not** make planning decisions.

### Why not inside CalendarEvent

Availability is a cross-aggregate query: it requires scanning all active events in a workspace and computing gaps. A single **CalendarEvent** cannot perform this without violating aggregate isolation.

### Responsibilities

- Given a **WorkspaceId**, a time **range**, and optional **SchedulingConstraint** preferences, query **CalendarEventRepository** for active events in the range.
- Compute **AvailabilityWindow** values (gaps between consecutive events).
- Produce **TimeSlot** candidates of a requested **desiredDuration** that fit within availability windows, respecting working-hour bounds and minimum-notice constraints.
- Return an ordered list of slots; empty if no slot is available.

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
