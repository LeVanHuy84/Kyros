# Notification Bounded Context Database Design

This document details the logical database design for the **Notification** Bounded Context.

---

## 1. Context Overview

### Purpose
The Notification context manages rendering, channel routing policies, and delivery execution for alerts (such as task deadlines, calendar conflicts, and approvals). It stores user notification preferences and persistent in-app notifications.

### Aggregate Ownership
- **InAppNotification** (Aggregate Root): Encapsulates in-app alerts sent to a user.
- **NotificationProfile** (Aggregate Root): Stores channel routing maps and credential references (e.g. Email target, Slack webhooks).

### Persistence Responsibility
The Notification context maintains the routing mappings, templates, and persistent user notification lists. It is responsible for serving in-app inbox queries.

---

## 2. Entity → Table Mapping

| Bounded Context Aggregate / Entity / VO | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **InAppNotification** (Aggregate Root) | `notification.in_app_notifications` | Table |
| `NotificationId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `UserId` (Value Object) | `user_id` (UUID) | Logical Reference Column |
| `UrgencyLevel` (Value Object) | `urgency_level` (VARCHAR) | Column |
| `InAppNotificationStatus` (Value Object) | `status` (VARCHAR) | Column |
| **NotificationProfile** (Aggregate Root) | `notification.profiles` | Table |
| `ProfileId` (Value Object) | `id` (UUID) | Primary Key Column |
| `ChannelRoutingMap` (Value Object) | `urgency_channels_map` (JSON) | Column (JSONB) |
| `EmailAddress` (Value Object) | `email_address` (VARCHAR) | Column |
| `SlackWebhookReference` (Value Object) | `slack_webhook_reference` (VARCHAR) | Column |

---

## 3. Table Definitions

### Table: `notification.in_app_notifications`

#### Purpose
Stores user in-app notification alerts displayed on UI dashboards.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to workspace. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to recipient (`auth.user_identities.id`). |
| `title` | `VARCHAR(255)` | `NOT NULL` | *None* | `CHECK (length(trim(title)) > 0)` | Notification title header. |
| `content` | `TEXT` | `NOT NULL` | *None* | *None* | Alert detail content. |
| `urgency_level` | `VARCHAR(50)` | `NOT NULL` | `'Normal'` | `CHECK (urgency_level IN ('Low', 'Normal', 'Urgent', 'Critical'))` | Urgency routing indicator. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Unread'` | `CHECK (status IN ('Unread', 'Read', 'Dismissed'))` | In-app view state. |
| `read_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant the user read the notification (mark-as-read action). |
| `dismissed_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant the user dismissed the notification (dismiss action). |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Concurrency version indicator. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Instant notification was generated. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |

---

### Table: `notification.profiles`

#### Purpose
Maintains user-configured alert delivery policies across various urgency levels.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global profile identity. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to workspace context. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id`. |
| `urgency_channels_map`| `JSONB` | `NOT NULL` | `'{"Low": ["InApp"], "Normal": ["InApp", "Email"], "Urgent": ["InApp", "Email", "Slack"], "Critical": ["InApp", "Email", "Slack"]}'::jsonb` | *None* | Urgency-to-channels mapping rules (JSONB, not VARCHAR). |
| `email_address` | `VARCHAR(255)` | `NULLABLE` | `NULL` | *None* | Delivery target email address. |
| `slack_webhook_reference`| `VARCHAR(255)`| `NULLABLE` | `NULL` | *None* | Vault key mapping to Slack integration profile. |
| `consent_policy` | `VARCHAR(50)` | `NOT NULL` | `'All'` | `CHECK (consent_policy IN ('All', 'TransactionalOnly', 'None'))` | Email/Slack digest consent level governing batch sends. |
| `digest_schedule` | `VARCHAR(50)` | `NULLABLE` | `NULL` | `CHECK (digest_schedule IN ('Immediate', 'Daily', 'Weekly'))` | Batching cadence for non-urgent channel sends. |
| `last_digest_sent_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant of the previous digest run for this profile. |
| `next_digest_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant the next digest batch is due for this profile. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Concurrency version indicator. |

---

## 4. Relationships

- **Reference by ID**:
  - `workspace_id` links logically to `workspace.workspaces.id`.
  - `user_id` links logically to `auth.user_identities.id`.
  - `slack_webhook_reference` contains a logical key pointing to Vault credentials managed by the Connector context. No constraints cross context boundaries.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_in_app_notifications` | `id` | B-Tree (Implicit) | Primary key index. |
| `pk_profiles` | `id` | B-Tree (Implicit) | Primary key index. |
| `idx_notifications_user_unread` | `user_id`, `status`, `created_at` | B-Tree (Composite) | **Critical** index to retrieve active alerts and calculate unread counts on the user dashboard. |
| `idx_notifications_inbox` | `user_id`, `created_at` DESC | B-Tree (Composite) | Optimizes paginated full-inbox listing (Read + Unread) newest-first. |
| `uq_profiles_workspace_user` | `workspace_id`, `user_id` | B-Tree (Composite UQ) | Ensures a user has exactly one notification profile inside a workspace. |
| `idx_profiles_digest_due` | `next_digest_at` WHERE `digest_schedule IS NOT NULL AND digest_schedule <> 'Immediate'` | B-Tree (Partial) | Optimizes the background digest scheduler's scan of profiles with a pending batch. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Retrieve In-App Alerts**: `SELECT * FROM notification.in_app_notifications WHERE user_id = :userId AND status = 'Unread' ORDER BY created_at DESC`. Highly optimized by `idx_notifications_user_unread`.
- **Paginated Inbox**: `SELECT * FROM notification.in_app_notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 20 OFFSET :offset`. Optimized by `idx_notifications_inbox`.
- **Fetch Target Addresses**: `SELECT email_address, slack_webhook_reference, urgency_channels_map FROM notification.profiles WHERE workspace_id = :wsId AND user_id = :userId`. Optimized by unique index `uq_profiles_workspace_user`.

### Expected Write Patterns
- **Insert Alerts**: Bulk insertion of in-app alerts on events (low to moderate write frequency).
- **Mark Read / Dismiss**: Updates `status` and records `read_at` / `dismissed_at`. `idx_notifications_user_unread` keeps the unread-count query on a compact portion of the index.
- **Digest Run**: The digest scheduler scans `profiles` where `next_digest_at <= NOW()`, generates batch sends, then advances `last_digest_sent_at` and `next_digest_at`.

---

## 7. Integrity Rules

- **Slack Channel Limit**: The application profile validation rules block mapping Slack configurations to `Low` or `Normal` urgencies to reduce noise and external rate limit consumption.
- **Uniqueness**: Composite unique index `uq_profiles_workspace_user` enforces exactly one profile record per user in a workspace.
- **Read/Dismiss Mutually Exclusive**: Application logic sets exactly one of `read_at` / `dismissed_at`; a notification is never both read and dismissed.

---

## 8. Persistence Notes

- **Optimistic Locking**: Tracked on `profiles` and `in_app_notifications` via `version` columns.
- **Payload Sanitization**: In-app notifications do not store sensitive metadata. Rendered payloads are generated inside the application template engine before saving.

---

## 9. Future Evolution

- **Channel Status Tracking**: A logging table `notification.delivery_logs (id, notification_id, channel, status, error_msg, sent_at)` will be added post-MVP to audit the delivery status of SMS, Slack, and email notifications.
- **Retention**: In-app notifications marked `Read` or `Dismissed` older than 30 days will be physically purged via scheduled routines to maintain index and lookup performance.
