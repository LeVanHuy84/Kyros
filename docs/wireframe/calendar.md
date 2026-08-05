# Low-Fidelity Wireframes — Calendar Bounded Context

## 1. Screen Catalog

The Calendar Bounded Context records scheduled time commitments, verifies scheduling overlaps, and triggers timed event alerts.

- **Screen 1**: Calendar Board View (Day / Week / Month chronological calendar grid)
- **Screen 2**: Event Details Drawer (Right-aligned details sidebar)
- **Screen 3**: Event Editor Modal (Pop-up input form for schedule adjustments)
- **Screen 4**: Active Reminder Toast Alert (Global notification popups)

---

## 2. Navigation

- **Primary Navigation**: Users access the **Calendar Board View** via the main global navigation sidebar item "Calendar".
- **Details Panel**: Clicking on a scheduled event block within the calendar grid slides out the **Event Details Drawer**.
- **Overlay Dialog**: Clicking "+ New Event" in the calendar header, or clicking "Edit" in the drawer, launches the **Event Editor Modal**.
- **Universal Alerts**: The **Active Reminder Toast Alert** is a system-wide notification pop-up that overlaps any active screen when a reminder triggers in the background.

---

## 3. Wireframes

### Screen 1: Calendar Board View
- **Purpose**: Let users browse schedule timelines, view appointment blocks, and spot conflicts chronologically.
- **Main Components**:
  - Date Range navigator (Prev / Next buttons, Date Picker, Today button).
  - Chronological Grid displaying hours/days of the week.
  - Event block cards rendered on the grid.
  - Overlap Conflict alert flags (rendered on events that overlap if overlap protection is disabled but conflicts exist).
  - Action button: "+ Create Event".
- **User Actions**:
  - Navigate between weeks or months.
  - Click on an empty time slot (opens editor modal with pre-filled times).
  - Click on an event block (opens details drawer).
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/calendar/events`
- **Use Cases Triggered**:
  - `ListEventsQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Calendar Board          [ Today ] [ < ] Oct 2026 [ > ] |
|-------------------------------------------------------------|
| Time  | Monday Oct 12  | Tuesday Oct 13 | Wednesday Oct 14  |
|-------+----------------+----------------+-------------------|
| 09:00 |                |                |                   |
|-------+----------------+----------------+-------------------|
| 10:00 | [ Q3 Planning ]|                |                   |
|       | 10:00 - 11:30  |                |                   |
|-------+----------------+----------------+-------------------|
| 11:00 |                |                | [ !! CONFLICT !! ]|
|       |                |                | [ Team Catchup  ] |
|-------+----------------+----------------+-------------------|
| 12:00 |                | [ Lunch Sync ] | [ Lunch Sync    ] |
+-------------------------------------------------------------+
```

---

### Screen 2: Event Details Drawer
- **Purpose**: Inspect scheduling metadata, manage event-specific reminder offsets, and reschedule or cancel events.
- **Main Components**:
  - Event title, description, and status indicator (Scheduled, Deleted).
  - Time Range labels (Start / End times).
  - Reminders List displaying configured offsets (e.g. "15 minutes before", "1 hour before") with "x" (delete) buttons.
  - Add Reminder button inline.
  - Primary actions: "Reschedule Time", "Edit Details", "Delete Event".
- **User Actions**:
  - Add or remove reminders.
  - Cancel event (triggers soft-deletion).
  - Click Reschedule (opens time inputs).
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}`
  - `POST /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders`
  - `DELETE /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}`
- **Use Cases Triggered**:
  - `GetEventQuery`
  - `UC-CAL-007: Add / Remove Reminder`
  - `UC-CAL-003: Delete Event`

#### ASCII Wireframe:
```
+------------------------------------+
| Event Details                  [X] |
|------------------------------------|
| TITLE: Q3 Planning Session         |
|------------------------------------|
| TIME:                              |
| Start: 2026-10-15 14:00            |
| End:   2026-10-15 16:00            |
|------------------------------------|
| DESCRIPTION: Quarterly planning    |
| with the engineering team.         |
|------------------------------------|
| REMINDERS:                         |
| - 15 mins before [x]               |
| - 60 mins before [x]               |
| [ + Add Reminder Offset ]          |
|------------------------------------|
| [ Reschedule ]     [ Delete Event ]|
+------------------------------------+
```

---

### Screen 3: Event Editor Modal
- **Purpose**: Gather inputs to book or reschedule a calendar slot, enforcing chronological consistency and overlap rules.
- **Main Components**:
  - Event Title text input field (required).
  - Description textarea.
  - Start Time date-time picker (required).
  - End Time date-time picker (required).
  - Reminders lead-time tags selector (multiple minute offsets selection).
  - Actions: "Save Event", "Cancel".
- **User Actions**:
  - Input event data.
  - Set start and end times.
  - Submit form.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/calendar/events`
  - `POST /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reschedule`
  - `PATCH /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}`
- **Use Cases Triggered**:
  - `UC-CAL-001: Create Calendar Event`
  - `UC-CAL-002: Reschedule Event`
  - `UC-CAL-006: Update Event Metadata`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
|                                                             |
|                 +---------------------------+               |
|                 |      Create Event         |               |
|                 +---------------------------+               |
|                 | Title: *                  |               |
|                 | [ Q3 Planning             ]               |
|                 |                           |               |
|                 | Start Time:               |               |
|                 | [ 2026-10-15 14:00      ] |               |
|                 |                           |               |
|                 | End Time:                 |               |
|                 | [ 2026-10-15 16:00      ] |               |
|                 |                           |               |
|                 | Reminders (min offset):   |               |
|                 | [ 15 ] [ 60 ] [ + Add ]   |               |
|                 |                           |               |
|                 |     [ Save ]   [ Cancel ] |               |
|                 +---------------------------+               |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 4: Active Reminder Toast Alert
- **Purpose**: Provide real-time UI notification when a scheduled reminder threshold triggers.
- **Main Components**:
  - Alert title: "Upcoming Event Reminder".
  - Details label showing event title and starting time (e.g. "Q3 Planning starts in 15 minutes").
  - Snooze duration selector dropdown (defaults to 5 minutes).
  - Actions: "Dismiss" (acknowledged alert) and "Snooze".
- **User Actions**:
  - Dismiss the reminder.
  - Snooze the reminder.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}/dismiss`
  - `POST /api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}/snooze`
- **Use Cases Triggered**:
  - `UC-CAL-004: Manage Reminders (Snooze or Dismiss)`

#### ASCII Wireframe:
```
+------------------------------------+
| [i] Upcoming Event Reminder        |
|------------------------------------|
| "Q3 Planning" starts in 15 mins.   |
|                                    |
| Snooze for: [ 5 mins           v]  |
|                                    |
|         [ Snooze ]    [ Dismiss ]  |
+------------------------------------+
```

---

## 4. User Flows

### 1. Overlap Prevention Flow
1. User attempts to book a meeting from 2:00 PM to 3:00 PM on October 15.
2. In the background, the UI calls Memory context to evaluate the user preference `preventCalendarOverlap`.
3. If true, the API checks for conflicting active events in the workspace.
4. If a conflict exists, the API rejects the request with status `409 Conflict` (Code `CalendarEventConflictDetected`).
5. UI halts the modal closing, displays a prominent validation error: "Schedule overlap. This slot conflicts with an existing event: Q3 Planning."
6. User adjusts start time to 3:00 PM and clicks Save. The request commits successfully.

### 2. Reminder Lifecycle (Trigger -> Snooze -> Dismiss)
1. System poll tick (`UC-CAL-005`) determines that a reminder for "Q3 Planning" is due.
2. The system publishes `ReminderTriggered` event.
3. The UI receives the event via WebSocket / Server-Sent Events (SSE) and opens the **Reminder Toast Alert** in the corner.
4. User clicks "Snooze" (snooze timer = 10 mins).
5. UI makes a `POST /reminders/{id}/snooze` call, rescheduling the trigger time. The toast dismisses.
6. 10 minutes later, the reminder triggers again, rendering a new toast.
7. User click "Dismiss".
8. UI makes a `POST /reminders/{id}/dismiss` call, permanently muting that reminder.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Calendar Board** | Browse grid range | `GET /api/v1/workspaces/{workspaceId}/calendar/events` | `Query: ListEventsQuery` |
| **Event Details** | Load event details | `GET /api/v1/workspaces/{workspaceId}/calendar/events/{id}` | `Query: GetEventQuery` |
| **Event Details** | Click Delete | `DELETE /api/v1/workspaces/{workspaceId}/calendar/events/{id}` | `UC-CAL-003: Delete Event` |
| **Event Details** | Add a reminder offset | `POST /api/v1/workspaces/{workspaceId}/calendar/events/{id}/reminders` | `UC-CAL-007: Add Reminder` |
| **Event Details** | Remove a reminder offset| `DELETE /api/v1/workspaces/{workspaceId}/calendar/events/{id}/reminders/{remId}` | `UC-CAL-007: Remove Reminder` |
| **Event Editor Modal**| Save new event details | `POST /api/v1/workspaces/{workspaceId}/calendar/events` | `UC-CAL-001: Create Event` |
| **Event Editor Modal**| Reschedule time window | `POST /api/v1/workspaces/{workspaceId}/calendar/events/{id}/reschedule` | `UC-CAL-002: Reschedule Event` |
| **Event Editor Modal**| Edit title / details | `PATCH /api/v1/workspaces/{workspaceId}/calendar/events/{id}` | `UC-CAL-006: Update Metadata` |
| **Reminder Alert** | Click Snooze | `POST /api/v1/workspaces/{workspaceId}/calendar/events/{id}/reminders/{remId}/snooze` | `UC-CAL-004: Snooze Reminder`|
| **Reminder Alert** | Click Dismiss | `POST /api/v1/workspaces/{workspaceId}/calendar/events/{id}/reminders/{remId}/dismiss` | `UC-CAL-004: Dismiss Reminder`|

---

## 6. Screen ↔ Context Mapping

- **Calendar Bounded Context** owns all 4 screens and event time-blocking workflows.
- **Memory Context** owns preferences (`preventCalendarOverlap`, `leadTimeMinutes`), which are fetched by Calendar during creation / rescheduling commands.
- **Notification Context** listens for `ReminderTriggered` events and handles email or Slack dispatch cascading, but the in-app popup maps directly to the Calendar snooze/dismiss endpoints.
- **AI Agent** accesses the Calendar domain via the `CalendarPort` to schedule and verify blocks during goal executions.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Chronological Grid Navigation**:
   - The calendar board must support full keyboard navigation (arrow keys to move between days/weeks).
   - Time-blocked event cards must have proper labels expressing starting and ending times (e.g. `aria-label="Event: Q3 Planning, starts October 15 at 2:00 PM, ends at 4:00 PM"`).
2. **Reminder Alert Focus Trap**:
   - Triggered reminder toasts or modal popup windows must behave like focus dialogs, moving focus to "Snooze" or "Dismiss" immediately upon generation.
3. **Status Semantics**:
   - Collision/conflict warning flags on overlapping blocks must be announced using screen-reader live alerts: `<div aria-live="assertive">`.

### Mobile Responsiveness Notes
1. **Grid to List Layout**: On viewports <= 600px, the multi-column day/week grid collapses to a chronological scrollable agenda list.
2. **Reminder Alert Sheets**: The reminder alert popup displays as a bottom-sheet sheet component with large action buttons for thumb-clicks.
3. **Event Cards Touch targets**: Scheduled cards have a minimum clickable area to open the details drawer easily on touch screens.

