# Low-Fidelity Wireframes — AI Agent Bounded Context

## 1. Screen Catalog

The AI Agent Bounded Context manages the conversational interface and planner execution loop (Goal -> Plan -> Approve -> Execute -> Reflection).

- **Screen 1**: AI Chat Assistant Interface (Primary dashboard within the application shell)
- **Screen 2**: Plan Execution & Progress Tracker Panel (Right-hand sliding drawer showing live execution status)
- **Screen 3**: Plan Approval Modal Dialog (Human-in-the-loop validation overlay block with countdown)
- **Screen 4**: Session History Directory (Dashboard page listing past goals)
- **Screen 5**: Pending Approvals Queue Dashboard (A queue listing unresolved plan requests)
- **Screen 6**: Session History Detail View (Timeline and parameter audit trail for a selected past session)

---

## 2. Global Application Shell & Navigation

All main screens are rendered inside the **Global Application Shell**.

```
+---------------------------------------------------------------------------------+
| Workspace Switcher [My Workspace v] | Global Header: AI Assistant  [Bell Badge] |
|-------------------------------------+-------------------------------------------|
| Nav Sidebar:                        |                                           |
| - [Chat] (Active)                   |                                           |
| - [Tasks]                           |               MAIN CONTENT                |
| - [Calendar]                        |                   AREA                    |
| - [Integrations]                    |                                           |
| - [Settings]                        |                                           |
|-------------------------------------|                                           |
| Profile: Jane Doe [Logout]          |                                           |
+---------------------------------------------------------------------------------+
```

- **Sidebar Menu**: Clicking sidebar items navigates the user between Bounded Context screens (Workspace, Todo, Calendar, Connector, Notification, and Agent Chat).
- **Collapsible Plan Drawer**: Screen 2 slides in from the right edge over the main content area of the Chat screen when a session is active.
- **Header Icons**:
  - The **Bell Badge** opens the Notification Inbox dropdown.
  - The **History Toggle** (clock icon) in the Chat header navigates to the **Session History Directory** (Screen 4).
  - The **Queue Icon** (list-check icon) in the Chat header opens the **Pending Approvals Queue** (Screen 5).
- **Persistent Banners**: If a session is in the `AwaitingApproval` state, a sticky alert banner appears at the top of the Chat dashboard allowing users to re-open the Approval Modal (Screen 3) if dismissed.

---

## 3. Wireframes

### Screen 1: AI Chat Assistant Interface (Default Onboarding / Conversational View)
- **Purpose**: Let users ask questions, submit high-level goals, select suggestion chips, and view chat history with grounded citations.
- **Main Components**:
  - **Conversational Stream**: Scrollable container of alternating User and Agent bubbles.
    - **Welcome State (Empty Chat)**: Displayed when there is no active chat history. Shows product introduction and Goal suggestion chips (e.g., "Schedule Q3 planning session").
    - **Citations Widget**: Visual tags below Agent bubbles. Clicking a tag displays the **Citation Source Popup** overlay containing the already-retrieved `snippetText` and `documentId`. No full document-fetch is performed (aligned with the API).
  - **Intent Mode Switcher**: A segmented control toggle: `[ Mode: Goal Planner ] [ Mode: Q&A Question ]` to prevent mixed-intent input ambiguity.
  - **Chat Input Bar**: Text area and Send button. Disabled while planning is in progress.
  - **Loading Indicators**: Shimmer text showing `[Planning steps...]` or `[Searching sources...]` while in-flight.
- **User Actions**:
  - Select mode.
  - Enter goal or question, click Send.
  - Click suggestion chip to prefill goal.
  - Click citation tag (opens inline snippet box).
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/agent/sessions` (Goal Mode)
  - `POST /api/v1/workspaces/{workspaceId}/agent/qa` (Question Mode)
- **Use Cases Triggered**:
  - `UC-AGENT-001: Submit Goal & Generate Plan`
  - `UC-AGENT-006: Answer Grounded Chat Question (QA)`

#### ASCII Wireframe:
```
+---------------------------------------------------------------------------------+
| Switcher [My Workspace v] | AI Executive Assistant    [Pending Q] [History] [Pln|]
|---------------------------+-----------------------------------------------------|
| Nav:                      | Welcome! I am your AI Executive Assistant.          |
| > Chat (Active)           | How can I help you today?                           |
| - Tasks                   | Suggestion Chips:                                   |
| - Calendar                | [Book Q3 sync tomorrow]  [Summarize my deliverables]|
| - Integrations            |-----------------------------------------------------|
| - Settings                | Mode Select: [ Goal Planner ] ( ) Q&A Question      |
|                           | [ Type a goal or submit an instruction...         ] |
|                           |                                            [ Send ] |
+---------------------------------------------------------------------------------+
```

---

### Screen 2: Plan Execution & Progress Tracker Panel (Drawer)
- **Purpose**: Real-time tracker for the active planner session.
- **Main Components**:
  - **Empty State**: Displays "No active session in progress. Submit a goal to see live progress" when `getActiveSession` returns null.
  - **Status Tag**: Planning, Executing, Succeeded, Failed, Escalated.
  - **Remediation Actions**: Visible only on `Failed` or `Escalated` status:
    - "View Failure Details" button (navigates to Screen 6).
    - "Resubmit Goal" button (calls `POST /sessions` to start planning again).
  - **Step Timeline**: Renders ordered steps:
    - `[?]` Pending
    - `[>]` Running
    - `[x]` Succeeded
    - `[!]` Failed
  - **Connection Spec**: Driven by Server-Sent Events (SSE) for progress streaming. Fallback: polling `GET /sessions/{sessionId}` every 5s with backoff.
  - **Out of Scope Button**: "Stop Execution" is removed from the active UI since cancellation is out of scope of the application model.
- **User Actions**:
  - Toggle progress panel visibility.
  - Resubmit failed goal.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/agent/sessions/active`
  - `GET /api/v1/workspaces/{workspaceId}/agent/sessions/{sessionId}`
- **Use Cases Triggered**:
  - `Query: GetActiveSessionQuery / GetAgentSessionQuery`

#### ASCII Wireframe:
```
+------------------------------------+
| Active Session Tracker         [X] |
|------------------------------------|
| Goal: Book meeting and email John  |
| Status: EXECUTING                  |
| Re-plan Attempts: 1 / 3            |
| Updates via SSE: connected         |
|------------------------------------|
| Steps:                             |
| [x] 1. Check calendar collisions    |
| [>] 2. Create "Q3 Sync" Event      |
| [?] 3. Send email to John          |
|------------------------------------|
| (No cancel button - API out of scope)|
+------------------------------------+
```

---

### Screen 3: Plan Approval Modal Dialog (Overlay)
- **Purpose**: Block user interaction while acquiring explicit plan approval, displaying countdown constraints.
- **Main Components**:
  - **Countdown Timer**: "This approval request will expire in `mm:ss`". Displays time remaining before `expiresAt`.
  - **Step Snapshot list**: Renders steps with tool references and parameters.
  - **Expired Overlay**: Blurs the plan, replaces buttons with "This request has expired and the session has escalated." and a "Dismiss & Resubmit" button.
  - **Action buttons**: "Approve Plan" (triggers loop), "Reject Plan" (re-plans session).
  - **Out of Scope Input**: Optional feedback notes text box is removed because `ResolveApprovalRequest` does not support comments at the API schema level. Rejection triggers automated re-planning based on history.
- **User Actions**:
  - Approve or Reject plan.
  - Dismiss expired request.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/agent/approvals/{approvalId}/resolve`
- **Use Cases Triggered**:
  - `UC-AGENT-002: Resolve Approval Request`

#### ASCII Wireframe:
```
+---------------------------------------------------------------------------------+
|                                                                                 |
|                +-----------------------------------------------+                |
|                | Plan Approval Required   [Time Left: 04:59]   |                |
|                +-----------------------------------------------+                |
|                | The AI requires approval to execute:          |                |
|                |                                               |                |
|                | 1. CalendarPort.createEvent                   |                |
|                |    "Create event: Q3 Planning tomorrow at 2PM"|                |
|                | 2. Connector.sendEmail                        |                |
|                |    "Send agenda to John"                      |                |
|                |                                               |                |
|                |     +---------------+     +---------------+   |                |
|                |     |  Approve Plan |     |  Reject Plan  |   |                |
|                |     +---------------+     +---------------+   |                |
|                +-----------------------------------------------+                |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

---

### Screen 4: Session History Directory
- **Purpose**: Search, filter, and page historical agent goals and outcomes.
- **Main Components**:
  - **Search Input Box**: Filters goals matching keywords.
  - **Status Filter Dropdown**: Option to filter list by status (All, Succeeded, Failed, Escalated).
  - **Session Matrix Grid**: Displays Date, Goal, Status, and Step Count.
  - **Pagination Footer**: Prev/Next controls showing page metadata.
  - **Empty History State**: Displays "No past sessions found. Enter your first goal in the chat box to begin."
- **User Actions**:
  - Input keywords.
  - Filter list by status.
  - Navigate pages.
  - Click session row (navigates to History Detail View - Screen 6).
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/agent/sessions`
- **Use Cases Triggered**:
  - `Query: List agent sessions`

#### ASCII Wireframe:
```
+---------------------------------------------------------------------------------+
| Header: Session History                                                     [X] |
|---------------------------------------------------------------------------------|
| Search: [ Q3...      ]  Status: [ Failed       v ]                              |
|---------------------------------------------------------------------------------|
| Date       | Goal Text                     | Status    | Steps | Actions        |
|------------+-------------------------------+-----------+-------+----------------|
| 2026-08-01 | Sync repository and compile   | FAILED    | 3     | [View Details] |
| 2026-07-29 | Compile Q3 financials report  | FAILED    | 2     | [View Details] |
|------------+-------------------------------+-----------+-------+----------------|
| [Prev] Page 1 of 1 [Next]                                                       |
+---------------------------------------------------------------------------------+
```

---

### Screen 5: Pending Approvals Queue Dashboard
- **Purpose**: Recover and resolve plan approvals that were closed, missed, or reloaded.
- **Main Components**:
  - List of pending approval requests containing goal text, plan snapshot, and expiration countdown.
  - "Open Approval Modal" action button per item.
  - Empty State: "No pending approval requests."
- **User Actions**:
  - View queue.
  - Click Open to launch approval window.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/agent/approvals`
  - `GET /api/v1/workspaces/{workspaceId}/agent/approvals/{approvalId}`
- **Use Cases Triggered**:
  - `Query: List pending approvals`

#### ASCII Wireframe:
```
+---------------------------------------------------------------------------------+
| Header: Pending Approvals Queue                                             [X] |
|---------------------------------------------------------------------------------|
| Goal Text                        | Expiration | Status  | Action                |
|----------------------------------+------------+---------+-----------------------|
| "Book Q3 sync tomorrow"          | 04 min 30s | PENDING | [Open Approval Modal] |
| "Compile repository and sync"    | 12 min 15s | PENDING | [Open Approval Modal] |
|----------------------------------+------------+---------+-----------------------|
| Total: 2 pending approvals                                                      |
+---------------------------------------------------------------------------------+
```

---

### Screen 6: Session History Detail View
- **Purpose**: Audit plan steps, parameters, failure reason logs, and retry goals from past sessions.
- **Main Components**:
  - Session metadata block (goal text, initial start time, status, replanCount).
  - Step timeline grid showing Step description, tool name, resolved parameter payload, status (Succeeded, Failed), and failure logs.
  - Retry Goal button (copies goal to chat interface and submits).
- **User Actions**:
  - Inspect steps audit log.
  - Trigger goal retry.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/agent/sessions/{sessionId}`
  - `POST /api/v1/workspaces/{workspaceId}/agent/sessions` (on Retry action)
- **Use Cases Triggered**:
  - `Query: GetAgentSessionQuery`
  - `UC-AGENT-001: Submit Goal`

#### ASCII Wireframe:
```
+---------------------------------------------------------------------------------+
| Header: Session Audit Detail                                                [X] |
|---------------------------------------------------------------------------------|
| Goal: Sync repository and compile                                               |
| Status: FAILED (Failed on step 2; Re-plan count reached limit of 3)             |
| Re-plans: 3 / 3    Started: 2026-08-01 10:15                                    |
|---------------------------------------------------------------------------------|
| Step Details:                                                                   |
| 1. [x] Fetch Github Changes (Tool: Connector.fetchChanges, parameters: {...})  |
| 2. [!] Run Compiler Build    (Tool: Connector.pushChanges, parameters: {...})   |
|    - Error Log: "Process exited with compilation errors: 15 errors found."     |
| 3. [?] Notify Developers     (Tool: Notification.dispatch - Skipped)            |
|---------------------------------------------------------------------------------|
| [ Resubmit Goal as New Session ]                                                |
+---------------------------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Goal Planning, Approval, and Live Progress Updates
1. User sets the switcher to **Goal Planner** mode on Screen 1, inputs their goal: `"Sync code and create tasks"`, and clicks **Send**.
2. Chat area displays an in-flight loading card `[Planning steps...]` while `POST /sessions` is in-flight.
3. Once generated, a top-level alert banner notifies the user: `"Plan generated. Approval required."` and launches the **Plan Approval Modal Dialog** (Screen 3) on top of the chat window.
4. The modal shows step summaries and a live countdown timer ticking down to `expiresAt`.
5. User clicks **Approve Plan**. The modal closes, and the **Plan Execution & Progress Tracker Panel** drawer (Screen 2) slides open on the right edge.
6. The drawer opens an SSE connection subscribing to status changes. Steps animate from pending `[?]` through running `[>]` to succeeded `[x]` as the backend pushes updates.
7. Upon final step completion, status transitions to `Succeeded` and the tracker sidebar shows a summary check.

### 2. Recovery of Pending Approvals (Reload/Dismiss Handling)
1. During step 3 of the flow above, the user accidentally reloads the page or dismisses the modal to query chat details first.
2. The user-facing dashboard displays a persistent warning banner: `"Active session awaiting approval. Click to open [Review Plan]"` in the header.
3. Alternatively, the user clicks the **Pending Q** header icon to open the **Pending Approvals Queue Dashboard** (Screen 5).
4. The queue shows the active request. User clicks **Open Approval Modal** to restore the countdown modal (Screen 3) and completes resolution.

### 3. Expiration and Escalation remediation
1. A pending plan is left unresolved. The countdown timer in the approval modal hits `00:00`.
2. UI receives `ApprovalExpired` event via SSE. The modal displays the blur "Expired" overlay, disabling standard options.
3. User clicks "Dismiss". The modal closes.
4. The Tracker Drawer indicates the session is `ESCALATED` due to expiration.
5. User clicks the **Resubmit Goal** button. The original goal text is fed back to the planner, triggering a new planning transaction.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **AI Chat** | Submit goal text | `POST /api/v1/workspaces/{workspaceId}/agent/sessions` | `UC-AGENT-001: Submit Goal` |
| **AI Chat** | Submit question | `POST /api/v1/workspaces/{workspaceId}/agent/qa` | `UC-AGENT-006: Answer Grounded QA` |
| **Plan Tracker Drawer** | Load active progress | `GET /api/v1/workspaces/{workspaceId}/agent/sessions/active` | `Query: GetActiveSession` |
| **Plan Tracker Drawer** | Resubmit escalated goal | `POST /api/v1/workspaces/{workspaceId}/agent/sessions` | `UC-AGENT-001: Submit Goal` |
| **Plan Approval Modal** | Click Approve | `POST /api/v1/workspaces/{workspaceId}/agent/approvals/{approvalId}/resolve` (Approved) | `UC-AGENT-002: Resolve Approval` (Approve) |
| **Plan Approval Modal** | Click Reject | `POST /api/v1/workspaces/{workspaceId}/agent/approvals/{approvalId}/resolve` (Rejected) | `UC-AGENT-002: Resolve Approval` (Reject) |
| **Approvals Queue** | List pending requests | `GET /api/v1/workspaces/{workspaceId}/agent/approvals` | `Query: List pending approvals` |
| **Session History** | Search, filter & page | `GET /api/v1/workspaces/{workspaceId}/agent/sessions` | `Query: List agent sessions` |
| **Session History Detail**| Load audit details | `GET /api/v1/workspaces/{workspaceId}/agent/sessions/{sessionId}` | `Query: GetAgentSessionQuery` |
| **Session History Detail**| Click Resubmit Goal | `POST /api/v1/workspaces/{workspaceId}/agent/sessions` | `UC-AGENT-001: Submit Goal` |

---

## 6. Screen ↔ Context Mapping

- **AI Agent Bounded Context** owns all 6 screens, approval flows, and audit dashboards.
- **Memory Context** maintains historical chat logging (`UC-AGENT-008`), but does not control the chat input or mode classification toggles.
- **Notification Context** routes the `ApprovalRequested` and `SessionEscalated` event dispatches, steering the user back to the Approvals Queue or Tracker Panel.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Plan Approval Modal**:
   - Must trap keyboard focus within the dialog bounds.
   - Pressing `Esc` closes the modal (if dismissible).
   - Dialog element must carry `role="dialog"` and `aria-modal="true"`.
2. **Progress Panel Drawer**:
   - Must expose `aria-expanded` and `aria-controls` bindings on the trigger button.
   - Transitions must be announced via a polite live region: `<div aria-live="polite">` so screen-readers hear "Step 2 Running" or "Session Succeeded".
3. **Progress Indicators**:
   - Status states (`Succeeded`, `Failed`) must include text descriptors alongside visual icons to avoid reliance on color alone.

### Mobile Responsiveness Notes
1. **Collapsible Drawer**: On viewports <= 600px, the Plan Tracker drawer transitions to a full-screen overlay, centering action items.
2. **Approval Overlay**: The approval window displays as a bottom-sheet component on mobile screens. Touch targets for "Approve" and "Reject" are styled with a minimum height of 48px to prevent overlap taps.
3. **Tables**: The session history grid collapses to a vertical card stack on small viewports, prioritizing the goal text and status badge.
