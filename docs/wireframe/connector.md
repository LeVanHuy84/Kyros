# Low-Fidelity Wireframes — Connector Bounded Context

## 1. Screen Catalog

The Connector Bounded Context manages integrations with external services (Google Calendar, Slack, GitHub, Notion, Jira), scheduling sync runs, and resolving data conflicts.

- **Screen 1**: Connector Integrations Hub (Directory of integrations & active connections)
- **Screen 2**: Connection Setup Wizard (Form to register/authorize new connector)
- **Screen 3**: Sync Conflict Resolution Panel (Side-by-side manual merge dashboard)

---

## 2. Navigation

- **Directory Navigation**: Users navigate to the **Connector Integrations Hub** via the global settings menu under "Settings > Integrations".
- **Wizard Access**: Clicking "+ Connect Service" in the integrations hub overlay launches the **Connection Setup Wizard** modal.
- **Conflicts Navigation**: An alert banner in the header of the integrations hub indicates outstanding sync conflicts (e.g. "You have 3 unresolved conflicts"). Clicking this link navigates the user to the **Sync Conflict Resolution Panel**.

---

## 3. Wireframes

### Screen 1: Connector Integrations Hub
- **Purpose**: Let users browse supported integrations, audit active connection health, trigger manual sync runs, and suspend/reactivate profiles.
- **Main Components**:
  - Grid of third-party integration cards (Google Calendar, Slack, GitHub, Notion, Jira).
  - Status labels (Active, Suspended, Unauthorized, Syncing).
  - Last sync timestamp & Health metric logs.
  - Action buttons: "Trigger Sync", "Suspend", "Reactivate", "Revoke", "+ Connect Service".
  - Conflicts warning banner ("3 pending conflicts").
- **User Actions**:
  - Trigger manual synchronization saga.
  - Suspend / Reactivate / Revoke active connections.
  - Navigate to conflict manager.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/connectors/connections`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/sync`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/suspend`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/reactivate`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/revoke`
  - `GET /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/health`
- **Use Cases Triggered**:
  - `UC-CON-002: Orchestrate Synchronization (Sync Run)`
  - `UC-CON-004: Enable / Disable Connection`
  - `UC-CON-005: Revoke Connection Authorization`
  - `GetConnectionsQuery`
  - `GetConnectionHealthQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Integrations Hub                   [+ Connect Service] |
|-------------------------------------------------------------|
| [ WARNING: You have 3 unresolved sync conflicts. View now ] |
|-------------------------------------------------------------|
| [ Google Calendar ] Status: ACTIVE      Last Sync: 1 hr ago |
|    Health: OK     Mode: Bidirectional   [Sync Now] [Suspend]|
|-------------------------------------------------------------|
| [ GitHub ]          Status: SUSPENDED   Last Sync: 1 day ago|
|    Health: Suspended by User            [Reactivate]        |
|-------------------------------------------------------------|
| [ Slack ]           Status: UNAUTHORIZED Last Sync: Fail     |
|    Health: OAuth Expired                [Reauthorize]       |
+-------------------------------------------------------------+
```

---

### Screen 2: Connection Setup Wizard
- **Purpose**: Walk users through credential setup, sync modes, and tag filtering parameters.
- **Main Components**:
  - Provider selector dropdown.
  - Sync Mode selection (Bidirectional, OneWayImport, OneWayExport).
  - Filter Rules config input (comma-separated tag filters, project folders).
  - Credentials input segment (OAuth button or API key/Secret input boxes).
  - Actions: "Authorize and Connect", "Cancel".
- **User Actions**:
  - Select provider and sync behavior.
  - Authenticate external service credentials.
  - Submit connection profile.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/reauthorize`
- **Use Cases Triggered**:
  - `UC-CON-001: Register & Authorize Connection`
  - `UC-CON-005: Reauthorize Connection`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
|                                                             |
|                 +---------------------------+               |
|                 |    Connect New Service    |               |
|                 +---------------------------+               |
|                 | Provider:                 |               |
|                 | [ Google Calendar       v ]               |
|                 |                           |               |
|                 | Sync Mode:                |               |
|                 | ( ) Import only           |               |
|                 | ( ) Export only           |               |
|                 | (*) Bidirectional         |               |
|                 |                           |               |
|                 | Filter Tags:              |               |
|                 | [ work, calendar          ]               |
|                 |                           |               |
|                 | Authenticate:             |               |
|                 | +-----------------------+ |               |
|                 | |  Sign In with Google  | |               |
|                 | +-----------------------+ |               |
|                 |                           |               |
|                 |     [ Connect ] [ Cancel ]|               |
|                 +---------------------------+               |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 3: Sync Conflict Resolution Panel
- **Purpose**: Compare diverging local and remote items and select a merge resolution strategy.
- **Main Components**:
  - List of active conflicts.
  - Comparison details panel showing Local vs Remote snapshots side-by-side:
    - Left side: Local Workspace version (fields, timestamps).
    - Right side: Remote Provider version (fields, timestamps).
  - Resolution strategy selectors:
    - "Keep Local Version" button.
    - "Keep Remote Version" button.
    - "Manual Merge" editor fields.
  - Apply Resolution button.
- **User Actions**:
  - Select conflict card.
  - Compare snapshots.
  - Choose strategy and click Apply.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/conflicts`
  - `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connectionId}/conflicts/{conflictId}/resolve`
- **Use Cases Triggered**:
  - `UC-CON-003: Resolve Sync Conflict`
  - `GetSyncConflictsQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Conflict Resolution Manager                     [X] |
|-------------------------------------------------------------|
| Conflicts: (1) Event: "Q3 Planning" | (2) Task: "Review docs"|
|=============================================================|
| Diverged Resource: Q3 Planning (Event)                      |
|-------------------------------------------------------------|
| LOCAL WORKSPACE VERSION       | REMOTE PROVIDER VERSION     |
| Title: Q3 Planning Session     | Title: Q3 Sync (Google Cal) |
| Time:  14:00 - 16:00          | Time:  15:00 - 16:00        |
| Mod:   2026-08-02 20:10       | Mod:   2026-08-02 20:12     |
|-------------------------------+-----------------------------|
| Resolution Strategy:                                        |
| (*) Use Local State  ( ) Use Remote State  ( ) Manual Merge |
|                                                             |
|                          +-------------------+              |
|                          | Apply Resolution  |              |
|                          +-------------------+              |
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Connection Authorization and Bootstrap Sync
1. User clicks "+ Connect Service" in the Hub Settings.
2. User selects "Google Calendar" and chooses "Bidirectional Sync".
3. User clicks "Sign In with Google" which redirects through OAuth.
4. Upon return, User clicks "Connect".
5. UI registers the connection profile using `POST /connectors/connections`. Plaintext credentials are encrypted into the vault.
6. UI triggers the bootstrap sync run using `POST /connections/{connectionId}/sync`.
7. Once finished, a notification digest summaries the imported events.

### 2. Conflict Identification and Resolution
1. During a background sync run, an external task update has diverged from a local modification.
2. The connector creates a `SyncConflict` aggregate, stops updating the resource, and publishes a warning alert.
3. User notices the "Conflicts warning banner" and clicks "View now".
4. The Conflict Panel renders both local and remote details.
5. User determines the remote version has the correct time and selects "Use Remote State".
6. User clicks "Apply Resolution".
7. UI issues `POST /conflicts/{conflictId}/resolve` (strategy: UseRemote).
8. The connector invokes `TodoPort.updateTask` or `CalendarPort.rescheduleEvent` to apply the remote changes locally.
9. Conflict transitions to `RESOLVED` and is removed from the conflict panel list.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Integrations Hub** | Load connections list | `GET /api/v1/workspaces/{workspaceId}/connectors/connections` | `Query: GetConnections` |
| **Integrations Hub** | Click Sync Now | `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{id}/sync` | `UC-CON-002: Trigger Sync` |
| **Integrations Hub** | Click Suspend Connection | `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{id}/suspend` | `UC-CON-004: Suspend Connection`|
| **Integrations Hub** | Click Reactivate | `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{id}/reactivate` | `UC-CON-004: Reactivate Connection`|
| **Setup Wizard Modal**| Authenticate & submit | `POST /api/v1/workspaces/{workspaceId}/connectors/connections` | `UC-CON-001: Register Connection` |
| **Conflict Dashboard**| Load conflicts list | `GET /api/v1/workspaces/{workspaceId}/connectors/connections/{id}/conflicts` | `Query: GetSyncConflicts` |
| **Conflict Dashboard**| Click Apply Resolution | `POST /api/v1/workspaces/{workspaceId}/connectors/connections/{connId}/conflicts/{id}/resolve` | `UC-CON-003: Resolve Conflict` |

---

## 6. Screen ↔ Context Mapping

- **Connector Bounded Context** owns all 3 integration/conflict screens described above.
- Inbound adapters translate third-party data and call downstream **Todo** and **Calendar** ports to synchronize data, but those contexts have no ownership of these integration screens.
- **Notification Context** listens for connection failures (`ConnectorSyncFailed`) to trigger system-wide alerts, which link users back to the Hub Dashboard or Conflict Panel.
- **AI Agent** registry tools call connector ports directly when sending outbound communications (e.g. email tool), but do not manage setup dashboard controls.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Interactive Comparison View**:
   - The comparison grids on the Conflict Resolution panel must use tabular layouts with correct labels (`scope="col"`, `scope="row"`).
   - Side-by-side versions must have clear alternative descriptions for screen readers (e.g. `aria-label="Local version: booked at 2:00 PM"` vs `aria-label="Remote version: booked at 3:00 PM"`).
2. **Saga Sync Shimmers**:
   - Triggering sync should announce a loading state via `aria-busy="true"` on the syncing card/button, and announce sync completion or failures dynamically.

### Mobile Responsiveness Notes
1. **Side-by-Side to Stacked View**: On screen widths <= 600px, the side-by-side local vs remote comparison columns in the conflict manager stack vertically, showing local details above remote details.
2. **Action Items Reachability**: Large touchpoints are provided for connection toggles and authorization buttons.

