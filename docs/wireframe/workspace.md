# Low-Fidelity Wireframes — Workspace Bounded Context

## 1. Screen Catalog

The Workspace Bounded Context handles data separation boundaries and workspace lifecycles (rename, suspend, reactivate, archive).

- **Screen 1**: Workspace Settings Panel (User / Owner self-service settings)
- **Screen 2**: Platform Workspace Admin Directory (System Operator only)

---

## 2. Navigation

- **User Self-Service Navigation**: The active workspace owner navigates to the **Workspace Settings Panel** via the settings cog on the global navigation sidebar under "Settings > Workspace Settings".
- **Admin Navigation**: System operators navigate to the **Platform Workspace Admin Directory** via the platform sidebar under "Admin Console > Workspaces".

---

## 3. Wireframes

### Screen 1: Workspace Settings Panel
- **Purpose**: Let workspace owners view workspace identifiers and rename their workspace tenant.
- **Main Components**:
  - Read-only Workspace ID value display.
  - Read-only Owner ID value display.
  - Workspace Name text input field.
  - Save Name button ("Save Changes").
  - Warning banner (indicating that renaming is disallowed if the workspace is suspended).
- **User Actions**:
  - Edit name input.
  - Save new workspace name.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}` (to load initial details)
  - `PATCH /api/v1/workspaces/{workspaceId}`
- **Use Cases Triggered**:
  - `UC-WS-003: Rename Workspace`
  - `GetWorkspaceDetailsQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: AI Assistant  [Workspace: Default]   [Profile Icon] |
|-------------------------------------------------------------|
| Settings / Workspace Settings                               |
|-------------------------------------------------------------|
|                                                             |
|  Workspace ID:   ws-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d     |
|  Owner ID:       usr-1234-5678                              |
|  Status:         ACTIVE                                     |
|                                                             |
|  Workspace Name:                                            |
|  [ Jane's Primary Workspace                                ] |
|                                                             |
|  +----------------+                                         |
|  | Save Changes   |                                         |
|  +----------------+                                         |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 2: Platform Workspace Admin Directory
- **Purpose**: Admin dashboard for platform-level operators to audit and manage tenant lifecycles.
- **Main Components**:
  - Table of workspaces showing ID, Name, Owner ID, and Status (ACTIVE, SUSPENDED, ARCHIVED).
  - Selected workspace detail panel.
  - Lifecycle management triggers:
    - Suspend button (only active if status is ACTIVE).
    - Reactivate button (only active if status is SUSPENDED).
    - Archive button (only active if status is SUSPENDED; terminal warning modal).
- **User Actions**:
  - Browse workspace directory.
  - Click Suspend, Reactivate, or Archive on a workspace.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/suspend`
  - `POST /api/v1/workspaces/{workspaceId}/reactivate`
  - `POST /api/v1/workspaces/{workspaceId}/archive`
- **Use Cases Triggered**:
  - `UC-WS-004: Suspend Workspace`
  - `UC-WS-005: Reactivate Workspace`
  - `UC-WS-006: Archive Workspace`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Admin Console | Workspaces               [Operator] |
|-------------------------------------------------------------|
| Workspace ID   | Name               | Owner ID   | Status   |
|----------------+--------------------+------------+----------|
| ws-1234-5678   | John's Workspace   | usr-9999   | ACTIVE   |
| ws-8888-9999   | Spam Tenant        | usr-5555   | SUSPENDED|
| ws-aaaa-bbbb   | Old Workspace      | usr-2222   | ARCHIVED |
|----------------+--------------------+------------+----------|
|                                                             |
|=============================================================|
| Selected Workspace Details: ws-8888-9999 (Spam Tenant)      |
| Current Status: SUSPENDED                                   |
| Actions:  +--------------+  +--------------+                |
|           |  Reactivate  |  |  Archive WS  |                |
|           +--------------+  +--------------+                |
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Rename Workspace Flow
1. User clicks the "Settings" icon and selects "Workspace Settings".
2. UI loads workspace details from the API.
3. User edits the "Workspace Name" field.
4. User clicks "Save Changes".
5. UI makes a `PATCH` request.
6. On success, name is updated in the workspace header display, and a toast message "Workspace renamed successfully" appears.

### 2. Workspace Decommission Flow (System Operator)
1. System Operator navigates to the Workspaces Administration screen.
2. Operator selects a workspace.
3. If the workspace is currently active, Operator clicks "Suspend Workspace". The status updates to `SUSPENDED`.
4. To permanently delete the data, the Operator clicks "Archive WS".
5. A confirmation dialog appears: "Are you sure? Archiving a workspace is irreversible and places the workspace in a terminal read-only state."
6. Operator confirms. Status updates to `ARCHIVED`, and all action buttons are disabled.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Workspace Settings** | Load screen | `GET /api/v1/workspaces/{workspaceId}` | `GetWorkspaceDetailsQuery` |
| **Workspace Settings** | Click Save Changes | `PATCH /api/v1/workspaces/{workspaceId}` | `UC-WS-003: Rename Workspace` |
| **Workspace Admin** | Click Suspend | `POST /api/v1/workspaces/{workspaceId}/suspend` | `UC-WS-004: Suspend Workspace` |
| **Workspace Admin** | Click Reactivate | `POST /api/v1/workspaces/{workspaceId}/reactivate` | `UC-WS-005: Reactivate Workspace` |
| **Workspace Admin** | Click Archive | `POST /api/v1/workspaces/{workspaceId}/archive` | `UC-WS-006: Archive Workspace` |

---

## 6. Screen ↔ Context Mapping

- **Workspace Bounded Context** owns both screens described above.
- Inbound validation (`UC-WS-002`) operates at the platform/interceptor level, checking that every single HTTP request across all contexts (Todo, Calendar, Notification, etc.) matches the tenant ownership before routing to their respective screens.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Destructive Actions Warnings**:
   - The Archive Workspace dialog must include clear, high-contrast warning text and utilize `aria-describedby` to associate the confirmation description with the modal dialog wrapper.
2. **Form Controls**:
   - The Workspace Rename field must have an explicit accessible name, and show loading shimmers during name save requests using `aria-busy="true"`.

### Mobile Responsiveness Notes
1. **Forms Reflow**: Workspace settings forms scale to full width on mobile viewports.
2. **Admin Directory Cards**: Workspaces list grid collapses to card items, wrapping the workspace UUID values to prevent overflow cropping on screens under 360px wide.

