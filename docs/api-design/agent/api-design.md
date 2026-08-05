# Executive Summary

The AI Agent bounded context manages the cognitive orchestration of the AI Executive Assistant. This includes parsing high-level goals into execution plans, acquiring explicit user approval for execution, running the plan against a registered set of tools, handling automated re-planning upon tool failures, and answering grounded questions. 

This API design applies the architecture and domain guidelines constraints:
- Explicitly models the Agent execution loop (Reason -> Plan -> Approve -> Execute -> Reflect) as a Process Manager by decoupling the `AgentSession` tracking and the asynchronous `ApprovalRequest` lifecycle.
- Follows the recommended port segregation (CQRS), ensuring write operations for agent sessions (`AgentSessionCommandPort`), read/query operations (`AgentQueryPort`), and approval actions (`ApprovalRequestPort`) are properly segregated and exposed.

# Resource Model

The REST API is strictly organized around the aggregate roots defined in the domain:
- **Session**: Represents an `AgentSession`. It captures the user's high-level goal, current status (`Planning`, `AwaitingApproval`, `Executing`, etc.), and the directed acyclic graph (DAG) of execution steps (`PlanStep`).
- **Approval**: Represents an `ApprovalRequest`. It acts as an explicit human-in-the-loop checkpoint before plan execution can proceed.
- **QA**: Represents the read-only grounded query capabilities (from `AgentQueryPort`).

# Endpoint Catalog

All endpoints are relative to the base URL: `/api/v1/workspaces/{workspaceId}/agent`

| Method | Path | Description | Use Case |
|---|---|---|---|
| POST | `/sessions` | Submit a new goal and initiate planning | UC-AGENT-001 |
| GET | `/sessions` | List agent sessions (with optional status filters) | Query |
| GET | `/sessions/active` | Get the currently active agent session (if any) | Query |
| GET | `/sessions/{sessionId}` | Retrieve details of a specific session and its plan steps | Query |
| GET | `/approvals` | List pending approval requests | Query |
| GET | `/approvals/{approvalId}` | Retrieve a specific approval request | Query |
| POST | `/approvals/{approvalId}/resolve` | Resolve (approve or reject) a pending approval | UC-AGENT-002 |
| POST | `/qa` | Ask a grounded question using workspace context | UC-AGENT-006 |

# Request Models

### SubmitGoalRequest
```json
{
  "goalText": "string"
}
```

### ResolveApprovalRequest
```json
{
  "resolution": "string (Approved | Rejected)"
}
```

### AskGroundedQuestionRequest
```json
{
  "questionText": "string"
}
```

# Response Models

### AgentSessionResponse
```json
{
  "sessionId": "string (UUID)",
  "workspaceId": "string (UUID)",
  "goal": "string",
  "status": "string (Planning | AwaitingApproval | Executing | Succeeded | Failed | Escalated)",
  "replanCount": "integer",
  "steps": [
    {
      "stepId": "string (UUID)",
      "toolName": "string",
      "parameters": {
        "key": "value"
      },
      "status": "string (Pending | Running | Succeeded | Failed)"
    }
  ]
}
```

### SessionListResponse
```json
{
  "data": [
    {
       "sessionId": "string (UUID)",
       "workspaceId": "string (UUID)",
       "goal": "string",
       "status": "string",
       "replanCount": "integer",
       "steps": []
    }
  ],
  "page": "integer",
  "size": "integer",
  "totalElements": "integer",
  "totalPages": "integer"
}
```

### ApprovalRequestResponse
```json
{
  "approvalId": "string (UUID)",
  "sessionId": "string (UUID)",
  "workspaceId": "string (UUID)",
  "status": "string (Pending | Approved | Rejected | Expired)",
  "expiresAt": "string (ISO 8601 UTC timestamp, optional)",
  "planSnapshot": [
    {
      "stepId": "string (UUID)",
      "toolName": "string",
      "description": "string"
    }
  ]
}
```

### ApprovalListResponse
```json
{
  "data": [
    {
       "approvalId": "string (UUID)",
       "sessionId": "string (UUID)",
       "workspaceId": "string (UUID)",
       "status": "string",
       "expiresAt": "string",
       "planSnapshot": []
    }
  ],
  "page": "integer",
  "size": "integer",
  "totalElements": "integer",
  "totalPages": "integer"
}
```

### GroundedAnswerResponse
```json
{
  "answerText": "string",
  "citations": [
    {
      "documentId": "string",
      "sourceType": "string",
      "snippetText": "string"
    }
  ]
}
```

# Validation Rules

- `workspaceId`, `sessionId`, `approvalId`: Must be valid non-empty UUIDs.
- `goalText`: Cannot be blank. Length must be between 5 and 1000 characters.
- `resolution`: Must be strictly `"Approved"` or `"Rejected"`.
- `questionText`: Cannot be blank. Length must be between 5 and 1000 characters.
- Path parameter `workspaceId` must match the authenticated context workspace.

# Error Model

The API returns standardized problem details (RFC 7807) on error.

```json
{
  "type": "https://api.assistant.com/errors/invalid-request",
  "title": "Invalid Request",
  "status": 400,
  "detail": "The provided resolution is invalid.",
  "instance": "/api/v1/workspaces/123e4567-e89b-12d3-a456-426614174000/agent/approvals/123e4567-e89b-12d3-a456-426614174001/resolve",
  "errors": [
    {
      "field": "resolution",
      "message": "Must be 'Approved' or 'Rejected'."
    }
  ]
}
```

Standard Status Codes:
- `400 Bad Request`: Validation failure on the request payload.
- `401 Unauthorized`: Missing, expired, or invalid token.
- `403 Forbidden`: The actor is not authorized in this workspace, or they are resolving an approval that is not in `Pending` state.
- `404 Not Found`: Session or Approval ID not found.
- `409 Conflict`: Attempting to execute state-changing actions on a terminal session state, or invariants broken.
- `422 Unprocessable Entity`: Business invariant violations (e.g., trying to resolve an already resolved/expired approval).
- `500 Internal Server Error`: Unhandled system exceptions.

# Pagination

Endpoints returning lists (GET `/sessions`, GET `/approvals`) use standard query-parameter pagination:
- `page`: 0-indexed page number (default: 0).
- `size`: Number of records per page (default: 20, max: 100).
Pagination metadata is included in the response payloads (`page`, `size`, `totalElements`, `totalPages`).

# Authentication

- Every endpoint requires a valid JWT Bearer token passed in the `Authorization` header (`Authorization: Bearer <token>`).
- The token is validated at the API Gateway before routing to the application services.

# Authorization

- The `workspaceId` extracted from the path must map to a workspace where the authenticated user (identified by the JWT subject `userId`) is an active member.
- Rejection of unauthorized cross-workspace requests results in a `403 Forbidden` response.
- All actions respect RBAC policies tied to the actor's workspace context.

# Example Requests

### POST Submit Goal
```http
POST /api/v1/workspaces/c9a22d4f-3a21-4f18-bb53-6c8430b8b211/agent/sessions HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "goalText": "Schedule a meeting with John tomorrow at 2 PM to discuss the Q3 report, and email him a summary beforehand."
}
```

### POST Resolve Approval
```http
POST /api/v1/workspaces/c9a22d4f-3a21-4f18-bb53-6c8430b8b211/agent/approvals/8b3d6f1a-5b12-4f33-90d2-1c2436d4b299/resolve HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "resolution": "Approved"
}
```

### POST Ask Grounded Question
```http
POST /api/v1/workspaces/c9a22d4f-3a21-4f18-bb53-6c8430b8b211/agent/qa HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "questionText": "What are my main deliverables for this week based on recent emails and tasks?"
}
```

# Example Responses

### Created Session Response (201 Created)
```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/workspaces/c9a22d4f-3a21-4f18-bb53-6c8430b8b211/agent/sessions/3e2b34a1-8d2b-4567-a2f2-9871ab12cdef

{
  "sessionId": "3e2b34a1-8d2b-4567-a2f2-9871ab12cdef",
  "workspaceId": "c9a22d4f-3a21-4f18-bb53-6c8430b8b211",
  "goal": "Schedule a meeting with John tomorrow at 2 PM...",
  "status": "Planning",
  "replanCount": 0,
  "steps": []
}
```

### Resolved Approval Response (200 OK)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "approvalId": "8b3d6f1a-5b12-4f33-90d2-1c2436d4b299",
  "sessionId": "3e2b34a1-8d2b-4567-a2f2-9871ab12cdef",
  "workspaceId": "c9a22d4f-3a21-4f18-bb53-6c8430b8b211",
  "status": "Approved",
  "expiresAt": "2026-08-04T12:00:00Z",
  "planSnapshot": [
    {
      "stepId": "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
      "toolName": "CalendarPort.createEvent",
      "description": "Schedule meeting with John for tomorrow at 2 PM"
    }
  ]
}
```

### Grounded Answer Response (200 OK)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "answerText": "Your main deliverables for this week are the Q3 Performance Report and finalizing the API Design document.",
  "citations": [
    {
      "documentId": "task-9876",
      "sourceType": "TodoTask",
      "snippetText": "Complete Q3 Performance Report by Thursday."
    },
    {
      "documentId": "memory-entry-1234",
      "sourceType": "SemanticMemory",
      "snippetText": "User prefers finishing API designs before Wednesdays."
    }
  ]
}
```
