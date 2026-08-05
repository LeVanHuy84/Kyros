# Domain Services — Notification Bounded Context

---

## NotificationDispatchService

### Purpose

Route an incoming alert to channels per **NotificationProfile** and **UrgencyLevel**.

### Why not inside InAppNotification

One dispatch may fan out to Email, Slack, and In-App; creates zero or one **InAppNotification** aggregate plus external sends. Routing reads **NotificationProfile** (separate aggregate) and applies queue policy.

### Responsibilities

- Load **NotificationProfile** for recipient.
- Resolve **ChannelRoutingMap** for urgency.
- Apply **DispatchQueuePolicy** (immediate vs queued).
- Instantiate **InAppNotification** when In-App channel selected.
- Hand off rendered payloads to channel adapters (application/infrastructure).

---

## NotificationTemplateRenderingService

### Purpose

Merge **NotificationTemplateId** with domain parameters into **RenderedNotificationPayload**.

### Why not inside aggregates

Templates are shared catalog assets; rendering is stateless and reused across channels and digests.

### Responsibilities

- Render per channel format (plain/HTML/Slack blocks).
- Enforce digest consent rules on included fields.

---

## DigestCompilationService

### Purpose

Build periodic **Digest** content from aggregated domain summaries.

### Why not inside NotificationProfile

Digests pull cross-domain read models (tasks, events, notes) over a time window; not part of profile aggregate consistency.

### Responsibilities

- Compile summary per **DigestSchedule**.
- Dispatch via email channel if permitted by profile consent settings.

---

## ChannelEligibilityValidationService

### Purpose

Enforce invariants: email requires **EmailAddress**; Slack only for Urgent/Critical.

### Why not only on NotificationProfile

Dispatch path must re-validate at send time in case profile changed or payload urgency escalated.

### Responsibilities

- Filter configured channels to eligible set before send.

---

## Factories

### InAppNotificationFactory

Create **InAppNotification** in **Unread** status from dispatch descriptor.

### NotificationProfileFactory

Create default **ChannelRoutingMap** and empty channel configs for new (**WorkspaceId**, **UserId**).

**Not responsible for**

- Workflow rule evaluation.
- Calendar reminder scheduling.
