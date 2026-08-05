# Ubiquitous Language — Notification Bounded Context

This document defines the core business terms and concepts within the **Notification Bounded Context** (Notification Dispatch) of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. Notification
- **Definition**: A system-generated message dispatched to a user to alert them of changes or scheduled reminders.
- **Synonyms**: Alert, Message Dispatch.
- **Context-Specific Meaning**: Contains title, content, urgency, and is scoped to a single Workspace.

### 2. In-App Notification
- **Definition**: A notification stored and displayed directly within the application's user interface.
- **Synonyms**: Internal Alert, Panel Notification.
- **Context-Specific Meaning**: Persistently stored in the database. Can be marked as Read, Unread, or Dismissed by the user.

### 3. Notification Channel
- **Definition**: The medium used to deliver a notification.
- **Synonyms**: Delivery Medium, Channel.
- **Context-Specific Meaning**: Standard channels are **In-App**, **Email**, and **Slack**. Urgency thresholds govern which channels receive which dispatches.

### 4. Notification Profile
- **Definition**: The user-defined routing rules determining which delivery channels are used based on notification urgency.
- **Synonyms**: Notification Preferences, Routing Settings.
- **Context-Specific Meaning**: Maps Urgency Levels to supported Notification Channels (e.g. Normal Urgency $\rightarrow$ Email and In-App).

### 5. Urgency Level
- **Definition**: The severity or priority of a notification payload.
- **Synonyms**: Severity Level, Notification Priority.
- **Context-Specific Meaning**: Classification values: **Urgent**, **Critical**, **Normal**, and **Low**. Determines routing channel policies.

### 6. Read/Unread Status
- **Definition**: The visual state indicating whether a user has clicked or viewed an In-App Notification.
- **Synonyms**: Notification State.
- **Context-Specific Meaning**: New notifications default to `Unread`. Can transition to `Read`.

### 7. Dismiss
- **Definition**: The user action of acknowledging and clearing an In-App Notification from active views.
- **Synonyms**: Clear, Archive Alert.
- **Context-Specific Meaning**: Permanently updates the notification status to `Dismissed`, hiding it from standard dashboards.

### 8. Notification Template
- **Definition**: A pre-formatted text or HTML structure used to render uniform messages.
- **Synonyms**: Message Template.
- **Context-Specific Meaning**: Populated dynamically with domain parameters (e.g. Task Title, Event Start Time) before dispatch.

### 9. Digest
- **Definition**: A consolidated summary report containing multiple updates sent to a user at configured intervals.
- **Synonyms**: Email Report, Activity Summary.
- **Context-Specific Meaning**: Consolidates tasks, calendar events, and notes. Sent periodically via the Email channel.

### 10. Dispatch Queue
- **Definition**: The internal routing queue that holds non-urgent notifications for throttling, scheduling, or batching.
- **Synonyms**: Delay Queue, Buffer.
- **Context-Specific Meaning**: Normal and Low notifications go through this queue. Urgent and Critical notifications bypass it entirely for immediate delivery.
