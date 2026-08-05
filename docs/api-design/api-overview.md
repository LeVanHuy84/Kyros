# API Design Overview

- **Document Version**: 1.0.0
- **Status**: Review Complete — READY FOR DATABASE DESIGN
- **Date**: August 2, 2026
- **Author**: Principal API Architect
- **Inputs**:
  - `docs/api-design/{agent,auth,calendar,connector,memory,notification,todo,workspace}/api-design.md`
  - `docs/application-model/{agent,auth,calendar,connector,memory,notification,todo,workspace}/application-model.md`
  - `docs/context-mapping/context-map.md`

---

## 1. Executive Summary

A cross-context review of all **8 active API Designs** (**Auth**, **Workspace**, **Todo**, **Calendar**, **Memory**, **Notification**, **AI Agent**, **Connector**) was performed against the approved Application Models, Context Map, and Architecture v2 baseline.

The designs are broadly consistent with their application-layer use cases, use REST principles correctly, and apply tenant scoping via the `workspaceId` path parameter throughout. The following systemic patterns were verified:

- All protected endpoints require `Authorization: Bearer <JWT>`.
- All mutating workspace-scoped endpoints validate tenancy via `TenantValidationPort` at the gateway.
- Resource hierarchies follow the workspace root `/api/v1/workspaces/{workspaceId}/...` correctly.
- Error responses are based on RFC 7807 Problem Details across most contexts.

**Gaps found are additive** — no structural blockers. The suite is **READY FOR DATABASE DESIGN**. P1 fixes should be addressed before the first implementation sprint.

---

## 2. Endpoint Matrix

Complete list of all REST endpoints across all 8 contexts.

### 2.1 Auth — `/api/v1/auth` · `/api/v1/admin/users`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register new user | UC-AUTH-001 |
| `POST` | `/api/v1/auth/login` | Authenticate & issue JWT | UC-AUTH-002 |
| `POST` | `/api/v1/auth/logout` | Invalidate token | UC-AUTH-005 |
| `PUT` | `/api/v1/auth/password` | Change password | UC-AUTH-003 |
| `GET` | `/api/v1/admin/users` | Search user identities | UC-AUTH-009 |
| `GET` | `/api/v1/admin/users/{userId}` | Get user identity | UC-AUTH-009 |
| `POST` | `/api/v1/admin/users/{userId}/suspend` | Suspend account | UC-AUTH-006 |
| `POST` | `/api/v1/admin/users/{userId}/reactivate` | Reactivate account | UC-AUTH-007 |
| `POST` | `/api/v1/admin/users/{userId}/unlock` | Unlock locked account | UC-AUTH-004 |
| `POST` | `/api/v1/admin/users/{userId}/roles` | Assign global role | UC-AUTH-008 |
| `DELETE` | `/api/v1/admin/users/{userId}/roles/{role}` | Revoke global role | UC-AUTH-008 |

### 2.2 Workspace — `/api/v1/workspaces`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `GET` | `/api/v1/workspaces/primary` | Resolve primary workspace | UC-WS-007 |
| `GET` | `/api/v1/workspaces/{workspaceId}` | Get workspace details | Query |
| `PATCH` | `/api/v1/workspaces/{workspaceId}` | Rename workspace | UC-WS-003 |
| `POST` | `/api/v1/workspaces/{workspaceId}/suspend` | Suspend workspace | UC-WS-004 |
| `POST` | `/api/v1/workspaces/{workspaceId}/reactivate` | Reactivate workspace | UC-WS-005 |
| `POST` | `/api/v1/workspaces/{workspaceId}/archive` | Archive workspace | UC-WS-006 |

### 2.3 Todo — `/api/v1/workspaces/{workspaceId}`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `POST` | `/tasks` | Create task | UC-TODO-001 |
| `GET` | `/tasks` | List/filter tasks | UC-TODO-011 |
| `GET` | `/tasks/deleted` | List deleted (recoverable) tasks | Query |
| `GET` | `/tasks/{taskId}` | Get task | Query |
| `PUT` | `/tasks/{taskId}` | Update task | UC-TODO-002 |
| `DELETE` | `/tasks/{taskId}` | Soft-delete task | UC-TODO-003 |
| `POST` | `/tasks/{taskId}/recover` | Recover soft-deleted task | UC-TODO-004 |
| `POST` | `/tasks/{taskId}/complete` | Complete task | UC-TODO-005 |
| `POST` | `/tasks/{taskId}/reopen` | Reopen completed task | UC-TODO-010 |
| `POST` | `/tasks/{taskId}/tags` | Add tags | UC-TODO-008 |
| `DELETE` | `/tasks/{taskId}/tags/{tag}` | Remove tag | UC-TODO-008 |
| `GET` | `/tasks/{taskId}/recurrence` | Get recurrence template | Query |
| `PUT` | `/tasks/{taskId}/recurrence` | Configure recurrence | UC-TODO-006 |
| `POST` | `/tasks/{taskId}/recurrence/pause` | Pause recurrence | UC-TODO-009 |
| `POST` | `/tasks/{taskId}/recurrence/resume` | Resume recurrence | UC-TODO-009 |
| `POST` | `/tasks/{taskId}/recurrence/stop` | Stop recurrence | UC-TODO-009 |

### 2.4 Calendar — `/api/v1/workspaces/{workspaceId}/calendar`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `POST` | `/events` | Create event | UC-CAL-001 |
| `GET` | `/events` | List events in time range | Query |
| `GET` | `/events/{eventId}` | Get event | Query |
| `PATCH` | `/events/{eventId}` | Update event metadata | UC-CAL-006 |
| `DELETE` | `/events/{eventId}` | Delete event | UC-CAL-003 |
| `POST` | `/events/{eventId}/reschedule` | Reschedule event | UC-CAL-002 |
| `POST` | `/events/{eventId}/reminders` | Add reminder | UC-CAL-007 |
| `DELETE` | `/events/{eventId}/reminders/{reminderId}` | Remove reminder | UC-CAL-007 |
| `POST` | `/events/{eventId}/reminders/{reminderId}/snooze` | Snooze reminder | UC-CAL-004 |
| `POST` | `/events/{eventId}/reminders/{reminderId}/dismiss` | Dismiss reminder | UC-CAL-004 |

### 2.5 Memory — `/api/v1/workspaces/{workspaceId}`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `POST` | `/conversations` | Start conversation | UC-MEM-004 |
| `GET` | `/conversations` | List conversations | UC-MEM-006 |
| `GET` | `/conversations/{conversationId}/turns` | Fetch conversation history | UC-MEM-002 |
| `POST` | `/conversations/{conversationId}/turns` | Append conversation turn | UC-MEM-001 |
| `POST` | `/conversations/{conversationId}/clear` | Clear conversation history | UC-MEM-005 |
| `GET` | `/preferences` | Get user preferences | Query |
| `PUT` | `/preferences` | Update user preferences | UC-MEM-003 |
| `POST` | `/preferences/reset` | Reset preferences to defaults | Query |
| `GET` | `/memory-entries` | List/search semantic memory | UC-MEM-009 |
| `GET` | `/memory-entries/{memoryId}` | Get memory entry | UC-MEM-009 |
| `PUT` | `/memory-entries/{memoryId}` | Revise memory entry | UC-MEM-009 |
| `DELETE` | `/memory-entries/{memoryId}` | Delete memory entry | UC-MEM-009 |

### 2.6 Notification — `/api/v1/workspaces/{workspaceId}`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `GET` | `/notifications` | List in-app notifications | Query |
| `POST` | `/notifications/{notificationId}/read` | Mark notification read | UC-NOTIF-002 |
| `POST` | `/notifications/read-all` | Mark all notifications read | UC-NOTIF-002 |
| `POST` | `/notifications/{notificationId}/dismiss` | Dismiss notification | UC-NOTIF-002 |
| `GET` | `/notification-profile` | Get notification profile | Query |
| `PUT` | `/notification-profile` | Update notification profile | UC-NOTIF-003 |

### 2.7 Connector — `/api/v1/workspaces/{workspaceId}/connectors`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `GET` | `/connections` | List connections | Query |
| `POST` | `/connections` | Register connection | UC-CON-001 |
| `PUT` | `/connections/{connectionId}` | Update sync mode/filters | Query |
| `POST` | `/connections/{connectionId}/suspend` | Suspend connection | UC-CON-004 |
| `POST` | `/connections/{connectionId}/reactivate` | Reactivate connection | UC-CON-004 |
| `POST` | `/connections/{connectionId}/revoke` | Revoke credentials | UC-CON-005 |
| `POST` | `/connections/{connectionId}/reauthorize` | Reauthorize connection | UC-CON-005 |
| `POST` | `/connections/{connectionId}/sync` | Trigger sync saga | UC-CON-002 |
| `GET` | `/connections/{connectionId}/health` | Get connection health | Query |
| `GET` | `/connections/{connectionId}/conflicts` | List sync conflicts | Query |
| `POST` | `/connections/{connectionId}/conflicts/{conflictId}/resolve` | Resolve conflict | UC-CON-003 |

### 2.8 AI Agent — `/api/v1/workspaces/{workspaceId}/agent`

| Method | Path | Description | UC |
|:---|:---|:---|:---|
| `POST` | `/sessions` | Submit goal & start planning | UC-AGENT-001 |
| `GET` | `/sessions` | List agent sessions | Query |
| `GET` | `/sessions/active` | Get active session | Query |
| `GET` | `/sessions/{sessionId}` | Get session details | Query |
| `GET` | `/approvals` | List approval requests | Query |
| `GET` | `/approvals/{approvalId}` | Get approval request | Query |
| `POST` | `/approvals/{approvalId}/resolve` | Resolve approval | UC-AGENT-002 |
| `POST` | `/qa` | Ask grounded question | UC-AGENT-006 |

**Total endpoints: 73**

---

## 3. Naming Matrix

Review of naming consistency across all contexts.

### 3.1 Resource Naming

| Context | Resource Noun | Style | Notes |
|:---|:---|:---|:---|
| Auth | `users`, `roles` | kebab-case ✅ | Consistent |
| Workspace | `workspaces` | kebab-case ✅ | Consistent |
| Todo | `tasks`, `tags`, `recurrence` | kebab-case ✅ | Consistent |
| Calendar | `events`, `reminders` | kebab-case ✅ | Consistent |
| Memory | `conversations`, `turns`, `preferences`, `memory-entries` | kebab-case ✅ | Consistent |
| Notification | `notifications`, `notification-profile` | kebab-case ✅ | Consistent |
| Connector | `connections`, `conflicts` | kebab-case ✅ | Consistent |
| AI Agent | `sessions`, `approvals`, `qa` | kebab-case ✅ | `qa` is an abbreviation — see §5 |

### 3.2 Action Suffix Naming (State-Change Sub-Resources)

| Pattern | Used by | Verdict |
|:---|:---|:---|
| `POST /{id}/complete` | Todo | ✅ Correct for non-CRUD state transitions |
| `POST /{id}/recover` | Todo | ✅ |
| `POST /{id}/reopen` | Todo | ✅ |
| `POST /{id}/pause`, `/resume`, `/stop` | Todo (recurrence) | ✅ |
| `POST /{id}/reschedule` | Calendar | ✅ |
| `POST /{id}/snooze`, `/dismiss` | Calendar (reminders) | ✅ |
| `POST /{id}/resolve` | Agent (approval), Connector (conflict) | ✅ Consistent |
| `POST /{id}/suspend`, `/reactivate` | Workspace, Connector | ✅ Consistent |
| `POST /{id}/revoke`, `/reauthorize` | Connector | ✅ |
| `POST /{id}/read`, `/dismiss` | Notification | ✅ |
| `POST /read-all` | Notification | ✅ |
| `POST /{id}/clear` | Memory (conversation) | ✅ |

### 3.3 DTO Field Naming

| Field | Context(s) | Style | Notes |
|:---|:---|:---|:---|
| `workspaceId` | All | camelCase ✅ | Consistent |
| `sessionId`, `approvalId`, `taskId`, `eventId`, `connectionId` | Agent, Todo, Calendar, Connector | camelCase ✅ | Consistent |
| `notificationId` | Notification | camelCase ✅ | |
| `memoryId` (URL) vs `id` (response body) | Memory | ⚠️ Mixed | Response body uses `id`; URL uses `memoryId` — align to `memoryEntryId` |
| `items` vs `data` vs `content` | Various | ⚠️ Mixed | See §5 |
| `page`/`size`/`totalElements`/`totalPages` | Agent, Auth, Memory, Todo (partial) | ✅ Mostly consistent | Todo uses `page`/`pageSize` (capital S) — minor drift |
| `lifecycleStatus` | Todo | Unique | Other contexts use `status` — consider aligning |

---

## 4. Consistency Review

### 4.1 URI Structure ✅

All 8 contexts correctly use:
- `/api/v1/` version prefix
- `/workspaces/{workspaceId}/` tenant root (except Auth admin endpoints, which are global by design — correct)
- Plural nouns for collection resources
- Sub-resources for nested domain objects (reminders, turns, tags, roles)

No URI inconsistencies found.

### 4.2 Authentication ✅

All contexts require `Authorization: Bearer <JWT>` except the two correct public endpoints: `POST /auth/register` and `POST /auth/login`.

### 4.3 Authorization ✅

All workspace-scoped endpoints document reliance on `TenantValidationPort` at the gateway. Auth admin endpoints correctly require the `SYSTEM_OPERATOR` global role. Workspace lifecycle endpoints (`/suspend`, `/reactivate`, `/archive`) also correctly require `SYSTEM_OPERATOR`.

### 4.4 Versioning ✅

All endpoints share the `/api/v1/` prefix. No context uses a different major version. Consistent.

### 4.5 Error Model ⚠️ (Inconsistent)

| Context | Error Format | RFC 7807? | Notes |
|:---|:---|:---:|:---|
| Agent | `type`/`title`/`status`/`detail`/`instance`/`errors[]` | ✅ | `errors[].field` + `errors[].message` |
| Auth | `type`/`title`/`status`/`detail`/`instance`/`errorCode` | ✅ | Uses `errorCode` string |
| Calendar | `type`/`title`/`status`/`detail`/`instance`/`invalidParams[]` | ✅ | `invalidParams[].name` + `invalidParams[].reason` |
| Connector | `type`/`title`/`status`/`detail`/`instance`/`errorCode` | ✅ | Consistent with Auth |
| Memory | `errorId`/`status`/`code`/`message`/`details[]/timestamp` | ❌ | Non-RFC 7807; uses `code`/`message` instead of `title`/`detail` |
| Notification | Described in prose only | ⚠️ | No explicit error schema defined |
| Todo | `errorCode`/`message`/`timestamp`/`details{}` | ❌ | Non-RFC 7807; uses flat `details` object not array |
| Workspace | `error`/`message`/`details[]/code` | ❌ | Non-RFC 7807; uses `error` string key |

**3 contexts (Memory, Todo, Workspace) use non-RFC 7807 error schemas.** All should standardize on:

```json
{
  "type": "https://api.assistant.com/errors/{error-slug}",
  "title": "Human-readable summary",
  "status": 400,
  "detail": "Specific occurrence description",
  "instance": "/api/v1/...",
  "errors": [
    { "field": "fieldName", "message": "Validation message" }
  ]
}
```

### 4.6 Pagination ⚠️ (Inconsistent)

| Context | Style | Envelope Key | Page Indexing |
|:---|:---|:---|:---|
| Agent | Offset | `data[]` + `page`/`size`/`totalElements`/`totalPages` | 0-indexed |
| Auth | Offset | `items[]` + `page`/`pageSize`/`totalElements`/`totalPages` | 0-indexed |
| Calendar | Offset | `items[]` + `total` | 0-indexed |
| Memory | Offset | `data[].meta{page,size,totalElements,totalPages}` | 0-indexed |
| Notification | Offset | `content[]` + `page`/`size`/`totalElements`/`totalPages` | 0-indexed |
| Todo | Offset | `items[]` + `totalItems`/`page`/`pageSize`/`totalPages` | **1-indexed** ⚠️ |
| Connector | Cursor | `data[]` + `nextCursor`/`hasMore` | N/A |
| Workspace | N/A | — | — |

Issues:
- **Envelope key** varies: `data`, `items`, `content` — must standardize to one key.
- **Todo uses 1-indexed pages** while all others use 0-indexed.
- **Connector uses cursor-based** pagination while all others use offset — acceptable for a large-dataset sync log, but should be documented as an intentional exception.
- **`pageSize` vs `size`**: Auth and Todo use `pageSize`; others use `size`.

### 4.7 Filtering ✅ (mostly)

| Context | Filter Params | Notes |
|:---|:---|:---|
| Agent | `status` (sessions) | ✅ |
| Auth | `email` (admin search implied) | ✅ |
| Calendar | `startTime`, `endTime` | ✅ Time-bounded |
| Memory | `query` (semantic search on `/memory-entries`) | ✅ |
| Notification | `status` enum | ✅ |
| Todo | `tag`, `priority`, `includeCompleted`, `sortBy`, `sortOrder` | ✅ Rich filtering |
| Connector | By `connectionId` sub-resources | ✅ |
| Workspace | N/A | ✅ Single resource |

No blocking issues. Recommend documenting all filter parameters in a shared conventions section.

### 4.8 Common Headers ✅

All contexts consistently require and document:
- `Authorization: Bearer <JWT>` on protected endpoints
- `Content-Type: application/json` on request bodies

No `X-Request-Id` or `X-Correlation-Id` tracing header is specified in any context — recommended as a P2 addition for observability.

### 4.9 Shared DTOs ⚠️ (Minor Drift)

| DTO concern | Finding |
|:---|:---|
| Workspace context in responses | All workspace-scoped responses correctly embed `workspaceId` |
| UUID format | All IDs are UUIDs — consistent |
| Timestamps | All timestamps use ISO-8601 UTC — consistent |
| `memoryId` vs `id` | Memory endpoint uses `memoryId` in URL path but returns `id` in response body — align to `memoryEntryId` in both |
| `lifecycleStatus` (Todo) vs `status` (all others) | Todo uses `lifecycleStatus`; all other contexts use `status` — minor semantic drift, acceptable given the dual-state model (lifecycle + recurrence) but should be documented |

### 4.10 API Boundaries ✅

No context exposes endpoints that cross its bounded context boundary. In particular:
- AI Agent does not expose Memory, Todo, or Calendar endpoints — it drives them internally via ports.
- Connector does not re-expose Todo or Calendar CRUD — it calls their ports internally.
- No context exposes another context's aggregate IDs as first-class path parameters without proper nesting.

### 4.11 Duplicate Endpoints — None Found ✅

No two contexts define the same HTTP method + path combination.

### 4.12 Missing Endpoints

| Missing | Context | Severity | Notes |
|:---|:---|:---|:---|
| `GET /api/v1/workspaces/{workspaceId}/agent/sessions/{sessionId}/steps` | Agent | P2 | Step-level detail useful for progress UI; currently embedded in session response |
| `DELETE /api/v1/workspaces/{workspaceId}/conversations/{conversationId}` | Memory | P2 | Archive/close a conversation — `clear` only wipes turns, not the header |
| `GET /api/v1/workspaces/{workspaceId}/tasks/{taskId}/instances` | Todo | P2 | List child recurrence instances of a parent task (GetRecurrenceTemplateQuery covers template only) |
| Tenant validation endpoint | Workspace | P3 | `GET /api/v1/workspaces/{workspaceId}/validate-membership` — useful for integration tests; gateway handles this internally so not strictly required |
| Unread notification count | Notification | P2 | `GET /notifications/unread-count` — common UI requirement, avoids full list load |

---

## 5. Recommendations

### P1 — Required before implementation

1. **Standardize error model to RFC 7807 across all 8 contexts.** Memory, Todo, and Workspace must adopt the `type`/`title`/`status`/`detail`/`instance`/`errors[]` schema used by Agent, Auth, Calendar, and Connector.

2. **Standardize pagination envelope.** All offset-paginated responses must use a single envelope shape:
   ```json
   {
     "content": [ ... ],
     "page": 0,
     "size": 20,
     "totalElements": 100,
     "totalPages": 5
   }
   ```
   - Change Auth's `items` → `content`.
   - Change Calendar's `items` + `total` → `content` + `totalElements`/`totalPages`.
   - Change Memory's `data` → `content`; flatten `meta` into root.
   - Change Todo's `items` → `content`; change `pageSize` → `size`; change from **1-indexed to 0-indexed**.
   - Connector cursor-based pagination is intentionally different and should be documented as an exception.

3. **Align `memoryId` URL param with response field.** Rename Memory API's response `id` → `memoryEntryId` to match the URL path parameter name `{memoryId}` (or pick one name and use it consistently).

4. **Rename Agent `/qa` to `/questions`.** `qa` is an internal abbreviation. The public API should use the full noun `questions` for clarity and consistency with the rest of the suite's plural noun naming.

5. **Fix Todo pagination index from 1-based to 0-based.** All other contexts use 0-indexed pages. Todo is the only outlier.

### P2 — Before first release

6. **Add `X-Request-Id` / `X-Correlation-Id` headers.** Document these as required request headers at the gateway level for distributed tracing. Responses should echo the same ID.

7. **Add `GET /notifications/unread-count` to Notification API.** Standard inbox requirement; avoids fetching full paginated list for badge counts.

8. **Add Notification schema definition.** The Notification API design describes endpoints in prose but lacks an explicit error schema. Add an RFC 7807-aligned schema block matching the other contexts.

9. **Document `lifecycleStatus` intent in Todo.** Either rename to `status` for suite-wide alignment, or add a design note explaining why `lifecycleStatus` is intentionally different (dual-state aggregate).

### P3 — Design-time notes

10. **Add `GET /sessions/{sessionId}/steps` to Agent API** for fine-grained step polling without fetching the full session graph on each tick.

11. **Add `DELETE /conversations/{conversationId}` to Memory API** (archive/close, not delete-with-history) so the conversation lifecycle can be fully managed via the API.

12. **Add `GET /tasks/{taskId}/instances` to Todo API** to expose the list of generated recurrence child instances for UI display.

13. **Consider `GET /workspaces/{workspaceId}/validate-membership`** as a testing/integration utility endpoint (guard behind admin or internal flag in non-production environments).

14. **Connector cursor-based pagination** should be explicitly documented as the intentional exception to the suite-wide offset pagination rule, citing large sync-log volumes as justification.

---

## 6. Overall Status

**READY FOR DATABASE DESIGN**

All 8 API designs are structurally sound, correctly tenant-scoped, consistently authenticated and authorized, and cover their respective application-model use cases. The P1 items (error model unification, pagination envelope standardization, naming fixes) are mechanical changes that do not affect database schema decisions and can be applied incrementally during implementation without blocking the database design phase.
