# Low-Fidelity Wireframes — Notification Bounded Context

## 1. Screen Catalog

The Notification Bounded Context manages the in-app notification inbox and routes alerts (In-App, Email, Slack) based on urgency classifications and digest settings.

- **Screen 1**: In-App Notification Inbox Center (Notification feed & read states)
- **Screen 2**: Notification Routing Preferences Panel (Channel mapping settings)

---

## 2. Navigation

- **In-App Bell Dropdown**: Users access the **In-App Notification Inbox Center** via a "Bell" notification icon located in the global application header. Clicking it opens a dropdown inbox panel; clicking "See All" opens a full-screen notification center feed.
- **Routing Configuration Settings**: Users navigate to the **Notification Routing Preferences Panel** via "Settings > Notification Settings" in the global navigation menu.

---

## 3. Wireframes

### Screen 1: In-App Notification Inbox Center
- **Purpose**: Let users browse, read, and dismiss real-time workspace alerts (low, normal, urgent, critical).
- **Main Components**:
  - Filter options (Unread, Read, All).
  - List of notifications showing title, content, urgency level badge, and timestamp.
  - "Mark Read" (dot toggle) and "Dismiss" (x button) icons per notification item.
  - Action button: "Mark All Read".
  - Empty-state message ("All caught up!").
- **User Actions**:
  - Toggle read/unread filter.
  - Mark notification as read.
  - Dismiss notification (removes from active feed).
  - Bulk mark all as read.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/notifications`
  - `POST /api/v1/workspaces/{workspaceId}/notifications/{notificationId}/read`
  - `POST /api/v1/workspaces/{workspaceId}/notifications/read-all`
  - `POST /api/v1/workspaces/{workspaceId}/notifications/{notificationId}/dismiss`
- **Use Cases Triggered**:
  - `UC-NOTIF-002: Mark Notification Read / Dismissed`
  - `Query: GetInAppNotificationsQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| [i] Notification Center                     [ Mark All Read]|
|-------------------------------------------------------------|
| Filter: [ Unread v ]                                        |
|-------------------------------------------------------------|
| (*) URGENT: Calendar Event Conflict Detected    | 5 min ago |
|     Event "Lunch Sync" overlaps with Q3 Planning| [O] [x]   |
|-------------------------------------------------+-----------|
| ( ) NORMAL: Task Created: "Review API feedback" | 2 hrs ago |
|     Task added to workspace by AI Agent.        | [ ] [x]   |
|-------------------------------------------------+-----------|
| (*) CRITICAL: Account Security Alert            | 1 day ago |
|     User identity locked due to 5 login failures| [O] [x]   |
+-------------------------------------------------------------+
```

---

### Screen 2: Notification Routing Preferences Panel
- **Purpose**: Let users configure which delivery channels (In-App, Email, Slack) are active for each level of alert urgency, and configure email digest details.
- **Main Components**:
  - Channel Routing Matrix (Urgency levels vs Delivery checkboxes).
  - Email Address input field.
  - Slack Webhook token / Reference key input field.
  - Email Digest Section:
    - Digest Consent checkbox ("Enable periodic email summaries").
    - Digest Schedule text input (cron format or interval dropdown).
  - Save Changes button.
- **User Actions**:
  - Modify routing rules matrix.
  - Update email or Slack credentials.
  - Configure email digest interval.
  - Submit configuration form.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/notification-profile`
  - `PUT /api/v1/workspaces/{workspaceId}/notification-profile`
- **Use Cases Triggered**:
  - `UC-NOTIF-003: Update Notification Profile`
  - `Query: GetNotificationProfileQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Settings / Notification Preferences                 |
|-------------------------------------------------------------|
| Alert Routing Preferences:                                  |
| Urgency   | In-App       | Email        | Slack             |
|-----------+--------------+--------------+-------------------|
| Critical  | [x] Active   | [x] Active   | [x] Active        |
| Urgent    | [x] Active   | [x] Active   | [ ] Active        |
| Normal    | [x] Active   | [ ] Active   | [ ] Active        |
| Low       | [x] Active   | [ ] Active   | [ ] Active        |
|-----------+--------------+--------------+-------------------|
|                                                             |
| Email Address:  [ user@example.com                         ] |
| Slack Webhook:  [ vault-ref-key-123                        ] |
|                                                             |
| Email Digest:                                               |
| [x] Send me email summaries of unread notifications         |
| Frequency: [ Daily (at 08:00 AM)                         v ] |
|                                                             |
|   +---------------+                                         |
|   | Save Profile  |                                         |
|   +---------------+                                         |
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Inbox Alert Interaction Flow
1. A red badge displays over the "Bell" icon, indicating 1 unread alert.
2. User clicks the bell icon. The **In-App Notification Inbox Center** dropdown panel appears.
3. User sees: `URGENT: Calendar Event Conflict Detected`.
4. User clicks the "Mark Read" circle `[O]`.
5. UI makes a `POST /notifications/{id}/read` request.
6. The dot icon transitions to unselected, the header red badge count decrements to 0.
7. User clicks the dismiss icon `[x]`.
8. UI makes a `POST /notifications/{id}/dismiss` request. The notification disappears from the list.

### 2. Notification Profile Adjustment Flow
1. User navigates to Notification Preferences settings screen.
2. User decides to mute email notifications for "Urgent" alerts, and checks "In-App only" instead.
3. User checks "Send me email summaries" and selects "Daily".
4. User clicks "Save Profile".
5. UI submits a `PUT /notification-profile` request.
6. On success, a toast message confirm preferences are updated. Background triggers for calendar and task events immediately conform to these routing rules.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Notification Inbox** | Load unread notifications list | `GET /api/v1/workspaces/{workspaceId}/notifications?status=Unread` | `Query: GetInAppNotifications` |
| **Notification Inbox** | Click Mark Read icon | `POST /api/v1/workspaces/{workspaceId}/notifications/{id}/read` | `UC-NOTIF-002: Mark Read` |
| **Notification Inbox** | Click Mark All Read | `POST /api/v1/workspaces/{workspaceId}/notifications/read-all` | `UC-NOTIF-002: Mark All Read` |
| **Notification Inbox** | Click Dismiss icon | `POST /api/v1/workspaces/{workspaceId}/notifications/{id}/dismiss` | `UC-NOTIF-002: Dismiss Alert` |
| **Preferences Panel** | Load profile details | `GET /api/v1/workspaces/{workspaceId}/notification-profile` | `Query: GetNotificationProfile` |
| **Preferences Panel** | Click Save Profile | `PUT /api/v1/workspaces/{workspaceId}/notification-profile` | `UC-NOTIF-003: Update Profile` |

---

## 6. Screen ↔ Context Mapping

- **Notification Bounded Context** owns all 3 screens described above (inclusive of inbox list/drawers).
- Other contexts publish domain events (e.g., `ReminderTriggered`, `AccountLocked`, `ConnectorSyncFailed`, `ApprovalRequested`, `SessionEscalated`) which are consumed asynchronously by the Notification context (`UC-NOTIF-009`) to dispatch alerts to these user-facing screens.
- **Memory Context** owns general productivity preferences (default task priority, timezone), but actual alert channel routing matrices remain within the Notification Bounded Context profile rules.
- **Connector Bounded Context** provides outbound dispatcher plugins (SMTP Email client, Slack webhook runner) to run physical deliveries, but has no control over policies or screens.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Inbox List Focus Semantics**:
   - The unread/read indicator badges and dismiss actions must have clear labels (`aria-label="Mark notification as read"` and `aria-label="Dismiss notification"`).
   - Use `<div role="feed" aria-busy="false">` for the scrollable list container.
2. **Channel Matrix Access**:
   - The grid table structure in settings must associate urgency headers and channel headers using proper IDs and `headers` attributes on checkbox inputs to let screen readers announce: "Urgent, Slack, Checkbox checked".

### Mobile Responsiveness Notes
1. **Inbox Dropdown to Panel**: On mobile viewports <= 600px, the header Bell dropdown expands to fill the full screen as a floating alert panel to avoid clipped message bubbles.
2. **Routing Table Reflow**: The Channel Routing Matrix table converts to a vertical group of cards (one per urgency level: Critical, Urgent, Normal, Low), each containing its active channel delivery checkboxes.
