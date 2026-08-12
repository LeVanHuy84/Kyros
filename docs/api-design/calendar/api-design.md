# Executive Summary

The REST API for the **Calendar Bounded Context** provides endpoints for managing calendar events and their associated reminders. This API allows for the creation, querying, modification, and deletion of scheduled blocks of time, while enforcing business invariants such as chronological consistency and optional overlap prevention. The API operates strictly within a workspace boundary, ensuring data isolation across tenants. 

Recent updates include standardized inputs for event deletion and endpoints to dismiss reminders, ensuring complete coverage of the application command catalog.

# Resource Model

The primary resource is the `Event`, representing a scheduled commitment. Associated with an event are `Reminder` sub-resources.

- **Event**: Represents a `CalendarEvent` aggregate.
- **Reminder**: Represents a `Reminder` entity bound to an event.

URIs follow a hierarchical structure rooted in a workspace to guarantee tenant isolation:
- `/api/v1/workspaces/{workspaceId}/calendar/events`
- `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders`

# Endpoint Catalog

| Method | Path | Description | Use Case |
| ------ | ---- | ----------- | -------- |
| `POST` | `/api/v1/workspaces/{workspaceId}/calendar/events` | Create a new calendar event | UC-CAL-001 |
| `GET` | `/api/v1/workspaces/{workspaceId}/calendar/events` | List events within a time range | ListEventsQuery |
| `GET` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}` | Get a single event by ID | GetEventQuery |
| `PATCH` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}` | Update event metadata (title, description) | UC-CAL-006 |
| `DELETE`| `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}` | Delete an event | UC-CAL-003 |
| `POST` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reschedule` | Reschedule an event time range | UC-CAL-002 |
| `POST` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders` | Add a reminder | UC-CAL-007 |
| `DELETE`| `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}` | Remove a reminder | UC-CAL-007 |
| `POST` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}/snooze` | Snooze a triggered reminder | UC-CAL-004 |
| `POST` | `/api/v1/workspaces/{workspaceId}/calendar/events/{eventId}/reminders/{reminderId}/dismiss` | Dismiss a reminder | UC-CAL-004 |
| `GET` | `/api/v1/workspaces/{workspaceId}/calendar/availability` | Query availability windows in a time range | UC-CAL-010 |
| `GET` | `/api/v1/workspaces/{workspaceId}/calendar/availability/slots` | Discover available time slots of a given duration | UC-CAL-011 |

# Request Models

### CreateEventRequest
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "taskId": "string (UUID, optional)",
  "startTime": "string (ISO-8601 date-time, required)",
  "endTime": "string (ISO-8601 date-time, required)",
  "reminderOffsets": ["integer (minutes, optional)"]
}
```

### UpdateEventMetadataRequest
```json
{
  "title": "string (optional)",
  "description": "string (optional)"
}
```

### RescheduleEventRequest
```json
{
  "startTime": "string (ISO-8601 date-time, required)",
  "endTime": "string (ISO-8601 date-time, required)"
}
```

### AddReminderRequest
```json
{
  "leadTimeMinutes": "integer (positive, required)"
}
```

### QueryAvailabilityRequest
```json
{
  "rangeStart": "string (ISO-8601 date-time, required)",
  "rangeEnd": "string (ISO-8601 date-time, required)",
  "constraints": {
    "workingHoursStart": "string (ISO-8601 time-of-day, optional)",
    "workingHoursEnd": "string (ISO-8601 time-of-day, optional)",
    "minimumNoticeMinutes": "integer (positive, optional)"
  }
}
```

### DiscoverSlotsRequest
```json
{
  "rangeStart": "string (ISO-8601 date-time, required)",
  "rangeEnd": "string (ISO-8601 date-time, required)",
  "desiredDurationMinutes": "integer (positive, required)",
  "constraints": {
    "workingHoursStart": "string (ISO-8601 time-of-day, optional)",
    "workingHoursEnd": "string (ISO-8601 time-of-day, optional)",
    "minimumNoticeMinutes": "integer (positive, optional)"
  }
}
```

### SnoozeReminderRequest
```json
{
  "snoozeMinutes": "integer (positive, required)"
}
```

# Response Models

### EventDTO
```json
{
  "eventId": "string (UUID)",
  "workspaceId": "string (UUID)",
  "userId": "string (UUID)",
  "taskId": "string (UUID, optional)",
  "title": "string",
  "description": "string",
  "startTime": "string (ISO-8601 date-time)",
  "endTime": "string (ISO-8601 date-time)",
  "status": "string (Scheduled, Deleted)",
  "reminders": [
    {
      "reminderId": "string (UUID)",
      "leadTimeMinutes": "integer",
      "triggerTime": "string (ISO-8601 date-time)",
      "status": "string (Scheduled, Triggered, Snoozed, Dismissed)"
    }
  ]
}
```

### EventListResponse
```json
{
  "items": ["EventDTO"],
  "total": "integer"
}
```

### AvailabilityWindowResponse
```json
{
  "startTime": "string (ISO-8601 date-time)",
  "endTime": "string (ISO-8601 date-time)"
}
```

### AvailabilityListResponse
```json
{
  "items": ["AvailabilityWindowResponse"],
  "total": "integer"
}
```

### TimeSlotResponse
```json
{
  "startTime": "string (ISO-8601 date-time)",
  "endTime": "string (ISO-8601 date-time)",
  "durationMinutes": "integer"
}
```

### SlotListResponse
```json
{
  "items": ["TimeSlotResponse"],
  "total": "integer"
}
```

# Validation Rules

1. **Path Parameters**: `workspaceId`, `eventId`, and `reminderId` must be valid UUID formats.
2. **Time Range**: `startTime` must be non-null and `endTime` must be strictly after `startTime`.
3. **Title**: Cannot be empty, null, or only whitespace.
4. **Reminders**: `leadTimeMinutes` and `snoozeMinutes` must be strictly positive integers.
5. **Overlap Policy**: If the user's `preventCalendarOverlap` preference is true, event creation and rescheduling will fail if the time range overlaps with active events in the workspace.
6. **Deletion**: Deleting an already deleted event returns 204 or 404 (idempotent operation).
7. **Availability Queries**: `rangeEnd` must be strictly after `rangeStart`. `desiredDurationMinutes` must be positive.
8. **Constraints**: `workingHoursEnd` must be after `workingHoursStart` when both are provided. `minimumNoticeMinutes` must be non-negative.

# Error Model

Standard API errors are returned using the RFC 7807 Problem Details for HTTP APIs format.

### ErrorResponse
```json
{
  "type": "string (URI identifying problem type)",
  "title": "string (Short summary of the problem)",
  "status": "integer (HTTP status code)",
  "detail": "string (Human-readable explanation)",
  "instance": "string (URI of the specific occurrence)",
  "invalidParams": [
    {
      "name": "string",
      "reason": "string"
    }
  ]
}
```

Common status codes:
- `400 Bad Request`: Validation failure (e.g. `endTime` before `startTime`).
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Insufficient workspace permissions.
- `404 Not Found`: Event or Reminder not found.
- `409 Conflict`: Schedule overlap violation (`CalendarEventConflictDetected`).

# Pagination

The `GET /api/v1/workspaces/{workspaceId}/calendar/events` endpoint is primarily time-bounded. However, standard pagination is applied to avoid massive payloads over large time windows.
- **Query Params**: `page` (default 0), `size` (default 50, max 100).
- Responses include a `total` field indicating the total number of events matching the query.

# Authentication

All endpoints require a valid JWT token passed in the `Authorization` header as a Bearer token.
- `Authorization: Bearer <jwt-token>`
The identity context (`UserId`) is extracted from the authenticated token and implicitly passed into domain commands.

# Authorization

The user must have active membership in the specified `workspaceId` (enforced via `TenantValidationPort` at the gateway level). Attempting to access or mutate events in a workspace where the user lacks membership will result in a `403 Forbidden`.

# Example Requests

### Create Event
```http
POST /api/v1/workspaces/w-123/calendar/events HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Q3 Planning",
  "description": "Quarterly planning session with the team.",
  "taskId": "t-111",
  "startTime": "2026-10-15T14:00:00Z",
  "endTime": "2026-10-15T16:00:00Z",
  "reminderOffsets": [15, 60]
}
```

### Dismiss Reminder
```http
POST /api/v1/workspaces/w-123/calendar/events/e-456/reminders/r-789/dismiss HTTP/1.1
Authorization: Bearer <token>
```

### Delete Event
```http
DELETE /api/v1/workspaces/w-123/calendar/events/e-456 HTTP/1.1
Authorization: Bearer <token>
```

### Query Availability
```http
GET /api/v1/workspaces/w-123/calendar/availability?rangeStart=2026-10-15T00:00:00Z&rangeEnd=2026-10-16T00:00:00Z&workingHoursStart=09:00:00Z&workingHoursEnd=18:00:00Z HTTP/1.1
Authorization: Bearer <token>
```

### Discover Slots
```http
GET /api/v1/workspaces/w-123/calendar/availability/slots?rangeStart=2026-10-15T00:00:00Z&rangeEnd=2026-10-16T00:00:00Z&desiredDurationMinutes=60&workingHoursStart=09:00:00Z&workingHoursEnd=18:00:00Z&minimumNoticeMinutes=120 HTTP/1.1
Authorization: Bearer <token>
```

# Example Responses

### 201 Created (Create Event)
```http
HTTP/1.1 201 Created
Location: /api/v1/workspaces/w-123/calendar/events/e-456
Content-Type: application/json

{
  "eventId": "e-456",
  "workspaceId": "w-123",
  "userId": "u-999",
  "taskId": "t-111",
  "title": "Q3 Planning",
  "description": "Quarterly planning session with the team.",
  "startTime": "2026-10-15T14:00:00Z",
  "endTime": "2026-10-15T16:00:00Z",
  "status": "Scheduled",
  "reminders": [
    {
      "reminderId": "r-789",
      "leadTimeMinutes": 15,
      "triggerTime": "2026-10-15T13:45:00Z",
      "status": "Scheduled"
    },
    {
      "reminderId": "r-790",
      "leadTimeMinutes": 60,
      "triggerTime": "2026-10-15T13:00:00Z",
      "status": "Scheduled"
    }
  ]
}
```

### 409 Conflict (Overlap Violation)
```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://api.assistant.com/errors/calendar-overlap",
  "title": "Schedule Overlap",
  "status": 409,
  "detail": "The requested time range overlaps with an existing active event.",
  "instance": "/api/v1/workspaces/w-123/calendar/events"
}
```

### 200 OK (Query Availability)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "startTime": "2026-10-15T09:00:00Z",
      "endTime": "2026-10-15T10:00:00Z"
    },
    {
      "startTime": "2026-10-15T11:30:00Z",
      "endTime": "2026-10-15T12:30:00Z"
    }
  ],
  "total": 2
}
```

### 200 OK (Discover Slots)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "startTime": "2026-10-15T09:00:00Z",
      "endTime": "2026-10-15T10:00:00Z",
      "durationMinutes": 60
    },
    {
      "startTime": "2026-10-15T11:30:00Z",
      "endTime": "2026-10-15T12:30:00Z",
      "durationMinutes": 60
    }
  ],
  "total": 2
}
```
