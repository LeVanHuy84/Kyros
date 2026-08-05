# Executive Summary

The Memory REST API exposes the Application Layer of the Memory bounded context. It provides endpoints to manage conversation history, user preferences, and long-term semantic memory entries. The API conforms strictly to the modular monolith architecture, ensuring that all interactions are tenant-scoped (by `workspaceId`), and the authenticated user's identity is derived from the security context. This API adheres to the principle of memory isolation, meaning it does not have any outbound dependencies on the AI Agent, but instead provides a robust foundation for the Agent and other contexts to query and store user context.

# Resource Model

- **Conversation (`/workspaces/{workspaceId}/conversations`)**: Represents a multi-turn chat interaction thread between a User and the AI Agent. Includes the ability to append turns and clear history.
- **ConversationTurn (`/workspaces/{workspaceId}/conversations/{conversationId}/turns`)**: Represents a single discrete message exchange step within a Conversation.
- **UserPreferences (`/workspaces/{workspaceId}/preferences`)**: Represents configuration profiles per user workspace (e.g., timezone, default task priority, calendar overlap preferences).
- **MemoryEntry (`/workspaces/{workspaceId}/memory-entries`)**: Represents long-term semantic facts extracted from conversation history.

# Endpoint Catalog

## Conversations
- `POST /api/v1/workspaces/{workspaceId}/conversations`
  - **Purpose**: Start a new conversation.
- `GET /api/v1/workspaces/{workspaceId}/conversations`
  - **Purpose**: List conversations for the user in the workspace.
- `GET /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/turns`
  - **Purpose**: Fetch recent conversation history.
- `POST /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/turns`
  - **Purpose**: Append a new conversation turn.
- `POST /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/clear`
  - **Purpose**: Clear all message history for a conversation.

## User Preferences
- `GET /api/v1/workspaces/{workspaceId}/preferences`
  - **Purpose**: Fetch the user's preferences for the current workspace.
- `PUT /api/v1/workspaces/{workspaceId}/preferences`
  - **Purpose**: Update the user's preferences.
- `POST /api/v1/workspaces/{workspaceId}/preferences/reset`
  - **Purpose**: Reset the user's preferences to system defaults.

## Semantic Memory
- `GET /api/v1/workspaces/{workspaceId}/memory-entries`
  - **Purpose**: List or search semantic memory entries.
- `GET /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}`
  - **Purpose**: Fetch a specific memory entry.
- `PUT /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}`
  - **Purpose**: Revise a memory entry.
- `DELETE /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}`
  - **Purpose**: Delete a memory entry.

# Request Models

```json
// POST /api/v1/workspaces/{workspaceId}/conversations
{
  "sessionId": "string (UUID, optional)"
}

// POST /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/turns
{
  "senderRole": "string (User | Agent)",
  "messageContent": "string (Non-blank)"
}

// PUT /api/v1/workspaces/{workspaceId}/preferences
{
  "timezone": "string (IANA timezone, e.g. America/New_York)",
  "defaultPriority": "string (High | Medium | Low)",
  "preventCalendarOverlap": "boolean",
  "leadTimeMinutes": "integer (positive)"
}

// PUT /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}
{
  "content": "string (Non-blank)"
}
```

# Response Models

```json
// Conversation Summary (GET /conversations)
{
  "id": "string (UUID)",
  "workspaceId": "string (UUID)",
  "title": "string",
  "lastTurnTimestamp": "string (ISO-8601)",
  "status": "string (Active | Cleared | Archived)"
}

// Conversation Turn (GET /turns, POST /turns)
{
  "id": "string (UUID)",
  "role": "string (User | Agent)",
  "content": "string",
  "timestamp": "string (ISO-8601)"
}

// Preferences (GET /preferences, PUT /preferences)
{
  "workspaceId": "string (UUID)",
  "userId": "string (UUID)",
  "timezone": "string",
  "defaultPriority": "string",
  "preventCalendarOverlap": "boolean",
  "leadTimeMinutes": "integer"
}

// Memory Entry (GET /memory-entries)
{
  "id": "string (UUID)",
  "workspaceId": "string (UUID)",
  "content": "string",
  "confidenceScore": "number (0.0 to 1.0)",
  "createdAt": "string (ISO-8601)",
  "updatedAt": "string (ISO-8601)"
}
```

# Validation Rules

1. **Workspace Tenancy Scope**: `workspaceId` in the URI must match the current authenticated user's workspace authorization.
2. **Chronological Messaging**: When appending a conversation turn, the generated timestamp must be strictly greater than the conversation's `lastTurnTimestamp`.
3. **Preference Bounds**:
   - `timezone` must be a valid IANA Timezone Database identifier.
   - `defaultPriority` must be one of `High`, `Medium`, or `Low`.
   - `leadTimeMinutes` must be a positive integer, max 10080 (7 days).
4. **Non-Empty Content**: `messageContent` and memory `content` cannot be blank or empty after trimming.
5. **Archived Conversations**: If a conversation is in `Archived` state, `POST /turns` and `POST /clear` will return a `409 Conflict` error.

# Error Model

```json
{
  "errorId": "string (UUID for tracing)",
  "status": "integer (HTTP Status Code)",
  "code": "string (Domain specific error code, e.g., MEMORY_ENTRY_NOT_FOUND)",
  "message": "string (Human-readable description)",
  "details": [
    {
      "field": "string (Optional, for validation errors)",
      "issue": "string"
    }
  ],
  "timestamp": "string (ISO-8601)"
}
```

### Common Error Codes:
- `400 Bad Request`: `VALIDATION_FAILED`, `INVALID_TIMEZONE`
- `401 Unauthorized`: `UNAUTHORIZED`
- `403 Forbidden`: `WORKSPACE_ACCESS_DENIED`
- `404 Not Found`: `CONVERSATION_NOT_FOUND`, `MEMORY_ENTRY_NOT_FOUND`
- `409 Conflict`: `CONVERSATION_ARCHIVED`, `INVALID_TIMESTAMP_ORDER`
- `422 Unprocessable Entity`: `SENSITIVE_DATA_REJECTED` (for memory extraction/updates)

# Pagination

- **`GET /api/v1/workspaces/{workspaceId}/conversations`**: Offset-based pagination using `page` (default 0) and `size` (default 20, max 100).
- **`GET /api/v1/workspaces/{workspaceId}/memory-entries`**: Offset-based pagination using `page` and `size`.
- **`GET /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/turns`**: Offset-based pagination or limit-based retrieval (e.g. `?limit=50`). Often ordered descending by timestamp and reversed on the client, or returned oldest-first with pagination.

**Standard Pagination Meta in Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3
  }
}
```

# Authentication

All endpoints require standard user authentication. The platform expects a valid identity token (e.g., Bearer JWT) in the `Authorization` header.
Authentication validation is handled at the API Gateway / Auth Context level. The thread-local security context will contain the authenticated `userId`.

# Authorization

- The `workspaceId` provided in the path must match a workspace where the authenticated `userId` is an active member.
- The system uses a `TenantValidationPort` at the gateway layer to ensure cross-workspace reads or writes are strictly prohibited.
- Endpoints operating on `UserPreferences` implicitly operate on the composite key `(workspaceId, userId)` using the `userId` from the security context, ensuring a user cannot read or modify another user's preferences even within the same workspace.

# Example Requests

### Append a Conversation Turn
```http
POST /api/v1/workspaces/ws-1234/conversations/conv-5678/turns
Authorization: Bearer <token>
Content-Type: application/json

{
  "senderRole": "User",
  "messageContent": "Can you summarize my meetings for today?"
}
```

### Update User Preferences
```http
PUT /api/v1/workspaces/ws-1234/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "timezone": "America/Los_Angeles",
  "defaultPriority": "High",
  "preventCalendarOverlap": true,
  "leadTimeMinutes": 10
}
```

### Search Semantic Memory Entries
```http
GET /api/v1/workspaces/ws-1234/memory-entries?query=favorite+coffee&size=5
Authorization: Bearer <token>
```

# Example Responses

### Success: Append a Conversation Turn
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "turn-9999",
  "role": "User",
  "content": "Can you summarize my meetings for today?",
  "timestamp": "2026-08-02T19:55:00Z"
}
```

### Success: Update User Preferences
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "workspaceId": "ws-1234",
  "userId": "user-8888",
  "timezone": "America/Los_Angeles",
  "defaultPriority": "High",
  "preventCalendarOverlap": true,
  "leadTimeMinutes": 10
}
```

### Error: Missing/Invalid Timezone
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errorId": "err-5555",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Invalid preference values provided.",
  "details": [
    {
      "field": "timezone",
      "issue": "Must be a valid IANA Timezone Database identifier."
    }
  ],
  "timestamp": "2026-08-02T19:56:00Z"
}
```
