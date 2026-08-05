# Executive Summary

The Auth Bounded Context REST API handles the Identity & Access Management (IAM) domain of the AI Executive Assistant system. It provides endpoints for user registration, authentication (login/logout), password management, and administrative actions such as account suspension, reactivation, lockout resolution, and global role assignment.

This API adheres to strict REST principles and enforces secure authentication and authorization rules based on system-wide roles. It interacts asynchronously with the Workspace context during user registration (publishing a `UserRegistered` event rather than performing synchronous workspace provisioning) to remain decoupled and highly available.

# Resource Model

| Resource | URI Path | Description |
| --- | --- | --- |
| **Auth** | `/api/v1/auth` | Public and self-service authentication endpoints (register, login, logout, change password). |
| **User Identities** | `/api/v1/admin/users` | Administrative endpoints to manage user states (suspend, reactivate, unlock, fetch details). |
| **Global Roles** | `/api/v1/admin/users/{userId}/roles` | Administrative endpoints to assign and revoke system-wide global roles for users. |

# Endpoint Catalog

## Public & Self-Service Endpoints
- `POST /api/v1/auth/register`: Register a new user.
- `POST /api/v1/auth/login`: Authenticate and generate a session token (JWT).
- `POST /api/v1/auth/logout`: Invalidate the current session token.
- `PUT /api/v1/auth/password`: Change the password for the currently authenticated user.

## Administrative Endpoints (Requires `SYSTEM_OPERATOR` role)
- `GET /api/v1/admin/users`: Search user identities (e.g., by email).
- `GET /api/v1/admin/users/{userId}`: Retrieve a specific user identity.
- `POST /api/v1/admin/users/{userId}/suspend`: Administratively suspend a user account.
- `POST /api/v1/admin/users/{userId}/reactivate`: Reactivate a suspended user account.
- `POST /api/v1/admin/users/{userId}/unlock`: Unlock a user account locked due to failed login attempts.
- `POST /api/v1/admin/users/{userId}/roles`: Assign a global role to a user.
- `DELETE /api/v1/admin/users/{userId}/roles/{role}`: Revoke a global role from a user.

# Request Models

### RegisterUserRequest
```json
{
  "email": "string (email)",
  "password": "string"
}
```

### LoginUserRequest
```json
{
  "email": "string (email)",
  "password": "string"
}
```

### ChangePasswordRequest
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

### AssignGlobalRoleRequest
```json
{
  "roleName": "string (enum: END_USER, SYSTEM_OPERATOR)"
}
```

# Response Models

### TokenResponse
```json
{
  "accessToken": "string (JWT)",
  "tokenType": "Bearer",
  "expiresIn": "integer (seconds)"
}
```

### UserIdentityResponse
```json
{
  "userId": "string (UUID)",
  "email": "string (email)",
  "status": "string (enum: ACTIVE, LOCKED, SUSPENDED)",
  "globalRoles": ["string (enum: END_USER, SYSTEM_OPERATOR)"],
  "failedLoginCount": "integer"
}
```

### PaginatedUserIdentityResponse
```json
{
  "items": [
    // Array of UserIdentityResponse
  ],
  "page": "integer",
  "pageSize": "integer",
  "totalElements": "integer",
  "totalPages": "integer"
}
```

# Validation Rules

1. **Email Format**: Must conform to RFC-5322 valid email patterns and must be uniquely registered across the system.
2. **Password Complexity**: Passwords must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one numeric digit, and one special character.
3. **Roles**: Global roles can only be `END_USER` or `SYSTEM_OPERATOR`. Users must retain at least one global role at all times.

# Error Model

Standard API error responses use the problem details format (RFC 7807):

```json
{
  "type": "string (URI identifying the problem type)",
  "title": "string (short human-readable summary)",
  "status": "integer (HTTP status code)",
  "detail": "string (human-readable explanation specific to this occurrence)",
  "instance": "string (URI of the request that caused the error)",
  "errorCode": "string (application-specific error code)"
}
```

### Common Error Codes
- `AUTH-001`: EmailAlreadyRegisteredException (409 Conflict)
- `AUTH-002`: BadCredentialsException (401 Unauthorized)
- `AUTH-003`: AccountLockedException (403 Forbidden)
- `AUTH-004`: AccountSuspendedException (403 Forbidden)
- `AUTH-005`: AccountNotActiveException (403 Forbidden)
- `AUTH-006`: DomainRuleException (400 Bad Request, e.g., attempting to revoke the last global role)

# Pagination

The `GET /api/v1/admin/users` endpoint supports cursor or offset-based pagination:
- `page`: 0-indexed page number (default 0).
- `size`: Items per page (default 20, max 100).
Pagination details are returned at the root level of the response along with the `items` array.

# Authentication

- **Public Endpoints**: `/api/v1/auth/register` and `/api/v1/auth/login` do not require authentication.
- **Authenticated Endpoints**: All other endpoints require a valid JWT passed in the `Authorization` header (`Bearer {token}`).

# Authorization

- **Self-Service**: Endpoints under `/api/v1/auth` (logout, change password) require the user to be authenticated. Operations are inherently scoped to the currently authenticated user session.
- **Administration**: All endpoints under `/api/v1/admin/users` require the authenticated user to hold the `SYSTEM_OPERATOR` global role.

# Example Requests

### Register User
```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "password": "Str0ng!P@ssw0rd"
}
```

### Change Password
```http
PUT /api/v1/auth/password HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "oldPassword": "Str0ng!P@ssw0rd",
  "newPassword": "N3w!Str0ngP@ss"
}
```

### Assign Global Role
```http
POST /api/v1/admin/users/123e4567-e89b-12d3-a456-426614174000/roles HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "roleName": "SYSTEM_OPERATOR"
}
```

# Example Responses

### Login Success Response (200 OK)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Get User Identity Response (200 OK)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "jane.doe@example.com",
  "status": "ACTIVE",
  "globalRoles": ["END_USER", "SYSTEM_OPERATOR"],
  "failedLoginCount": 0
}
```

### User Registration Success (201 Created)
```http
HTTP/1.1 201 Created

// Response is empty (201 status). Workspace provisioning happens asynchronously.
```

### Error Response (401 Unauthorized - Bad Credentials)
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password.",
  "instance": "/api/v1/auth/login",
  "errorCode": "AUTH-002"
}
```
