# Domain Events — Notification Bounded Context

---

## InAppNotificationCreated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `InAppNotification` aggregate (via dispatch service factory) |
| **Trigger** | Dispatch engine evaluates the `NotificationProfile` for a workspace and determines the `InApp` channel is active; a new in-app notification is instantiated. |
| **Consumers** | UI / real-time push layer (WebSocket / SSE), audit log |
| **Business Meaning** | A panel alert is now visible to the user in the application. The UI should refresh the notification inbox. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `notificationId` | NotificationId | Unique identifier |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Target recipient |
| `title` | NotificationTitle | Alert headline |
| `urgencyLevel` | UrgencyLevel | Low / Normal / Urgent / Critical |
| `occurredAt` | Instant | Creation timestamp |

---

## InAppNotificationRead

| Attribute | Detail |
| --- | --- |
| **Publisher** | `InAppNotification` aggregate |
| **Trigger** | User views the notification; status transitions `Unread → Read`. |
| **Consumers** | UI (update badge counts), audit log |
| **Business Meaning** | The user has acknowledged the alert. Unread badge counts should be decremented. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `notificationId` | NotificationId | Read notification |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Read timestamp |

---

## InAppNotificationDismissed

| Attribute | Detail |
| --- | --- |
| **Publisher** | `InAppNotification` aggregate |
| **Trigger** | User dismisses the notification; status transitions to `Dismissed` (terminal for active views). |
| **Consumers** | UI (remove from active list), audit log |
| **Business Meaning** | The alert is permanently removed from the user's active notification panel. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `notificationId` | NotificationId | Dismissed notification |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `occurredAt` | Instant | Dismissal timestamp |

---

## NotificationDispatched

| Attribute | Detail |
| --- | --- |
| **Publisher** | `NotificationDispatchService` (domain service) |
| **Trigger** | The dispatch service routes an incoming alert through the `NotificationProfile`, renders the payload via the template engine, and delivers to all configured channels. |
| **Consumers** | Audit log, monitoring |
| **Business Meaning** | An alert has been fully processed and sent through all channels required by the profile. This is the final confirmation that the notification pipeline completed. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Target user |
| `urgencyLevel` | UrgencyLevel | Dispatched urgency |
| `channelsUsed` | NotificationChannel[] | Channels the alert was sent through |
| `occurredAt` | Instant | Dispatch completion timestamp |

---

## NotificationRendered

| Attribute | Detail |
| --- | --- |
| **Publisher** | Template rendering service (within Notification context) |
| **Trigger** | Template merged with payload to produce a `RenderedNotificationPayload` for a specific channel. |
| **Consumers** | Channel delivery adapters (Email SMTP, Slack webhook, In-App writer) |
| **Business Meaning** | A channel-ready message is prepared. The delivery adapter consumes the rendered payload to send through the external channel. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `channel` | NotificationChannel | Target channel |
| `templateId` | NotificationTemplateId | Template used |
| `occurredAt` | Instant | Rendering timestamp |

---

## NotificationProfileUpdated

| Attribute | Detail |
| --- | --- |
| **Publisher** | `NotificationProfile` aggregate |
| **Trigger** | User updates channel mappings, email address, Slack webhook reference, or digest schedule on their profile. |
| **Consumers** | Dispatch service (reload profile on next dispatch), audit log |
| **Business Meaning** | Future notifications will be routed to the updated channels. Changes take effect immediately for the next dispatch cycle. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `profileId` | ProfileId | Updated profile |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Profile owner |
| `changedFields` | string[] | Names of fields changed |
| `occurredAt` | Instant | Update timestamp |

---

## NotificationProfileReset

| Attribute | Detail |
| --- | --- |
| **Publisher** | `NotificationProfile` aggregate |
| **Trigger** | User resets their notification profile to system defaults. |
| **Consumers** | Dispatch service (reload profile), audit log |
| **Business Meaning** | All channel mappings and preferences are restored to defaults. Useful for recovery from misconfiguration. |

---

## DigestScheduled

| Attribute | Detail |
| --- | --- |
| **Publisher** | Digest scheduling service (within Notification context) |
| **Trigger** | A consolidated email digest is enqueued per the `DigestSchedule` configured on a `NotificationProfile`. |
| **Consumers** | Email delivery adapter, audit log |
| **Business Meaning** | The user will receive a summary report of recent activity in the next email delivery window. |

**Payload**

| Field | Type | Description |
| --- | --- | --- |
| `workspaceId` | WorkspaceId | Tenant boundary |
| `userId` | UserId | Digest recipient |
| `scheduledFor` | Instant | Planned delivery time |
| `occurredAt` | Instant | Scheduling timestamp |

---

## Event Summary

| Event | Publisher | Key Consumers |
| --- | --- | --- |
| InAppNotificationCreated | InAppNotification | UI Push Layer, Audit |
| InAppNotificationRead | InAppNotification | UI, Audit |
| InAppNotificationDismissed | InAppNotification | UI, Audit |
| NotificationDispatched | Dispatch Service | Audit, Monitoring |
| NotificationRendered | Template Service | Channel Delivery Adapters |
| NotificationProfileUpdated | NotificationProfile | Dispatch Service, Audit |
| NotificationProfileReset | NotificationProfile | Dispatch Service, Audit |
| DigestScheduled | Digest Scheduler | Email Adapter, Audit |
