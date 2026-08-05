# Low-Fidelity Wireframes — Todo Bounded Context

## 1. Screen Catalog

The Todo Bounded Context manages task CRUD lifecycles, prioritisations, categorisation tags, recurrence patterns, and soft-delete restorations.

- **Screen 1**: Task Board / List Dashboard (Main task manager view)
- **Screen 2**: Task Details Drawer (Sliding detail sidebar panel)
- **Screen 3**: Task Editor Modal (Form for creation and updates)
- **Screen 4**: Trash Recovery Dashboard (Soft-deleted items directory)

---

## 2. Navigation

- **Primary Navigation**: Users access the **Task Board / List Dashboard** via the global sidebar navigation link "Tasks".
- **Details Drawer**: Clicking on any task item in the board opens the **Task Details Drawer** sliding in from the right side of the screen.
- **Form Overlay**: Clicking "+ Add Task" or "Edit" opens the **Task Editor Modal** center-screen.
- **Trash Bin**: Users click the "Trash Can" icon in the task board header to open the **Trash Recovery Dashboard**.

---

## 3. Wireframes

### Screen 1: Task Board / List Dashboard
- **Purpose**: Let users browse, search, filter, and quick-complete active workspace tasks.
- **Main Components**:
  - Filter bar (filter by tag, priority, search text, toggle "Include Completed").
  - Sorting options (Priority, Due Date, Created Date).
  - Search bar.
  - Task List structured as groups/columns (High, Medium, Low priority or status cards).
  - Quick-complete checkbox per task.
  - Action buttons: "+ Add Task" and "View Trash Bin".
- **User Actions**:
  - Search tasks.
  - Toggle completed tasks display.
  - Click checkbox (completes/reopens task).
  - Click task card (opens detail drawer).
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/tasks`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/complete`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/reopen`
- **Use Cases Triggered**:
  - `UC-TODO-011: List / Filter Tasks`
  - `UC-TODO-005: Complete Task`
  - `UC-TODO-010: Reopen Completed Task`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Tasks Dashboard               [ Trash ]  [+ Add Task] |
|-------------------------------------------------------------|
| Search: [ Prepare... ]  Filter: [ Tag v ] [ Priority v ]    |
|-------------------------------------------------------------|
| [ ] Prepare Q3 report draft              | Priority: HIGH   |
|     Tags: [ work ] [ report ]            | Due: 2026-08-10  |
|------------------------------------------+------------------|
| [x] Call John to confirm sync time       | Priority: MEDIUM |
|     Tags: [ phone ]                      | Completed        |
|------------------------------------------+------------------|
| [ ] Review API design feedback           | Priority: LOW    |
|     Tags: [ docs ]                       | Due: 2026-08-15  |
+-------------------------------------------------------------+
```

---

### Screen 2: Task Details Drawer
- **Purpose**: Show a comprehensive metadata view of a single task and manage tags and recurrence rules.
- **Main Components**:
  - Title and status (Active, Completed, Soft-Deleted).
  - Description display block.
  - Tags list container with tags and "x" buttons (to remove) and "+ Add Tag" button.
  - Recurrence rules panel displaying the active pattern (RRule) and status (Active, Paused, Stopped) with action toggles.
  - Primary actions: "Edit Details", "Delete Task", "Complete Task / Reopen Task".
- **User Actions**:
  - Trigger deletion.
  - Modify task status (complete/reopen).
  - Remove specific tags.
  - Pause / Resume / Stop Recurrence schedules.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/tasks/{taskId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/tasks/{taskId}/tags/{tag}`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/recurrence/pause`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/recurrence/resume`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/recurrence/stop`
  - `DELETE /api/v1/workspaces/{workspaceId}/tasks/{taskId}`
- **Use Cases Triggered**:
  - `GetTaskQuery`
  - `UC-TODO-008: Manage Task Tags` (remove step)
  - `UC-TODO-009: Pause / Resume / Stop Recurrence`
  - `UC-TODO-003: Soft-Delete Task`

#### ASCII Wireframe:
```
+------------------------------------+
| Task Details Drawer            [X] |
|------------------------------------|
| TITLE: Prepare Q3 report draft     |
| Status: ACTIVE                     |
|------------------------------------|
| DESCRIPTION: Include financial     |
| summaries and team KPIs.           |
|------------------------------------|
| TAGS:                              |
| [ work (x) ] [ report (x) ] [+ Tag]|
|------------------------------------|
| RECURRENCE:                        |
| Rule: "FREQ=WEEKLY;BYDAY=FR"       |
| Status: Active                     |
| Actions:  [Pause]  [Stop]          |
|------------------------------------|
| [ Edit Task ]        [ Delete (x) ]|
+------------------------------------+
```

---

### Screen 3: Task Editor Modal
- **Purpose**: Gather input fields to create a new task or edit details of an existing one.
- **Main Components**:
  - Task Title text input field (required).
  - Description textarea.
  - Priority dropdown selector (Low, Medium, High).
  - Due Date date-time picker.
  - Tags field (comma-separated or inline tags builder).
  - Recurrence Config sub-section:
    - Recurrence toggle checkbox ("Repeats...").
    - Recurrence Frequency dropdown (Daily, Weekly, Monthly).
    - RRule text input.
  - Actions: "Save Task", "Cancel".
- **User Actions**:
  - Input task data.
  - Configure recurrence options.
  - Submit form to create or edit.
- **API Used**:
  - `POST /api/v1/workspaces/{workspaceId}/tasks`
  - `PUT /api/v1/workspaces/{workspaceId}/tasks/{taskId}`
  - `PUT /api/v1/workspaces/{workspaceId}/tasks/{taskId}/recurrence`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/tags`
- **Use Cases Triggered**:
  - `UC-TODO-001: Create Task`
  - `UC-TODO-002: Update Task`
  - `ConfigureRecurrenceCommand`
  - `UC-TODO-008: Manage Task Tags` (add step)

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
|                                                             |
|                 +---------------------------+               |
|                 |       Edit Task           |               |
|                 +---------------------------+               |
|                 | Title: *                  |               |
|                 | [ Prepare Q3 report draft ]               |
|                 |                           |               |
|                 | Description:              |               |
|                 | [ Include summaries...    ]               |
|                 |                           |               |
|                 | Priority:       Due Date: |               |
|                 | [ High      v]  [10/10/26 ]               |
|                 |                           |               |
|                 | Tags (separate by comma): |               |
|                 | [ work, report            ]               |
|                 |                           |               |
|                 | [x] Configure Recurrence  |               |
|                 | Frequency: [ Weekly    v] |               |
|                 | RRule: [FREQ=WEEKLY;... ] |               |
|                 |                           |               |
|                 |     [ Save ]   [ Cancel ] |               |
|                 +---------------------------+               |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 4: Trash Recovery Dashboard
- **Purpose**: Lists soft-deleted tasks that are still within the 2-hour retention window.
- **Main Components**:
  - Table of soft-deleted tasks showing Title, Delete Timestamp, and remaining time before purge.
  - Action button: "Recover Task".
  - Empty-state helper message when no items reside in the recovery window.
- **User Actions**:
  - View soft-deleted tasks.
  - Recover a task back to the active list.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/tasks/deleted`
  - `POST /api/v1/workspaces/{workspaceId}/tasks/{taskId}/recover`
- **Use Cases Triggered**:
  - `UC-TODO-004: Recover Soft-Deleted Task`
  - `ListDeletedTasksQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Trash Recovery Bin                              [X] |
|-------------------------------------------------------------|
| Task Title          | Deleted At        | Time Left | Action|
|---------------------+-------------------+-----------+-------|
| Write API notes     | 2026-08-02 20:30  | 35 min    | [Rcv] |
| Slack adapter tests | 2026-08-02 21:15  | 1 hr 20m  | [Rcv] |
|---------------------+-------------------+-----------+-------|
|                                                             |
| * Note: Deleted items are purged after 2 hours of inactivity|
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Task Creation and Tagging Flow
1. User clicks "+ Add Task" on the dashboard.
2. The Task Editor Modal overlay loads.
3. User enters Title: `"Finalize budget details"`, Priority: `"High"`, and Tags: `"finance, work"`.
4. User clicks "Save".
5. UI makes a `POST /tasks` call.
6. Upon receipt of task ID, tags are saved via `POST /tasks/{id}/tags`.
7. UI updates the dashboard and task appears at the top of the list.

### 2. Task Soft-Delete & Restoration Flow
1. User views a task in the Details Drawer.
2. User clicks "Delete (x)".
3. UI makes a `DELETE /tasks/{taskId}` request.
4. Drawer closes, task vanishes from active board, and a toast message "Task soft-deleted. Click to Undo" displays.
5. User clicks the "Trash" icon in the header.
6. The Trash Recovery Dashboard lists the item with its 2-hour remaining countdown.
7. User clicks the "Recover" button.
8. UI makes a `POST /tasks/{taskId}/recover` call.
9. Task disappears from the trash list, restores its status to `Active`, and returns to the task list view.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Task Dashboard** | Search / filter list | `GET /api/v1/workspaces/{workspaceId}/tasks` | `UC-TODO-011: List Tasks` |
| **Task Dashboard** | Toggle complete checkbox | `POST /api/v1/workspaces/{workspaceId}/tasks/{id}/complete` | `UC-TODO-005: Complete Task` |
| **Task Dashboard** | Toggle reopen checkbox | `POST /api/v1/workspaces/{workspaceId}/tasks/{id}/reopen` | `UC-TODO-010: Reopen Task` |
| **Task Detail Drawer**| Load task fields | `GET /api/v1/workspaces/{workspaceId}/tasks/{id}` | `Query: GetTask` |
| **Task Detail Drawer**| Click Delete | `DELETE /api/v1/workspaces/{workspaceId}/tasks/{id}` | `UC-TODO-003: Soft-Delete Task` |
| **Task Detail Drawer**| Remove tag tag tag | `DELETE /api/v1/workspaces/{workspaceId}/tasks/{id}/tags/{tag}` | `UC-TODO-008: Manage Tags` |
| **Task Detail Drawer**| Pause recurrence rule | `POST /api/v1/workspaces/{workspaceId}/tasks/{id}/recurrence/pause` | `UC-TODO-009: Pause Recurrence` |
| **Task Editor Modal** | Input new fields, Save | `POST /api/v1/workspaces/{workspaceId}/tasks` | `UC-TODO-001: Create Task` |
| **Task Editor Modal** | Modify fields, Save | `PUT /api/v1/workspaces/{workspaceId}/tasks/{id}` | `UC-TODO-002: Update Task` |
| **Task Editor Modal** | Attach recurrence pattern | `PUT /api/v1/workspaces/{workspaceId}/tasks/{id}/recurrence` | `ConfigureRecurrenceCommand` |
| **Trash Recovery** | Browse soft-deleted tasks | `GET /api/v1/workspaces/{workspaceId}/tasks/deleted` | `ListDeletedTasksQuery` |
| **Trash Recovery** | Click Recover | `POST /api/v1/workspaces/{workspaceId}/tasks/{id}/recover` | `UC-TODO-004: Recover Task` |

---

## 6. Screen ↔ Context Mapping

- **Todo Bounded Context** owns all 4 screens and task-lifecycle user interactions.
- **Connector Bounded Context** synchronizes with external services (Jira, TickTick) and calls Todo ports to update tasks in the background, but does not own these UI screens.
- **Workflow Bounded Context** triggers automated actions (e.g. create task on cron) that interact with Todo ports, but does not own the user interfaces.
- **AI Agent** accesses the Todo domain exclusively via the `TodoPort` interfaces to read and update tasks during planning executions.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Interactive Checkboxes**:
   - The status checkboxes on the dashboard must have accessible labels using `aria-label` or be associated with the task title text elements programmatically.
2. **Details Drawer Focus**:
   - On opening the Task Details Drawer, keyboard focus must move to the drawer wrapper element (`tabindex="-1"`), and be trapped or easily closeable via a keyboard shortcut (e.g. `Esc`). The drawer wrapper should have `aria-live="polite"` for dynamic content changes.
3. **Validation Errors**:
   - The Task Editor fields must raise accessible inline alerts for validation errors (such as blank titles) using `aria-invalid="true"` and `aria-describedby` referencing the specific error text.

### Mobile Responsiveness Notes
1. **Drawer to Full-Screen Overlay**: On mobile devices (viewports <= 600px), the details drawer expands to fill 100% of the screen width to maximize readable content.
2. **Inline Action Targets**: The checkbox and delete targets have a large touch padding area (min 48x48px) to reduce accidental misclicks.
3. **Form Reflow**: The priority selector dropdown and due date pickers stack vertically in a single column layout on phone screens.

