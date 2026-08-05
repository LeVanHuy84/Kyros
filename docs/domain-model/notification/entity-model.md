# Entity Model — Notification Bounded Context

Two aggregates: **InAppNotification**, **NotificationProfile**.

---

## In-App Notification Aggregate

### Aggregate Root: InAppNotification

#### Responsibilities

- Persisted panel alert scoped to **WorkspaceId** (and target **UserId** if per-user inbox).
- Encapsulates title, content, **UrgencyLevel**, status (**Unread**, **Read**, **Dismissed**), created timestamp.
- Transitions: mark read, dismiss.

#### Identity

- **NotificationId** + **WorkspaceId**.

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Unread** | Default for new in-app notifications. |
| **Read** | User viewed notification. |
| **Dismissed** | Removed from active views (terminal for UI). |

#### Public behaviors

- Create from dispatch payload (via factory when routing selects in-app channel).
- Mark as read.
- Dismiss.

---

## Notification Profile Aggregate

### Aggregate Root: NotificationProfile

#### Responsibilities

- Routing policy for one (**WorkspaceId**, **UserId**).
- Maps each **UrgencyLevel** to ordered **NotificationChannel** lists.
- Stores channel-specific configuration references (email address required for email; Slack webhook reference for Slack).
- Validates routing rules (Slack only for Urgent/Critical; email requires valid address).
- Supplies default mappings for new workspaces/users.

#### Identity

- **ProfileId** or composite (**WorkspaceId**, **UserId**).

#### Lifecycle

| Phase | Meaning |
| --- | --- |
| **Active** | Current routing configuration. |

#### Public behaviors

- Update channel mappings per urgency.
- Update email address and Slack webhook reference fields.
- Reset to defaults.

---

## Summary

| Kind | Name | Identity |
| --- | --- | --- |
| Aggregate root | InAppNotification | NotificationId |
| Aggregate root | NotificationProfile | ProfileId or (WorkspaceId, UserId) |

Dispatch orchestration (queue bypass for Critical/Urgent) is a domain service; **NotificationTemplate** rendering may be value objects or template registry outside aggregate roots.
