# Business Invariants — Notification Bounded Context

---

## Validation Rules

### INV-NOTIF-01 — Workspace Tenancy Scope

| Aspect | Detail |
| --- | --- |
| **Rule** | All notifications, alerts, and profiles must strictly belong to a single `WorkspaceId`. Cross-workspace visibility is prohibited. |
| **Enforcement** | `WorkspaceId` is immutable on each aggregate after creation; application layer validates workspace scope on every load and save. |
| **Violation** | Cross-workspace notification access rejected. |

---

### INV-NOTIF-02 — Email Channel Requires Valid Address

| Aspect | Detail |
| --- | --- |
| **Rule** | An email notification must not be dispatched unless a valid, non-empty `EmailAddress` is configured on the `NotificationProfile`. |
| **Enforcement** | `NotificationDispatchService` checks the profile's `EmailAddress` before routing to the email channel. `updateChannelMappings()` rejects enabling the email channel when `EmailAddress` is absent or invalid. |
| **Violation** | Email dispatch attempted without a valid address is blocked; the email channel is skipped for this dispatch. |

---

### INV-NOTIF-03 — Slack Channel Limited to Urgent and Critical

| Aspect | Detail |
| --- | --- |
| **Rule** | Slack delivery must only be triggered for notifications classified as `Urgent` or `Critical`. Notifications with `Low` or `Normal` urgency must not be routed to the Slack channel. |
| **Enforcement** | `updateChannelMappings()` rejects any `ChannelRoutingMap` that assigns the `Slack` channel to `Low` or `Normal` urgency levels. The dispatch service also enforces this at routing time. |
| **Violation** | Slack routing for Low/Normal urgency is rejected at both profile update and dispatch time. |

---

### INV-NOTIF-04 — Critical and Urgent Alerts Bypass Dispatch Queue

| Aspect | Detail |
| --- | --- |
| **Rule** | Notifications marked as `Critical` or `Urgent` must bypass standard delivery queues and be sent immediately. |
| **Enforcement** | `NotificationDispatchService` evaluates `UrgencyLevel` against `DispatchQueuePolicy` (domain constant). Critical/Urgent alerts are dispatched synchronously or through a priority-immediate path. |
| **Violation** | Queuing a Critical/Urgent notification in a standard batch queue that introduces delay is a business defect. |

---

### INV-NOTIF-05 — Digest Data Consent

| Aspect | Detail |
| --- | --- |
| **Rule** | Summaries and digests must not render sensitive domain data unless explicit user settings permit it on the `NotificationProfile`. |
| **Enforcement** | Digest rendering service reads the `RenderedNotificationPayload` through a consent-aware template; `DigestSchedule` on the profile carries consent flags. Content marked sensitive is omitted or summarized without detail. |
| **Violation** | Exposing sensitive data in a digest without user consent is a privacy defect. |

---

### INV-NOTIF-06 — Non-Empty Notification Title

| Aspect | Detail |
| --- | --- |
| **Rule** | Every `InAppNotification` must have a non-empty `NotificationTitle`. |
| **Enforcement** | `NotificationTitle` value object rejects blank strings; `InAppNotification.create()` validates before instantiation. |
| **Violation** | Notification creation without a title is rejected. |

---

### INV-NOTIF-07 — Slack Webhook Reference Required When Slack Enabled

| Aspect | Detail |
| --- | --- |
| **Rule** | When the `Slack` channel is active for any urgency mapping, a non-null `SlackWebhookReference` must be present on the profile. |
| **Enforcement** | `updateChannelMappings()` and `updateSlackWebhookReference()` enforce this cross-field constraint on the aggregate. Dispatch service also checks the reference before calling the Slack adapter. |
| **Violation** | Slack dispatch without a webhook reference is blocked; event/error raised. |

---

## Consistency Rules

### INV-NOTIF-08 — Dismissed Status is Terminal

| Aspect | Detail |
| --- | --- |
| **Rule** | An `InAppNotification` in `Dismissed` state cannot be transitioned back to `Unread` or `Read`. Dismissed is a terminal state. |
| **Enforcement** | `markRead()` and any re-activation operations guard on `status != Dismissed`. |
| **Violation** | Attempting to un-dismiss a notification is rejected. |

---

### INV-NOTIF-09 — One Profile Per Workspace/User

| Aspect | Detail |
| --- | --- |
| **Rule** | There must be exactly one `NotificationProfile` per `(WorkspaceId, UserId)` pair. |
| **Enforcement** | Profile creation is idempotent at the application layer. Infrastructure enforces a unique constraint on `(WorkspaceId, UserId)`. |
| **Violation** | Duplicate profiles would produce ambiguous channel routing. |

---

### INV-NOTIF-10 — Profile Initialized on Workspace Provisioning

| Aspect | Detail |
| --- | --- |
| **Rule** | A default `NotificationProfile` must be created with sensible channel defaults when a workspace is provisioned. No dispatch attempt may encounter a missing profile for an active workspace. |
| **Enforcement** | Notification context listens to (or is called by) `WorkspaceProvisioned` and initializes the profile before the first possible dispatch. |
| **Violation** | Missing profile during dispatch is a provisioning defect; dispatch service must handle gracefully (use defaults or skip). |

---

### INV-NOTIF-11 — Slack and SMTP Credentials Are Not Owned Here

| Aspect | Detail |
| --- | --- |
| **Rule** | The Notification context must not store encrypted SMTP passwords or Slack OAuth tokens directly. It stores only opaque references (`SlackWebhookReference`) pointing to secrets managed by the `Connector` / Vault. |
| **Enforcement** | Architectural guardrail: the `SlackWebhookReference` is an opaque VO; no cleartext token field exists on the aggregate or in the notification schema. |
| **Violation** | Storing raw credentials in the notification database is a security defect. |

---

## Invariant Summary

| ID | Category | Rule Summary |
| --- | --- | --- |
| INV-NOTIF-01 | Validation | All notifications scoped to one WorkspaceId |
| INV-NOTIF-02 | Validation | Email dispatch requires a valid EmailAddress on profile |
| INV-NOTIF-03 | Validation | Slack channel allowed only for Urgent/Critical urgency |
| INV-NOTIF-04 | Validation | Critical/Urgent notifications bypass dispatch queue — immediate |
| INV-NOTIF-05 | Validation | Digest must not expose sensitive data without consent |
| INV-NOTIF-06 | Validation | InAppNotification title must be non-empty |
| INV-NOTIF-07 | Validation | Slack channel requires non-null SlackWebhookReference |
| INV-NOTIF-08 | Consistency | Dismissed InAppNotification is terminal |
| INV-NOTIF-09 | Consistency | Exactly one NotificationProfile per (WorkspaceId, UserId) |
| INV-NOTIF-10 | Consistency | Profile initialized at workspace provisioning |
| INV-NOTIF-11 | Consistency | No raw credentials stored — opaque references only |
