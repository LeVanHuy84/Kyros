# Aggregate Discovery — Calendar Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Calendar Bounded Context** of the AI Executive Assistant.

---

## 1. Business Capabilities

The Calendar bounded context is responsible for the following business capabilities:

- **Calendar Event Lifecycle Management**: Provision of capabilities to create, read, update, and delete calendar events.
- **Overlap Constraint Enforcement**: Checking for time collisions and enforcing scheduling rules based on user preferences.
- **Reminder Configuration & Scheduling**: Configuring advanced notifications (lead times) for events, and handling user responses such as snoozing or dismissing alerts.
- **Schedule Query & Visualization**: Listing, filtering, and querying calendar timelines for specific time windows.

---

## 2. Aggregate Candidates

### Calendar Event Aggregate
The primary and only aggregate within the Calendar Bounded Context is the **Calendar Event**.

- **Why it should be an Aggregate**:
  A Calendar Event has a distinct identity (`EventId`), a clean lifecycle, and must enforce internal and external constraints (such as chronological validity and reminder constraints) in a consistent manner. It acts as the container and boundary for associated reminders.
- **Responsibilities**:
  - Encapsulates event properties: Title, Description, Start Time, End Time, and WorkspaceId.
  - Manages associated **Reminders** (which are Value Objects or Entities inside the Event aggregate since they are lifecycle-bound to the event, have no meaning outside it, and are always updated through the event).
  - Enforces internal invariants (e.g. End Time must be chronologically after Start Time, Title presence).
  - Schedules and manages reminder triggers based on Lead Time.
- **Consistency Boundary**:
  A single `Calendar Event` instance and its collection of `Reminders`. Any modification to the event's schedule or reminders list is processed as an atomic unit.
- **Transaction Boundary**:
  Scoped to a single `EventId` within a specific `WorkspaceId`. Operations on one event do not lock other events, except when validating overlap constraints (which are validated against other events in the workspace using read-only queries before write).
- **Lifecycle**:
  - **Scheduled/Active**: The event is active and visible on the calendar.
  - **Rescheduled**: The event's start or end time is updated (requiring recalculation of reminders and re-evaluating overlap constraints).
  - **Cancelled/Deleted**: The event is permanently deleted. Its scheduled reminders are cancelled.

---

## 3. Aggregate Relationships

Because the `Calendar Event` is the sole aggregate inside this bounded context, there are no relationships between different aggregates inside the context.

- **External References**:
  - **Workspace Reference**: The event references a `WorkspaceId` (Value Object from the Shared Kernel) to enforce tenancy.
  - **User Reference**: The event is owned by a user, referenced by `UserId`.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Calendar context:

1. **Mandatory Title**: Every Calendar Event must have a non-empty, non-whitespace title.
2. **Mandatory Start Time**: Every Calendar Event must have a valid start date and time.
3. **Chronological Consistency**: The End Time of a Calendar Event must be strictly after its Start Time.
4. **Workspace Tenant Boundary**: All calendar events and reminders must belong strictly to a single `WorkspaceId`. Cross-workspace calendar reads or writes are strictly prohibited.
5. **No-Overlap Enforcement (Conditional)**: If the user preference for "prevent calendar overlap" is enabled, the system must reject the creation or rescheduling of any event whose time range $[Start_A, End_A]$ overlaps with another active event $[Start_B, End_B]$ in the same workspace.
6. **Reminder Timing Constraint**: The trigger time of a reminder (calculated as $Start Time - Lead Time$) must be a valid, positive duration. Reminders cannot trigger in the past relative to the current time during event creation.
7. **Reminder Association**: A reminder cannot exist without a parent Calendar Event.

---

## 5. Domain Responsibilities

### What the Calendar Context Owns
- The database models and state of calendar events and associated reminders.
- Validation of event scheduling logic (start/end constraints, overlap checks).
- Managing reminder status (scheduled, snooze offset, dismissal).
- Emitting events (`CalendarEventCreated`, `CalendarEventUpdated`, `CalendarEventConflictDetected`) to notify the platform of scheduling state changes.
- Restricting all operations within the workspace security boundary.

### What the Calendar Context DOES NOT Own
- **User Authentication and Identity**: Managed by the `Auth` context.
- **Workspace Tenancy & Memberships**: Managed by the `Workspace` context.
- **User Preferences Storage**: Managed by the `Memory` context. (The preference `prevent calendar overlap` is stored in Memory, but Calendar queries it or receives it to enforce the invariant).
- **Notification Delivery Channels & Prefs**: Managed by the `Notification` context. The Calendar context determines *when* a reminder should fire, but delegates the *dispatching and channel-routing* to the Notification context.
- **External Synchronization (Google Calendar, Outlook)**: Managed by the `Connector` context (which acts as the Anti-Corruption Layer translating external data models into `CalendarPort` calls).
- **Task Management**: Managed by the `Todo` context.
- **Workflow triggers & automation runs**: Managed by the `Workflow` context.
- **Goal planning and natural language processing**: Managed by the `AI Agent` context.
