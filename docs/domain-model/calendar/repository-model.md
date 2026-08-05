# Repository Model — Calendar Bounded Context

**CalendarEventRepository** — one repository per **CalendarEvent** aggregate root.

---

## CalendarEventRepository

### Responsibilities

- Load **CalendarEvent** by **EventId** and **WorkspaceId**, including **Reminder** collection.
- Persist create, update, reschedule, and delete of the full aggregate atomically.
- Find active events in **WorkspaceId** whose **EventTimeRange** overlaps a candidate interval (read-only, for overlap enforcement).
- Query events in a time window for schedule visualization (filter by workspace).
- Load events with due reminders before a given instant (for reminder dispatch scheduling; domain query responsibility).

### Out of scope

- Sending notifications (**Notification** context via port).
- Storing user overlap preference (**Memory** / **UserPreferences**).
- External calendar sync (**Connector**).

### Contract expectations

- Never return events from a different **WorkspaceId** than requested.
- Overlap queries exclude deleted events and respect active lifecycle only.
