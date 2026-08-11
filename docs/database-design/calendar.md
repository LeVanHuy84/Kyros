# Calendar Bounded Context Database Design

This document details the logical database design for the **Calendar** Bounded Context.

---

## 1. Context Overview

### Purpose
The Calendar context manages user schedule blocks, checks and blocks calendar collisions, and schedules reminder triggers.

### Aggregate Ownership
- **CalendarEvent** (Aggregate Root): Encapsulates event descriptions, schedule range boundaries, and child reminder settings.
- **Reminder** (Entity): Represents a scheduled alert associated with a specific event.

### Persistence Responsibility
The Calendar context is the system of record for schedule blocks and alert times. It enforces timeline constraints and ensures no overlapping events if configured by preferences.

---

## 2. Entity → Table Mapping

| Bounded Context Entity / Value Object | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **CalendarEvent** (Aggregate Root) | `calendar.calendar_events` | Table |
| `EventId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `UserId` (Value Object) | `owner_id` (UUID) | Logical Reference Column |
| `EventTitle` (Value Object) | `title` (VARCHAR) | Column |
| `EventDescription` (Value Object) | `description` (TEXT) | Column |
| `EventTimeRange` (Value Object) | `start_time`, `end_time` (TIMESTAMPTZ) | Columns |
| `EventLifecycleStatus` (Value Object) | `status` (VARCHAR) | Column |
| `SoftDeleteMetadata` | `deleted_at` (TIMESTAMPTZ) | Column (Nullable) |
| **Reminder** (Entity) | `calendar.calendar_reminders` | Table |
| `ReminderId` | `id` (UUID) | Primary Key Column |
| `LeadTime` (Value Object) | `lead_time_minutes` (INTEGER) | Column |
| `ReminderTriggerTime` (Value Object) | `trigger_time` (TIMESTAMPTZ) | Column |
| `ReminderStatus` (Value Object) | `status` (VARCHAR) | Column |
| `SnoozeTarget` (Value Object) | `snoozed_until` (TIMESTAMPTZ) | Column |

---

## 3. Table Definitions

### Table: `calendar.calendar_events`

#### Purpose
Stores user scheduled events and time allocations.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global unique identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to tenant workspace. |
| `owner_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to the event owner identity. |
| `title` | `VARCHAR(255)` | `NOT NULL` | *None* | `CHECK (length(trim(title)) > 0)` | Event subject. |
| `description` | `TEXT` | `NULLABLE` | `NULL` | *None* | Optional details. |
| `start_time` | `TIMESTAMPTZ` | `NOT NULL` | *None* | *None* | Event start instant. |
| `end_time` | `TIMESTAMPTZ` | `NOT NULL` | *None* | `CHECK (end_time > start_time)` | Event end instant. Chronology enforced. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Scheduled'` | `CHECK (status IN ('Scheduled', 'Deleted'))` | Event lifecycle state (`CAL-003` delete transitions to `Deleted`). |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Timestamp of soft-deletion; active events have `deleted_at IS NULL`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `created_by` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical audit ref to `auth.user_identities.id`. |
| `updated_by` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical audit ref to `auth.user_identities.id`. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `calendar.calendar_reminders`

#### Purpose
Stores alert settings and trigger times for calendar events.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key. |
| `event_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `calendar.calendar_events(id) ON DELETE CASCADE` | Physical parent relationship. |
| `lead_time_minutes` | `INTEGER` | `NOT NULL` | *None* | `CHECK (lead_time_minutes > 0)` | Pre-event alert window offset in minutes (maps to API `leadTimeMinutes`). |
| `trigger_time` | `TIMESTAMPTZ` | `NOT NULL` | *None* | *None* | Pre-computed database instant to trigger notification (`start_time - lead_time_minutes`). |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Scheduled'` | `CHECK (status IN ('Scheduled', 'Triggered', 'Snoozed', 'Dismissed'))` | State of the reminder dispatch loop. |
| `snoozed_until` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Next fire instant when the reminder is snoozed; scheduler re-arms from this value. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |

---

## 4. Relationships

- **Composition**: `calendar.calendar_events` owns `calendar.calendar_reminders` with database physical foreign key cascade delete.
- **Reference by ID**:
  - `workspace_id` is a logical reference to `workspace.workspaces.id`.
  - `owner_id`, `created_by`, and `updated_by` reference `auth.user_identities.id` logically.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_calendar_events` | `id` | B-Tree (Implicit) | Primary key. |
| `pk_calendar_reminders` | `id` | B-Tree (Implicit) | Primary key. |
| `idx_events_workspace_range` | `workspace_id`, `start_time`, `end_time` | B-Tree (Composite) | **Critical** index for collision validation and listing calendar events for a workspace within a date range. |
| `idx_events_active_range` | `workspace_id`, `start_time`, `end_time` WHERE `status = 'Scheduled' AND deleted_at IS NULL` | B-Tree (Composite, Partial) | Range listing and overlap checks restricted to active events only; keeps the index compact and excludes deleted events. |
| `idx_reminders_event` | `event_id` | B-Tree | Optimizes loading event reminders during event retrieval. |
| `idx_reminders_polling` | `trigger_time`, `status` | B-Tree (Composite) | Optimizes the background scheduler query polling for due, un-triggered reminders. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Range Schedule Lookup**: `SELECT * FROM calendar.calendar_events WHERE workspace_id = :wsId AND status = 'Scheduled' AND start_time >= :start AND end_time <= :end`. Optimized by `idx_events_active_range`.
- **Overlap/Collision Check**: `SELECT COUNT(*) FROM calendar.calendar_events WHERE workspace_id = :wsId AND status = 'Scheduled' AND deleted_at IS NULL AND (start_time, end_time) OVERLAPS (:start, :end)`. Optimized by `idx_events_active_range` and PostgreSQL temporal checks.
- **Reminder Polling**: `SELECT * FROM calendar.calendar_reminders WHERE trigger_time <= NOW() AND status = 'Scheduled'`. Optimized by composite index `idx_reminders_polling`.

### Expected Write Patterns
- **Reschedule Event**: Triggers update of `start_time`, `end_time`, and updates child reminder `trigger_time` records. Managed under single transaction.
- **Delete Event**: Transitions `status` to `Deleted`, sets `deleted_at`, and dismisses child reminders in a single transaction.

---

## 7. Integrity Rules

- **Collision Prevention**: If overlap prevention preference is active, the application service queries `calendar_events` inside the overlap range. Colliding active bookings trigger a domain exception, preventing insertion.
- **Chronology constraint**: Table-level check constraint enforces `end_time > start_time`.
- **Deletion Lifecycle**: Deleting an event is a soft delete (`status = 'Deleted'`, `deleted_at` set) so that sync-conflict rows and audit traces referencing the event remain valid. Physical purge runs 30 days after deletion.

---

## 8. Persistence Notes

- **Optimistic Locking**: Tracked on `calendar_events` via `version` column.
- **Trigger Calculation**: Reminder trigger time is calculated during application save: `trigger_time = start_time - lead_time_minutes`. Rescheduling updates the trigger time.
- **Snooze**: Snoozing sets `status = 'Snoozed'` and `snoozed_until` to the next fire instant; the scheduler re-arms the reminder to `Scheduled` when `snoozed_until <= NOW()`.

---

## 9. Future Evolution

- **Calendar Event Partitioning**: High-frequency corporate accounts with large booking volumes are partitioned using range-based partitioning on the `start_time` column (e.g. monthly partitions).
- **Availability Computation**: Availability windows and time slots are computed at query time from active events. No availability tables or cached state are introduced. The `CalendarEventRepository` provides the event list; the application layer computes gaps and filters by `SchedulingConstraint`.
