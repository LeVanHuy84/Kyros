# Aggregate Discovery — Notification Bounded Context

This document details the business capabilities, aggregate candidates, relationships, invariants, and domain boundaries discovered for the **Notification Bounded Context** (Notification Dispatch) of the AI Executive Assistant.

---

## 1. Business Capabilities

The Notification bounded context is responsible for the following business capabilities:

- **Notification Dispatching & Routing**: Routing incoming alerts to configured channels (in-app, email, Slack) based on urgency classifications and user preferences.
- **In-App Notification Management**: Storing panel alerts, tracking read/unread statuses, and handling user dismissals.
- **Notification Template Management**: Defining and rendering formatted templates for individual channels.
- **Consolidated Digests & Reports**: Generating and scheduling periodic email summary reports from user domain data.

---

## 2. Aggregate Candidates

To model the notification engine, the domain defines two Aggregate Candidates:

### 1. In-App Notification Aggregate
- **Why it should be an Aggregate**:
  An In-App Notification has a distinct identity (`NotificationId`), a stateful lifecycle (unread, read, dismissed), and is bound to a single Workspace. Users interact with notifications independently (marking them as read, deleting them).
- **Responsibilities**:
  - Encapsulates: Notification ID, Workspace ID, Title, Content, Urgency Level, Status (Unread, Read, Dismissed), and Timestamp.
  - Manages status transitions (Mark as Read, Dismiss).
- **Consistency Boundary**:
  A single `In-App Notification` instance.
- **Transaction Boundary**:
  Scoped to a single `NotificationId` within a specific `WorkspaceId`.

### 2. Notification Profile Aggregate
- **Why it should be an Aggregate**:
  This represents the channel routing policy of a user/workspace. It maps Urgency Levels to Notification Channels and stores target configurations (such as active subscriptions, Slack webhook references). These preferences must be verified and modified as a single cohesive profile to prevent misconfigured notifications.
- **Responsibilities**:
  - Stores: Profile ID, Workspace ID, User ID, and Channel Mappings (Urgency Level $\rightarrow$ List of Channels).
  - Validates routing configurations.
  - Generates default mappings for new workspaces.
- **Consistency Boundary**:
  The complete routing configuration profile for a workspace/user.
- **Transaction Boundary**:
  Scoped to the `WorkspaceId` and `UserId`.

---

## 3. Aggregate Relationships

The aggregates within the Notification context are decoupled:

### In-App Notification $\leftrightarrow$ Notification Profile (Decoupled)
- **Relationship Type**: Zero-to-Many ($0..*$) routing link.
- **Design Pattern**: **Decoupled**.
- **Reasoning**: The dispatch engine queries the `Notification Profile` to evaluate active channels for an alert. If `In-App` is active, it instantiates an `In-App Notification` aggregate. There is no structural database foreign key or dependency between the two aggregates, keeping them independent.

---

## 4. Business Invariants

Business invariants are rules that must remain true at all times within the Notification context:

1. **Workspace Tenancy Scope**: All notifications, alerts, and profiles must strictly belong to a single `WorkspaceId`. Cross-workspace visibility is prohibited.
2. **Email Channel Requirement**: An email notification must not be dispatched unless a valid email address is configured in the profile.
3. **Slack Channel Urgency Limit**: Slack delivery must only be triggered for notifications classified as `Urgent` or `Critical`.
4. **Critical Alert Queue Bypass**: Notifications marked as `Critical` or `Urgent` must bypass standard delivery queues and be sent immediately.
5. **Digest Data Consent**: Summaries or digests must not render sensitive domain data unless explicit user settings permit it.

---

## 5. Domain Responsibilities

### What the Notification Context Owns
- Database models for `In-App Notification` logs and `Notification Profile` preferences.
- Evaluating urgency levels against channel preferences.
- Populating and rendering notification templates.
- Consolidating and scheduling daily digests.
- Emitting the `NotificationRendered` event upon successful delivery.

### What the Notification Context DOES NOT Own
- **Calculating Event Alarms**: Calendar event reminders are calculated and triggered in the `Calendar` context (which invokes `NotificationDispatchPort`).
- **Slack and SMTP connection credentials**: The encrypted credentials (SMTP passwords, Slack OAuth webhooks) are managed by `Connector` / Vault.
- **Workflow Automation rules**: Rules mapping triggers to notifications are owned by `Workflow`.
