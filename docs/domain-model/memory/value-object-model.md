# Value Object Model — Memory Bounded Context

---

## ConversationId / MemoryId / PreferencesId

| Aspect | Description |
| --- | --- |
| **Fields** | Opaque unique identifiers per aggregate type. |
| **Immutability** | Immutable once assigned. |
| **Validation** | Non-null. |

---

## WorkspaceId / UserId

| Aspect | Description |
| --- | --- |
| **Fields** | Tenancy and user scope references. |
| **Immutability** | Immutable on aggregate. |
| **Validation** | Non-null; cross-workspace access forbidden. |

---

## ConversationTitle

| Aspect | Description |
| --- | --- |
| **Fields** | Optional or required display title. |
| **Immutability** | Replace-on-change. |
| **Validation** | Per product rules (may allow empty with default). |

---

## MessageContent

| Aspect | Description |
| --- | --- |
| **Fields** | Text (or structured) body of a turn. |
| **Immutability** | Immutable once appended. |
| **Validation** | Non-empty for valid turn; size limits if defined. |

---

## SenderRole

| Aspect | Description |
| --- | --- |
| **Fields** | **User**, **Agent**. |
| **Immutability** | Fixed per turn. |
| **Validation** | Required on each **ConversationTurn**. |

---

## TurnTimestamp

| Aspect | Description |
| --- | --- |
| **Fields** | Instant of message. |
| **Immutability** | Immutable per turn. |
| **Validation** | Must be strictly greater than previous turn in same **Conversation**. |

---

## DefaultTimezone

| Aspect | Description |
| --- | --- |
| **Fields** | IANA timezone identifier string. |
| **Immutability** | Replace-on-change on **UserPreferences**. |
| **Validation** | Valid IANA database name. |

---

## DefaultTaskPriority

| Aspect | Description |
| --- | --- |
| **Fields** | **High**, **Medium**, **Low**. |
| **Immutability** | Replace-on-change. |
| **Validation** | One of allowed enum values. |

---

## CalendarOverlapPreference

| Aspect | Description |
| --- | --- |
| **Fields** | Boolean **preventCalendarOverlap**. |
| **Immutability** | Replace-on-change. |
| **Validation** | Boolean required. |

---

## NotificationChannelPreference

| Aspect | Description |
| --- | --- |
| **Fields** | Ordered or set of channels (**InApp**, **Email**, **Slack**). |
| **Immutability** | Replace-on-change. |
| **Validation** | Subset of supported channels. |

---

## DefaultReminderLeadTime

| Aspect | Description |
| --- | --- |
| **Fields** | Duration. |
| **Immutability** | Replace-on-change. |
| **Validation** | Positive duration within allowed bounds. |

---

## FactContent

| Aspect | Description |
| --- | --- |
| **Fields** | Text representing extracted semantic knowledge. |
| **Immutability** | Replace-on-change on **MemoryEntry** edit. |
| **Validation** | Non-empty; must pass sensitive-data screening before persist. |

---

## ConfidenceScore

| Aspect | Description |
| --- | --- |
| **Fields** | Float in [0.0, 1.0]. |
| **Immutability** | Replace-on-change. |
| **Validation** | Inclusive bounds 0.0–1.0. |

---

## SensitiveDataScreeningResult

| Aspect | Description |
| --- | --- |
| **Fields** | **Allowed**, **Rejected**, reason code. |
| **Immutability** | Immutable per screening invocation. |
| **Validation** | **Rejected** blocks **MemoryEntry** creation. |
