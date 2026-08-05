# API Design Specification — Todo Bounded Context

## Executive Summary
This document outlines the REST API design for the Todo Bounded Context, which is the system of record for task lifecycle management, priority classification, tagging, and automated recurrence scheduling. This API allows the UI, external integrations (via Connector Hub), and the AI Agent (via tools) to manage tasks, their lifecycles (including completion, soft-deletion, and recovery), and recurrence schedules. 

## Resource Model
- **Task**: The core resource representing a discrete unit of work, mapped to a specific Workspace.
- **Tag**: A sub-resource representing a classification label for a task.
- **Recurrence**: A sub-resource representing the repeat schedule (daily, weekly, monthly pattern) for a parent task.

Base path: `/api/v1/workspaces/{workspaceId}`

## Endpoint Catalog

### Tasks
- `POST /tasks` - Create a new task (UC-TODO-001)
- `GET /tasks` - List and filter tasks (UC-TODO-011)
- `GET /tasks/deleted` - List deleted tasks eligible for recovery
- `GET /tasks/{taskId}` - Get a task by ID
- `PUT /tasks/{taskId}` - Update task details (UC-TODO-002)
- `DELETE /tasks/{taskId}` - Soft-delete a task (UC-TODO-003)
- `POST /tasks/{taskId}/recover` - Recover a soft-deleted task (UC-TODO-004)
- `POST /tasks/{taskId}/complete` - Mark a task as completed (UC-TODO-005)
- `POST /tasks/{taskId}/reopen` - Reopen a completed task (UC-TODO-010)

### Task Tags
- `POST /tasks/{taskId}/tags` - Add tags to a task (UC-TODO-008)
- `DELETE /tasks/{taskId}/tags/{tag}` - Remove a specific tag from a task (UC-TODO-008)

### Task Recurrence
- `GET /tasks/{taskId}/recurrence` - Get recurrence template details
- `PUT /tasks/{taskId}/recurrence` - Configure/attach recurrence pattern (TODO-003 AC)
- `POST /tasks/{taskId}/recurrence/pause` - Pause recurrence generation (UC-TODO-009)
- `POST /tasks/{taskId}/recurrence/resume` - Resume recurrence generation (UC-TODO-009)
- `POST /tasks/{taskId}/recurrence/stop` - Permanently stop recurrence generation (UC-TODO-009)

## Request Models

### CreateTaskRequest
```json
{
  "title": "Finalize Q3 Report",
  "description": "Include financial summaries and team KPIs.",
  "priority": "High", 
  "dueDate": "2026-08-10T17:00:00Z",
  "tags": ["work", "finance"]
}
```
*Note: `priority` is optional and defaults to "Medium". `description`, `dueDate`, and `tags` are optional.*

### UpdateTaskRequest
```json
{
  "title": "Finalize Q3 Report (Draft)",
  "description": "Updated scope to only include Q3.",
  "priority": "Medium",
  "dueDate": "2026-08-15T17:00:00Z",
  "version": 2
}
```
*Note: `version` used for optimistic locking.*

### AddTagsRequest
```json
{
  "tags": ["urgent", "review"]
}
```

### ConfigureRecurrenceRequest
```json
{
  "pattern": "WEEKLY",
  "interval": 1
}
```

## Response Models

### TaskResponse
```json
{
  "taskId": "task-uuid",
  "workspaceId": "workspace-uuid",
  "parentTaskId": "parent-task-uuid-or-null",
  "title": "Finalize Q3 Report",
  "description": "Include financial summaries and team KPIs.",
  "priority": "High",
  "tags": ["work", "finance"],
  "dueDate": "2026-08-10T17:00:00Z",
  "lifecycleStatus": "Active",
  "version": 1,
  "createdAt": "2026-08-02T19:00:00Z",
  "updatedAt": "2026-08-02T19:00:00Z"
}
```

### TaskListResponse
```json
{
  "items": [
    { /* TaskResponse objects */ }
  ],
  "totalItems": 1,
  "page": 1,
  "pageSize": 50,
  "totalPages": 1
}
```

### RecurrenceTemplateResponse
```json
{
  "taskId": "task-uuid",
  "pattern": "WEEKLY",
  "interval": 1,
  "lastGeneratedOccurrence": "2026-08-02T10:00:00Z",
  "recurrenceStatus": "Active"
}
```

## Validation Rules
- **Title**: Must be non-empty and non-whitespace after trimming.
- **Priority**: Must be one of `High`, `Medium`, `Low`. Defaults to `Medium` if unspecified on creation.
- **Tags**: Values must be case-sensitive, non-empty, non-whitespace strings. Max length 50 chars per tag. 
- **Recurrence Pattern**: Must be one of `DAILY`, `WEEKLY`, `MONTHLY`. Optional interval must be positive (default: 1).
- **Soft-Deleted Operations**: Mutating operations (`update`, `complete`, `tags`, etc.) are prohibited on `SoftDeleted` tasks.
- **Optimistic Locking**: `PUT` operations on tasks should include a `version` field to avoid concurrent update conflicts.

## Error Model
Standardized JSON error response:
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Task title cannot be empty",
  "timestamp": "2026-08-02T19:50:00Z",
  "details": {
    "field": "title",
    "issue": "must not be blank"
  }
}
```
**Common Error Codes**:
- `400 Bad Request`: Validation failure (e.g. invalid recurrence pattern, blank title).
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Workspace boundary violation (accessing task from another workspace).
- `404 Not Found`: Task does not exist.
- `409 Conflict`: Optimistic locking failure (version mismatch), or overlapping task instances (for recurrence collisions).
- `410 Gone`: Hard-deleted / purged task.
- `422 Unprocessable Entity`: Business invariant violation (e.g. trying to pause an inactive recurrence).

## Pagination
List endpoints (`GET /tasks`) support cursor-based or offset-based pagination.
Query Parameters:
- `page`: Page number (1-indexed). Default: 1.
- `pageSize`: Number of items per page. Default: 50. Max: 100.

## Authentication
Every request must be authenticated via the Identity context. 
The system requires an active JWT bearer token (`Authorization: Bearer <token>`).

## Authorization
- Endpoints are scoped to a single `workspaceId`. 
- The `TenantValidationPort` (or API Gateway) verifies that the authenticated user possesses valid membership in the specified `workspaceId`. If the user does not have access, a `403 Forbidden` response is returned. Cross-workspace data access is strictly prohibited.

## Example Requests

### Create Task
```http
POST /api/v1/workspaces/ws-123/tasks HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Prepare budget",
  "priority": "High"
}
```

### Complete Task
```http
POST /api/v1/workspaces/ws-123/tasks/task-456/complete HTTP/1.1
Authorization: Bearer <token>
```

## Example Responses

### Create Task Response (201 Created)
```http
HTTP/1.1 201 Created
Location: /api/v1/workspaces/ws-123/tasks/task-uuid
Content-Type: application/json

{
  "taskId": "task-uuid",
  "workspaceId": "ws-123",
  "title": "Prepare budget",
  "priority": "High",
  "tags": [],
  "lifecycleStatus": "Active",
  "version": 1,
  "createdAt": "2026-08-02T19:55:00Z"
}
```

### Conflict (409) on concurrent update
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "errorCode": "CONCURRENCY_CONFLICT",
  "message": "The task was modified by another request. Please reload and try again.",
  "timestamp": "2026-08-02T19:55:05Z"
}
```
