# Value Object Model — Connector Bounded Context

---

## ConnectionId / ConflictId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifiers. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null. |

---

## WorkspaceId

| Aspect | Description |
| --- | --- |
| **Fields** | Tenancy scope. |
| **Immutability** | Immutable on connection/conflict. |
| **Validation** | No cross-workspace sync. |

---

## ProviderType

| Aspect | Description |
| --- | --- |
| **Fields** | Enumeration (Google Calendar, GitHub, Slack, Jira, TickTick, etc.). |
| **Immutability** | Immutable on **Connection**. |
| **Validation** | Must match registered **Connector Plugin**. |

---

## ConnectionStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Active, Suspended, Unauthorized, Syncing. |
| **Immutability** | Transitions via **Connection** methods. |
| **Validation** | Sync not allowed when Unauthorized/Suspended. |

---

## SyncMode

| Aspect | Description |
| --- | --- |
| **Fields** | Bidirectional, OneWayImport, OneWayExport (as defined by product). |
| **Immutability** | Replace-on-change on configuration update. |
| **Validation** | Must be supported by plugin. |

---

## SyncFilterRules

| Aspect | Description |
| --- | --- |
| **Fields** | Provider-specific filter criteria (labels, calendars, repos). |
| **Immutability** | Replace-on-change. |
| **Validation** | Sanitized; plugin-validated shape. |

---

## CredentialVaultReference

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque key/id in vault storing encrypted tokens. |
| **Immutability** | Replace-on-change on re-auth. |
| **Validation** | Non-null for **Active** connection; never plaintext secret. |

---

## SyncRunTimestamp

| Aspect | Description |
| --- | --- |
| **Fields** | Last success / last failure instants. |
| **Immutability** | Updated after each run. |
| **Validation** | Failure may carry **SyncErrorMessage**. |

---

## SyncErrorMessage

| Aspect | Description |
| --- | --- |
| **Fields** | Truncated diagnostic text. |
| **Immutability** | Replace-on-change per failure. |
| **Validation** | No secrets in message content. |

---

## EntityTypeReference

| Aspect | Description |
| --- | --- |
| **Fields** | Task, Event (calendar). |
| **Immutability** | Fixed on **SyncConflict**. |
| **Validation** | Maps to target port (TodoPort, CalendarPort). |

---

## LocalEntityReference / RemoteEntityReference

| Aspect | Description |
| --- | --- |
| **Fields** | **TaskId** / **EventId** locally; provider-native id remotely. |
| **Immutability** | Immutable on conflict. |
| **Validation** | Non-null ids. |

---

## ConflictSnapshot

| Aspect | Description |
| --- | --- |
| **Fields** | Normalized field map for local and remote sides (ACL output). |
| **Immutability** | Immutable once conflict raised. |
| **Validation** | Must pass **DataSanitization** before port application. |

---

## ConflictStatus

| Aspect | Description |
| --- | --- |
| **Fields** | Pending, Resolved, Ignored. |
| **Immutability** | Terminal states immutable. |
| **Validation** | Only **Pending** resolves. |

---

## ConflictResolutionStrategy

| Aspect | Description |
| --- | --- |
| **Fields** | LocalWins, RemoteWins, CustomMerge. |
| **Immutability** | Chosen once per resolve command. |
| **Validation** | Custom merge must yield port-valid commands. |

---

## RateLimitBackoff

| Aspect | Description |
| --- | --- |
| **Fields** | Retry delay, attempt count for provider API. |
| **Immutability** | Updated per failed call in sync orchestration. |
| **Validation** | Non-negative delay; respects provider limits. |

---

## SanitizedExternalPayload

| Aspect | Description |
| --- | --- |
| **Fields** | ACL-mapped DTO ready for Todo/Calendar ports. |
| **Immutability** | Immutable per import operation. |
| **Validation** | Title present for tasks; priority in High/Medium/Low; calendar time range valid. |
