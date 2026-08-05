The Workspace Bounded Context exposes a REST API for managing tenant boundaries within the AI Executive Assistant. This API provides endpoints for retrieving workspace details, renaming workspaces, and administrative lifecycle management (suspend, reactivate, archive). It also describes the interceptor-level tenant verification mechanism used at the gateway level, satisfying the requirement to support tenant verification and workspace ownership checks across the platform.

# Resource Model

The primary resource in this context is the `Workspace`.

- **Workspace**: Represents the logical tenant boundary and security perimeter for a user. It contains the workspace ID, name, status, and ownerId.
- **Tenant Context**: A logical sub-resource applied across all APIs via headers or tokens, validated at the gateway level to guarantee data isolation.

# Endpoint Catalog

| Method | Path | Use Case | Actor |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/primary` | UC-WS-007: Resolve Primary Workspace | Authenticated User |
| `GET` | `/api/v1/workspaces/{workspaceId}` | GetWorkspaceDetailsQuery | Workspace Owner |
| `PATCH` | `/api/v1/workspaces/{workspaceId}` | UC-WS-003: Rename Workspace | Workspace Owner |
| `POST` | `/api/v1/workspaces/{workspaceId}/suspend` | UC-WS-004: Suspend Workspace | System Operator |
| `POST` | `/api/v1/workspaces/{workspaceId}/reactivate` | UC-WS-005: Reactivate Workspace | System Operator |
| `POST` | `/api/v1/workspaces/{workspaceId}/archive` | UC-WS-006: Archive Workspace | System Operator |

*Note: Provisioning (UC-WS-001) and internal validation (UC-WS-002) are executed synchronously via internal ports rather than external REST endpoints. The gateway conceptually intercepts all `/api/v1/**` traffic across all domains to perform tenant verification by checking the resolved `WorkspaceId` against the authenticated owner.*

# Request Models

### RenameWorkspaceRequest
```json
{
  "name": "My New Workspace Name"
}
```

### SuspendWorkspaceRequest
Empty body, or optional reason for audit purposes.
```json
{
  "reason": "Violation of terms"
}
```

### ReactivateWorkspaceRequest
Empty body, or optional reason for audit purposes.
```json
{
  "reason": "Resolved issue"
}
```

### ArchiveWorkspaceRequest
Empty body, or optional reason for audit purposes.
```json
{
  "reason": "User requested account deletion"
}
```

# Response Models

### WorkspaceResponse
```json
{
  "workspaceId": "ws-1234-5678",
  "name": "Personal Workspace",
  "status": "ACTIVE",
  "ownerId": "usr-1234-5678",
  "isPrimary": true
}
```

# Validation Rules

- **Workspace Name**: Must be non-empty after trimming, between 3 and 100 characters in length, and free of HTML tags or script injection sequences (INV-WS-04).
- **Path Parameters**: `workspaceId` must be a valid UUID v4 format.
- **Workspace Status Transitions**: 
  - Cannot rename a suspended or archived workspace.
  - Cannot suspend an already suspended or archived workspace.
  - Cannot reactivate an active or archived workspace.
  - Cannot archive an already archived workspace.

# Error Model

Standardized error responses across the API.

### 400 Bad Request
Validation failure (e.g., invalid workspace name length).
```json
{
  "error": "BAD_REQUEST",
  "message": "Workspace name must be between 3 and 100 characters.",
  "details": [
    {
      "field": "name",
      "issue": "Length outside valid range."
    }
  ]
}
```

### 403 Forbidden
Tenant validation failure or insufficient permissions (e.g., non-owner trying to rename, or standard user trying to suspend).
```json
{
  "error": "FORBIDDEN",
  "message": "Tenant access denied or insufficient role.",
  "code": "TENANT_ACCESS_DENIED"
}
```

### 404 Not Found
Workspace does not exist or user is not the owner.
```json
{
  "error": "NOT_FOUND",
  "message": "Workspace not found.",
  "code": "WORKSPACE_NOT_FOUND"
}
```

### 409 Conflict
Invalid state transition (e.g., archiving an already archived workspace).
```json
{
  "error": "CONFLICT",
  "message": "Invalid workspace state transition.",
  "code": "INVALID_WORKSPACE_STATE"
}
```

# Pagination

Pagination is not currently applicable for the Workspace API as MVP enforces a single primary workspace per user, and endpoints only return single instances.

# Authentication

All endpoints require a valid JWT representing an authenticated user session. Authentication is handled by the Auth bounded context and validated at the API Gateway.

# Authorization

- **Tenant Verification (Gateway Level)**: The Gateway extracts the target workspace ID from the request context (either via URL path `/workspaces/{workspaceId}` or via a standard header like `X-Workspace-Id` for other domain contexts) and invokes the `TenantValidationPort` to ensure the authenticated user owns that workspace (INV-WS-05).
- **Role-based Access Control**:
  - `GET /api/v1/workspaces/primary`: Requires authenticated user.
  - `GET /api/v1/workspaces/{workspaceId}`: Requires ownership of the target workspace.
  - `PATCH /api/v1/workspaces/{workspaceId}`: Requires ownership of the target workspace.
  - Lifecycle endpoints (`/suspend`, `/reactivate`, `/archive`): Require global `SYSTEM_OPERATOR` role.

# Example Requests

### Get Primary Workspace
```http
GET /api/v1/workspaces/primary HTTP/1.1
Host: api.assistant.com
Authorization: Bearer <token>
```

### Rename Workspace
```http
PATCH /api/v1/workspaces/ws-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: api.assistant.com
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane's Primary Workspace"
}
```

# Example Responses

### Get Primary Workspace Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "workspaceId": "ws-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Default Workspace",
  "status": "ACTIVE",
  "ownerId": "usr-1234-5678",
  "isPrimary": true
}
```

### Rename Workspace Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "workspaceId": "ws-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Jane's Primary Workspace",
  "status": "ACTIVE",
  "ownerId": "usr-1234-5678",
  "isPrimary": true
}
```
