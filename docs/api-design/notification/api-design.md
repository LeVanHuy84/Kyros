# REST API Design — Notification Bounded Context

## Document Metadata
- **Version**: 1.0.0
- **Context**: Notification
- **Date**: 2026-08-02
- **Author**: Principal API Architect

## 1. Overview
This document specifies the REST API design for the Notification Bounded Context. It provides the application boundaries for managing the in-app notification inbox and user-specific notification profiles (channel preferences, Slack/email configurations).

The Notification API relies on the `WorkspaceId` from the URL path, and implicitly infers the `UserId` from the authenticated user token (via the Gateway/Auth context).

### Base Path
All endpoints are relative to: `/api/v1/workspaces/{workspaceId}`

---

## 2. API Endpoints

### 2.1 In-App Notifications (Inbox)

#### 2.1.1 List In-App Notifications
Retrieves a paginated list of in-app notifications for the authenticated user within the workspace.

- **Method**: `GET`
- **Path**: `/notifications`
- **Operation ID**: `getInAppNotifications`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
- **Query Parameters**:
  - `status` (string, optional): Filter by notification status. Enum: `Unread`, `Read`, `Dismissed`, `All`. Default: `Unread`.
  - `page` (integer, optional): The page number (0-indexed). Default: `0`.
  - `size` (integer, optional): The page size. Default: `20`.
- **Responses**:
  - **200 OK**:
    - **Body**: `PaginatedResponse<InAppNotificationDTO>`
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.

#### 2.1.2 Mark Notification as Read
Marks a specific in-app notification as read.

- **Method**: `POST`
- **Path**: `/notifications/{notificationId}/read`
- **Operation ID**: `markNotificationRead`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
  - `notificationId` (string, required): The ID of the notification.
- **Responses**:
  - **204 No Content**: Successfully marked as read.
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.
  - **404 Not Found**: Notification not found.
  - **409 Conflict**: Notification is in a terminal state (e.g., Dismissed).

#### 2.1.3 Mark All Notifications as Read
Bulk operation to mark all unread in-app notifications as read for the user in the workspace.

- **Method**: `POST`
- **Path**: `/notifications/read-all`
- **Operation ID**: `markAllNotificationsRead`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
- **Responses**:
  - **204 No Content**: Successfully marked all as read.
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.

#### 2.1.4 Dismiss Notification
Dismisses a specific in-app notification, hiding it from the active views.

- **Method**: `POST`
- **Path**: `/notifications/{notificationId}/dismiss`
- **Operation ID**: `dismissNotification`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
  - `notificationId` (string, required): The ID of the notification.
- **Responses**:
  - **204 No Content**: Successfully dismissed.
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.
  - **404 Not Found**: Notification not found.

---

### 2.2 Notification Profile

#### 2.2.1 Get Notification Profile
Retrieves the user's notification profile settings (routing rules, external references, consent) for the current workspace.

- **Method**: `GET`
- **Path**: `/notification-profile`
- **Operation ID**: `getNotificationProfile`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
- **Responses**:
  - **200 OK**:
    - **Body**: `NotificationProfileDTO`
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.
  - **404 Not Found**: Profile not found (a default is usually provisioned on workspace creation).

#### 2.2.2 Update Notification Profile
Updates the user's notification profile settings.

- **Method**: `PUT`
- **Path**: `/notification-profile`
- **Operation ID**: `updateNotificationProfile`
- **Path Parameters**:
  - `workspaceId` (string, required): The ID of the workspace.
- **Request Body**: `UpdateNotificationProfileRequest`
- **Responses**:
  - **200 OK**: Successfully updated.
    - **Body**: `NotificationProfileDTO`
  - **400 Bad Request**: Invalid routing map, invalid email, or missing Slack webhook reference.
  - **401 Unauthorized**: Missing or invalid authentication token.
  - **403 Forbidden**: User does not have access to the workspace.

---

## 3. Schemas

### InAppNotificationDTO
```json
{
  "type": "object",
  "properties": {
    "notificationId": { "type": "string", "format": "uuid" },
    "workspaceId": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "content": { "type": "string" },
    "urgencyLevel": { 
      "type": "string", 
      "enum": ["Low", "Normal", "Urgent", "Critical"] 
    },
    "status": { 
      "type": "string", 
      "enum": ["Unread", "Read", "Dismissed"] 
    },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["notificationId", "workspaceId", "title", "content", "urgencyLevel", "status", "createdAt"]
}
```

### NotificationProfileDTO
```json
{
  "type": "object",
  "properties": {
    "workspaceId": { "type": "string", "format": "uuid" },
    "channelRoutingMap": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "string", "enum": ["InApp", "Email", "Slack"] }
      },
      "description": "Keys are urgency levels ('Low', 'Normal', 'Urgent', 'Critical'). Values are arrays of channels."
    },
    "emailAddress": { "type": "string", "format": "email" },
    "slackWebhookRef": { "type": "string", "description": "Vault key referencing the Slack OAuth token/webhook." },
    "digestSchedule": { "type": "string", "description": "Cron expression for email digests." },
    "consentPolicy": { "type": "string", "enum": ["ENABLED", "DISABLED"] }
  },
  "required": ["workspaceId", "channelRoutingMap", "consentPolicy"]
}
```

### UpdateNotificationProfileRequest
```json
{
  "type": "object",
  "properties": {
    "channelRoutingMap": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "string", "enum": ["InApp", "Email", "Slack"] }
      }
    },
    "emailAddress": { "type": "string", "format": "email" },
    "slackWebhookRef": { "type": "string" },
    "digestSchedule": { "type": "string" },
    "consentPolicy": { "type": "string", "enum": ["ENABLED", "DISABLED"] }
  },
  "required": ["channelRoutingMap", "consentPolicy"]
}
```

### PaginatedResponse<T>
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/T" }
    },
    "page": { "type": "integer" },
    "size": { "type": "integer" },
    "totalElements": { "type": "integer" },
    "totalPages": { "type": "integer" }
  },
  "required": ["content", "page", "size", "totalElements", "totalPages"]
}
```
