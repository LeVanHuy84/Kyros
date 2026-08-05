# Executive Summary

The **Connector Bounded Context** REST API manages the integration of external third-party services (e.g., Google Calendar, Jira, GitHub) with the AI Executive Assistant. This API provides a suite of endpoints for connection lifecycle management, manual synchronization orchestration (which runs as a Saga), and conflict resolution. It adheres to the system's modular-monolith and hexagonal architecture guidelines, ensuring that operations are strictly tenant-isolated and properly authorized.

# Resource Model

- **Connection**: Represents a configured and authorized instance of a third-party integration associated with a workspace. It holds status, sync mode, filtering rules, and rate-limiting metrics.
- **SyncConflict**: Represents an entity (Task or Event) that has been concurrently modified locally and remotely since the last synchronization, requiring human-in-the-loop resolution.
- **ConnectionHealth**: A read-only projection of a connection's current status, encompassing backoff state, last successful sync, and error details.

# Endpoint Catalog

## Connection Lifecycle
- **List Connections**
  `GET /api/v1/workspaces/{workspaceId}/connectors/connections`
- **Register Connection**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections`
- **Update Connection Sync Mode / Filters**
  `PUT /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}`
- **Suspend Connection**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/suspend`
- **Reactivate Connection**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/reactivate`
- **Revoke Connection Authorization**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/revoke`
- **Reauthorize Connection**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/reauthorize`

## Synchronization
- **Trigger Sync (Saga Orchestration)**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/sync`
- **Get Connection Health**
  `GET /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/health`

## Conflict Resolution
- **List Sync Conflicts**
  `GET /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/conflicts`
- **Resolve Sync Conflict**
  `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/conflicts/{conflictId}/resolve`

# Request Models

### `RegisterConnectionRequest`
```json
{
  "providerType": "GoogleCalendar | Slack | GitHub | TickTick | Notion | Jira",
  "syncMode": "Bidirectional | OneWayImport | OneWayExport",
  "rawCredentials": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### `UpdateConnectionRequest`
```json
{
  "syncMode": "Bidirectional | OneWayImport | OneWayExport",
  "filterRules": {
    "tags": ["string"],
    "project": "string"
  }
}
```

### `ReauthorizeConnectionRequest`
```json
{
  "rawCredentials": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### `ResolveConflictRequest`
```json
{
  "strategy": "UseLocal | UseRemote | ManualMerge"
}
```

# Response Models

### `ConnectionDTO`
```json
{
  "connectionId": "uuid",
  "workspaceId": "uuid",
  "providerType": "string",
  "status": "Active | Suspended | Unauthorized | Syncing",
  "syncMode": "Bidirectional | OneWayImport | OneWayExport",
  "filterRules": {
    "tags": ["string"],
    "project": "string"
  }
}
```

### `ConnectionHealthDTO`
```json
{
  "connectionId": "uuid",
  "status": "Active | Suspended | Unauthorized | Syncing",
  "lastSuccessfulSync": "2026-08-02T10:00:00Z",
  "lastError": "string",
  "isInBackoff": true,
  "retryAfter": "2026-08-02T10:05:00Z"
}
```

### `SyncConflictDTO`
```json
{
  "conflictId": "uuid",
  "connectionId": "uuid",
  "entityType": "Task | Event",
  "localEntityId": "string",
  "remoteEntityId": "string",
  "status": "Pending | Resolved | Ignored",
  "localSnapshot": {
    "title": "string",
    "description": "string"
  },
  "remoteSnapshot": {
    "title": "string",
    "description": "string"
  }
}
```

# Validation Rules

1. **Workspace Tenancy Isolation**: Operations must strictly scope to `workspaceId`. Any path parameters (`connectionId`, `conflictId`) must belong to the given `workspaceId`.
2. **Provider Validation**: `providerType` must be one of the known supported providers.
3. **Sync Strategy**: Strategy in `ResolveConflictRequest` must strictly map to `UseLocal`, `UseRemote`, or `ManualMerge`.
4. **Active Sync Restrictions**: Triggering sync manually will be rejected (HTTP 409) if the connection is already in `Syncing` status, `Suspended`, or `Unauthorized`.
5. **No Plaintext Vault Storage Check**: Requests containing `rawCredentials` will be processed in-memory before being dispatched to the secure Vault. They are not echoed in any response.

# Error Model

Standard RFC 7807 Problem Details for HTTP APIs format is utilized.

```json
{
  "type": "https://api.assistant.com/errors/connection-unauthorized",
  "title": "Connection Unauthorized",
  "status": 401,
  "detail": "The credentials for this connection have expired or are invalid.",
  "instance": "/api/v1/workspaces/123/connectors/connections/456",
  "errorCode": "CON-1004"
}
```

### Specific Error Codes
- `CON-1001`: Sync already in progress (HTTP 409)
- `CON-1002`: Connection suspended (HTTP 409)
- `CON-1003`: Invalid provider credentials (HTTP 400)
- `CON-1004`: Connection unauthorized (HTTP 401)
- `CON-1005`: Conflict resolution strategy mismatch (HTTP 400)

# Pagination

Pagination is applied to array-returning endpoints such as List Connections and List Sync Conflicts. Cursor-based pagination is favored for reliability.

Query parameters:
- `limit`: max results to return (default 20, max 100).
- `cursor`: opaque string representing the pagination offset.

Response envelop:
```json
{
  "data": [ ... ],
  "nextCursor": "base64-encoded-cursor",
  "hasMore": true
}
```

# Authentication

The API requires a valid JWT Bearer token passed in the `Authorization` header. Token claims must assert the `userId`. Authentication is enforced globally at the API Gateway level.

# Authorization

Authorization checks are enforced by the `TenantValidationPort` at the gateway/interceptor level. The authenticated `userId` must have active membership access to the `workspaceId` provided in the path parameters. Further granular scope-based checks may apply (e.g., `connector:write` vs `connector:read`).

# Example Requests

### Register Connection

```http
POST /api/v1/workspaces/ws-1234/connectors/connections HTTP/1.1
Host: api.assistant.com
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "providerType": "GitHub",
  "syncMode": "Bidirectional",
  "rawCredentials": {
    "accessToken": "ghp_abcdef1234567890"
  }
}
```

### Trigger Sync Saga

```http
POST /api/v1/workspaces/ws-1234/connectors/connections/conn-9876/sync HTTP/1.1
Host: api.assistant.com
Authorization: Bearer <jwt>
```

### Resolve Sync Conflict

```http
POST /api/v1/workspaces/ws-1234/connectors/connections/conn-9876/conflicts/conf-5555/resolve HTTP/1.1
Host: api.assistant.com
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "strategy": "UseLocal"
}
```

# Example Responses

### List Connections Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "connectionId": "conn-9876",
      "workspaceId": "ws-1234",
      "providerType": "GitHub",
      "status": "Active",
      "syncMode": "Bidirectional",
      "filterRules": {
        "repositories": ["frontend", "backend"]
      }
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

### Trigger Sync Acceptance (Saga Orchestration)

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "message": "Sync saga initiated.",
  "connectionId": "conn-9876"
}
```

### Resolve Conflict Success

```http
HTTP/1.1 204 No Content
```
