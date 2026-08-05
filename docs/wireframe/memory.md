# Low-Fidelity Wireframes — Memory Bounded Context

## 1. Screen Catalog

The Memory Bounded Context manages conversation logs, default user preferences, and semantic facts extracted from discussions.

- **Screen 1**: User Preferences Panel (Personal defaults & timezone)
- **Screen 2**: Semantic Memory Vault (Manage extracted user facts)
- **Screen 3**: Chat Conversations Log (Browse past chat threads)

---

## 2. Navigation

- **Unified Settings Navigation**: All three screens are organized as sub-tabs under a top-level settings container reachable via the "Settings > Preferences & Memory" navigation item in the global sidebar:
  - Tab 1: **User Preferences Panel**
  - Tab 2: **Semantic Memory Vault**
  - Tab 3: **Chat Conversations Log**

---

## 3. Wireframes

### Screen 1: User Preferences Panel
- **Purpose**: Let users customize timezones, default priorities, overlap constraints, and lead times.
- **Main Components**:
  - Timezone dropdown selector (IANA identifiers).
  - Default Task Priority selector (Low, Medium, High).
  - Prevent Calendar Overlap toggle switch.
  - Default Reminder Lead Time text input (positive minutes).
  - Actions: "Save Settings", "Reset to Defaults".
- **User Actions**:
  - Change settings inputs.
  - Save preferences.
  - Reset to default settings.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/preferences`
  - `PUT /api/v1/workspaces/{workspaceId}/preferences`
  - `POST /api/v1/workspaces/{workspaceId}/preferences/reset`
- **Use Cases Triggered**:
  - `UC-MEM-003: Update User Preferences`
  - `Query: GetUserPreferencesQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Settings / Preferences                              |
|-------------------------------------------------------------|
| [ Preferences ]   [ Memory Vault ]   [ Conversations ]      |
|-------------------------------------------------------------|
| Timezone:                                                   |
| [ America/New_York                                      v ] |
|                                                             |
| Default Task Priority:                                      |
| ( ) Low  (*) Medium  ( ) High                               |
|                                                             |
| Calendar Constraints:                                       |
| [x] Prevent Calendar Event Overlaps                         |
|                                                             |
| Default Reminder Lead Time:                                 |
| [ 15 ] Minutes                                              |
|                                                             |
|   +---------------+  +---------------------+                |
|   | Save Settings |  | Reset to Defaults   |                |
|   +---------------+  +---------------------+                |
+-------------------------------------------------------------+
```

---

### Screen 2: Semantic Memory Vault
- **Purpose**: Audit, edit, and delete long-term facts extracted from conversations.
- **Main Components**:
  - Search input box (filters facts).
  - Scrollable list of memory entries, showing content text, extraction date, and confidence rating bar (0.0 to 1.0).
  - Edit Modal/Input for revising fact content inline.
  - Action buttons: "Edit Fact" (revises fact), "Delete Fact" (soft-removes fact).
- **User Actions**:
  - Search semantic memories.
  - Click Edit to modify fact text.
  - Click Delete to delete a fact.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/memory-entries`
  - `PUT /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}`
- **Use Cases Triggered**:
  - `UC-MEM-009: Manage Memory Entry (View / Edit / Delete)`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Settings / Preferences                              |
|-------------------------------------------------------------|
| [ Preferences ]   [ Memory Vault ]   [ Conversations ]      |
|-------------------------------------------------------------|
| [ Search memory vault... ]                                  |
|-------------------------------------------------------------|
| Extracted Fact                     | Conf  | Actions        |
|------------------------------------+-------+----------------|
| "User prefers coffee over tea"     | 0.95  | [Edit] [Delete]|
| "John works on Q3 report Fridays"  | 0.82  | [Edit] [Delete]|
| "Lead developer uses GitHub oauth" | 0.88  | [Edit] [Delete]|
|------------------------------------+-------+----------------|
| Page 1 of 2                                                 |
+-------------------------------------------------------------+
```

---

### Screen 3: Chat Conversations Log
- **Purpose**: Browse and clear the history of individual chat threads.
- **Main Components**:
  - List of past chat conversations showing Title (e.g. "Q3 Meeting goal"), date, and status (Active, Cleared).
  - Click-through to view raw turn messages.
  - Action button: "Clear Conversation History" (wipes message logs).
- **User Actions**:
  - Browse conversations list.
  - View old conversation logs.
  - Wipe log history.
- **API Used**:
  - `GET /api/v1/workspaces/{workspaceId}/conversations`
  - `GET /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/turns`
  - `POST /api/v1/workspaces/{workspaceId}/conversations/{conversationId}/clear`
- **Use Cases Triggered**:
  - `UC-MEM-005: Clear Conversation History`
  - `UC-MEM-006: List Conversations for User`
  - `Query: GetConversationHistoryQuery`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Settings / Preferences                              |
|-------------------------------------------------------------|
| [ Preferences ]   [ Memory Vault ]   [ Conversations ]      |
|-------------------------------------------------------------|
| Chat Thread Title                 | Last Active| Actions    |
|-----------------------------------+------------+------------|
| "Schedule Q3 Sync tomorrow"       | 2 hrs ago  | [View][Clr]|
| "GitHub adapter deployment check" | 1 day ago  | [View][Clr]|
| "List of deliverables digest"     | 3 days ago | [View][Clr]|
|-----------------------------------+------------+------------|
|                                                             |
| [ Clear All Conversations ]                                 |
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. Update Preferences Flow
1. User clicks the "Preferences" settings tab.
2. User selects "America/Los_Angeles" from timezone and checks "Prevent Calendar Event Overlaps".
3. User clicks "Save Settings".
4. UI issues `PUT /preferences` request.
5. On success, a notification toast "Preferences saved successfully" appears. In-flight scheduling validation rules immediately enforce the overlap checks.

### 2. Manual Memory Correction Flow
1. User clicks "Memory Vault" tab.
2. User scrolls to find: `"John works on Q3 report Fridays"` fact.
3. User clicks "Edit" next to the item.
4. An inline text input appears. User modifies the text to: `"John works on Q3 report Thursdays"`.
5. User clicks Save. UI issues `PUT /memory-entries/{memoryId}`.
6. The list refreshes, showing updated fact text. Subsequent LLM planning calls utilize this corrected context.

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Preferences Tab** | Load settings | `GET /api/v1/workspaces/{workspaceId}/preferences` | `Query: GetUserPreferences` |
| **Preferences Tab** | Click Save Settings | `PUT /api/v1/workspaces/{workspaceId}/preferences` | `UC-MEM-003: Update Preferences` |
| **Preferences Tab** | Click Reset to Defaults | `POST /api/v1/workspaces/{workspaceId}/preferences/reset` | `UC-MEM-007: Reset Preferences` |
| **Memory Vault Tab**| Search/Load facts | `GET /api/v1/workspaces/{workspaceId}/memory-entries` | `UC-MEM-009: View Memory Entries` |
| **Memory Vault Tab**| Edit fact inline | `PUT /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}` | `UC-MEM-009: Revise Memory Entry`|
| **Memory Vault Tab**| Delete fact | `DELETE /api/v1/workspaces/{workspaceId}/memory-entries/{memoryId}` | `UC-MEM-009: Delete Memory Entry`|
| **Conversations Tab**| Browse threads list | `GET /api/v1/workspaces/{workspaceId}/conversations` | `UC-MEM-006: List Conversations` |
| **Conversations Tab**| View thread messages | `GET /api/v1/workspaces/{workspaceId}/conversations/{id}/turns` | `Query: GetConversationHistory` |
| **Conversations Tab**| Click Clear | `POST /api/v1/workspaces/{workspaceId}/conversations/{id}/clear` | `UC-MEM-005: Clear Conversation` |

---

## 6. Screen ↔ Context Mapping

- **Memory Bounded Context** owns all 3 preference/history screens described above.
- Downstream contexts like **Calendar** query Memory ports (`getUserPreferences`) to resolve overlap preferences when booking.
- **AI Agent** writes to Memory ports (`appendMessage`) to record chat histories, and queries memory search ports to grounding prompt templates, but does not own these configuration pages.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Settings Form Inputs**:
   - Timezone selector and Reminder inputs must have explicit visual labels associated with input elements.
   - Use fieldsets `<fieldset>` and legends `<legend>` to group default task priority radio options.
2. **Dynamic Vault List Updates**:
   - The memory entries list must use `aria-live="polite"` to announce when entries are successfully deleted or updated.
   - Confidence score indicators must include visual text alternative labels (e.g. `aria-label="Confidence score: 95 percent"`).

### Mobile Responsiveness Notes
1. **Sub-Tabs Scrolling**: On screen widths <= 480px, the sub-tabs header menu (`Preferences`, `Memory Vault`, `Conversations`) enables horizontal swipe navigation to prevent tab wrapping.
2. **Lists Reflow**: The semantic memory facts rows stack vertically. Actions (`Edit`, `Delete`) display as wide bottom-tap touchpoints.

