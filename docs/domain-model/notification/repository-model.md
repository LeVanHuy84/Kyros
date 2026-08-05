# Repository Model — Notification Bounded Context

---

## InAppNotificationRepository

**Aggregate root**: InAppNotification

### Responsibilities

- Load by **NotificationId** and **WorkspaceId** (and **UserId** if inbox is per-user).
- Persist create, mark read, dismiss.
- List unread/read notifications for workspace user with pagination.
- Count unread for badge display.

---

## NotificationProfileRepository

**Aggregate root**: NotificationProfile

### Responsibilities

- Load profile by (**WorkspaceId**, **UserId**); one profile per pair.
- Persist routing map and channel configuration updates.
- Create default profile on user/workspace setup.

---

### Out of scope

- SMTP/Slack transport (infrastructure adapters).
- Storing connector credentials (**Connector** / vault).
- Computing calendar reminder times (**Calendar**).
- Workflow trigger definitions (**Workflow**).

### Contract expectations

- Strict **WorkspaceId** isolation on all queries.
- Profile load used by dispatch service before channel selection.
