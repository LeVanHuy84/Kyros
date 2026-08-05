# Value Object Model — Notification Bounded Context

---

## NotificationId / ProfileId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque identifiers. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null. |

---

## WorkspaceId / UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Tenancy and recipient scope. |
| **Immutability** | Immutable on aggregate. |
| **Validation** | No cross-workspace visibility. |

---

## NotificationTitle / NotificationContent

| Aspect | Description |
| --- | --- |
| **Fields** | Short title and body text (or structured content). |
| **Immutability** | Immutable after creation for **InAppNotification**. |
| **Validation** | Non-empty title; content required for display. |

---

## UrgencyLevel

| Aspect | Description |
| --- | --- |
| **Fields** | Low, Normal, Urgent, Critical. |
| **Immutability** | Fixed at dispatch time. |
| **Validation** | Drives channel policy and queue bypass rules. |

---

## InAppNotificationStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Unread, Read, Dismissed. |
| **Immutability** | Transitions via aggregate methods. |
| **Validation** | **Dismissed** terminal for active lists. |

---

## NotificationChannel

| Aspect | Description |
| --- | --- |
| **Fields** | InApp, Email, Slack. |
| **Immutability** | Channel set on profile is replace-on-change. |
| **Validation** | Slack mapping only for Urgent/Critical on profile. |

---

## ChannelRoutingMap

| Aspect | Description |
| --- | --- |
| **Fields** | Map **UrgencyLevel** → list of **NotificationChannel**. |
| **Immutability** | Replace-on-change on **NotificationProfile**. |
| **Validation** | Email channel requires **EmailAddress** on profile; Critical/Urgent may bypass dispatch queue. |

---

## EmailAddress

| Aspect | Description |
| --- | --- |
| **Fields** | Valid email for email channel. |
| **Immutability** | Replace-on-change on profile. |
| **Validation** | Required before email dispatch; valid format. |

---

## SlackWebhookReference

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque reference to encrypted webhook/token in vault/connector. |
| **Immutability** | Replace-on-change. |
| **Validation** | Required when Slack enabled for allowed urgencies. |

---

## NotificationTemplateId

| Aspect | Description |
| --- | --- |
| **Fields** | Template key for channel-specific rendering. |
| **Immutability** | Selected per dispatch. |
| **Validation** | Must exist in template catalog. |

---

## RenderedNotificationPayload

| Aspect | Description |
| --- | --- |
| **Fields** | Channel-ready subject/body after template merge. |
| **Immutability** | Immutable per dispatch attempt. |
| **Validation** | Digest content respects consent flags on profile. |

---

## DispatchQueuePolicy

| Aspect | Description |
| --- | --- |
| **Fields** | Rules: Urgent/Critical immediate; Normal/Low queued/batched. |
| **Immutability** | Domain constant. |
| **Validation** | Applied by **NotificationDispatchService**. |

---

## DigestSchedule

| Aspect | Description |
| --- | --- |
| **Fields** | Interval/cron for consolidated email digest. |
| **Immutability** | Configured on profile or system policy. |
| **Validation** | Digest must honor sensitive data consent invariant. |

---

## CreatedAt

| Aspect | Description |
| --- | --- |
| **Fields** | Instant notification created. |
| **Immutability** | Immutable. |
| **Validation** | Required on **InAppNotification**. |
