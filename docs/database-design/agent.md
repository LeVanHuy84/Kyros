# AI Agent Bounded Context Database Design

This document details the logical database design for the **AI Agent** Bounded Context.

---

## 1. Context Overview

### Purpose
The AI Agent context manages the cognitive run loop: intent parsing, step planning, execution tracing, tool audit logs, and human-in-the-loop approvals.

### Aggregate Ownership
- **AgentSession** (Aggregate Root): Records goals, replanning counts, and current cognitive states.
- **PlanStep** (Entity within AgentSession): Represents a single step mapping to a tool invocation inside a session.
- **ApprovalRequest** (Aggregate Root): Represents an isolated user approval request for executing a plan.

### Persistence Responsibility
The Agent context is the authority for executing plan traces and tool invocations. It records step statuses and parameter snapshots for audit purposes.

---

## 2. Entity → Table Mapping

| Bounded Context Aggregate / Entity / VO | Database Representation | Mapping Type |
| :--- | :--- | :--- |
| **AgentSession** (Aggregate Root) | `agent.sessions` | Table |
| `AgentSessionId` (Value Object) | `id` (UUID) | Primary Key Column |
| `WorkspaceId` (Value Object) | `workspace_id` (UUID) | Logical Reference Column |
| `UserId` (Value Object) | `user_id` (UUID) | Logical Reference Column |
| `GoalText` (Value Object) | `goal` (TEXT) | Column |
| `AgentSessionStatus` (Value Object) | `status` (VARCHAR) | Column |
| `ReplanAttemptCount` (Value Object) | `replan_attempt_count` (INTEGER) | Column |
| `ApprovalId` (Soft Reference) | `active_approval_request_id` (UUID)| Column |
| **PlanStep** (Entity) | `agent.plan_steps` | Table |
| `PlanStepId` | `id` (UUID) | Primary Key Column |
| `ToolReference` (Value Object) | `tool_reference` (VARCHAR) | Column |
| `ToolParameterSnapshot` (Value Object) | `tool_parameter_snapshot` (JSONB) | Column |
| `PlanStepStatus` (Value Object) | `status` (VARCHAR) | Column |
| `StepSequenceNumber` (Value Object) | `sequence_number` (INTEGER) | Column |
| `StepError` (Value Object, Optional) | `error_message` (TEXT) | Column |
| `StepExecutionWindow` | `started_at`, `completed_at` (TIMESTAMPTZ) | Columns |
| `StepDependency` (Value Object) | `parent_step_id` (UUID) | Logical Self-Reference Column |
| **ApprovalRequest** (Aggregate Root) | `agent.approval_requests` | Table |
| `ApprovalId` | `id` (UUID) | Primary Key Column |
| `PlanSnapshot` (Value Object) | `plan_snapshot` (JSONB) | Column |
| `ApprovalStatus` (Value Object) | `status` (VARCHAR) | Column |
| `ExpirationTimestamp` (Value Object) | `expiration_time` (TIMESTAMPTZ) | Column |
| `ResolvedAt` (Value Object, Optional) | `resolved_at` (TIMESTAMPTZ) | Column |
| `UserId` (Value Object) | `resolved_by_user_id` (UUID) | Logical Reference Column |

---

## 3. Table Definitions

### Table: `agent.sessions`

#### Purpose
Tracks the status and history of user cognitive agent interactions.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global session identifier. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Tenant workspace separation. |
| `user_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `auth.user_identities.id` (session owner). |
| `goal` | `TEXT` | `NOT NULL` | *None* | `CHECK (length(trim(goal)) > 0)` | Natural language objective. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Planning'` | `CHECK (status IN ('Planning', 'AwaitingApproval', 'Executing', 'Succeeded', 'Failed', 'Escalated'))` | Cognitive state. |
| `replan_attempt_count`| `INTEGER` | `NOT NULL` | `0` | `CHECK (replan_attempt_count BETWEEN 0 AND 4)` | Number of replanning iterations. Capped at 3; 4th triggers Escalated. |
| `active_approval_request_id`| `UUID` | `NULLABLE` | `NULL` | *None* | Logical ref to current approval request. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `version` | `INTEGER` | `NOT NULL` | `0` | *None* | Optimistic lock control. |

---

### Table: `agent.plan_steps`

#### Purpose
Stores execution sequences and step details within a session.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Primary key identifier. |
| `session_id` | `UUID` | `NOT NULL` | *None* | `FOREIGN KEY` references `agent.sessions(id) ON DELETE CASCADE` | Physical link to session root. |
| `tool_reference` | `VARCHAR(255)` | `NOT NULL` | *None* | *None* | Registered tool ID. |
| `tool_parameter_snapshot`| `JSONB` | `NOT NULL` | *None* | *None* | Parameters passed to tool execution. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Pending'` | `CHECK (status IN ('Pending', 'Running', 'Succeeded', 'Failed'))` | Execution status of step. |
| `sequence_number` | `INTEGER` | `NOT NULL` | *None* | `CHECK (sequence_number >= 0)` | Order of the step within the plan (renders the execution timeline). |
| `error_message` | `TEXT` | `NULLABLE` | `NULL` | *None* | Failure detail captured when `status = 'Failed'`. |
| `started_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant step execution began. |
| `completed_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant step execution finished. |
| `parent_step_id` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical self-ref to dependency step. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |

---

### Table: `agent.approval_requests`

#### Purpose
Provides human-in-the-loop validation checkpoints for plan executions.

#### Columns
| Column Name | Data Type | Nullability | Default Value | Constraints / Checks | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | `PRIMARY KEY` | Global approval request identity. |
| `workspace_id` | `UUID` | `NOT NULL` | *None* | *None* | Tenant workspace separation. |
| `session_id` | `UUID` | `NOT NULL` | *None* | *None* | Logical ref to `agent.sessions.id`. |
| `plan_snapshot` | `JSONB` | `NOT NULL` | *None* | *None* | Raw JSON plan data displayed to user. |
| `status` | `VARCHAR(50)` | `NOT NULL` | `'Pending'` | `CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Expired'))` | State of approval request. |
| `expiration_time` | `TIMESTAMPTZ` | `NOT NULL` | *None* | *None* | Timeout instant. |
| `resolved_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | *None* | Instant the request was resolved (approved/rejected/expired). |
| `resolved_by_user_id` | `UUID` | `NULLABLE` | `NULL` | *None* | Logical ref to `auth.user_identities.id`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | *None* | Audit column. |

---

## 4. Relationships

- **Composition**: `agent.sessions` owns `agent.plan_steps` with physical database foreign key constraints and cascade deletes.
- **Reference by ID**:
  - `workspace_id` is a logical reference to `workspace.workspaces.id`.
  - `user_id` in `sessions` is a logical reference to `auth.user_identities.id`.
  - `session_id` in `approval_requests` and `active_approval_request_id` in `sessions` are logical ID-based references to prevent distributed lock conflicts.
  - `resolved_by_user_id` is a logical reference to `auth.user_identities.id`.

---

## 5. Index Strategy

| Index Name | Target Columns | Index Type | Purpose / Explanation |
| :--- | :--- | :--- | :--- |
| `pk_sessions` | `id` | B-Tree (Implicit) | Primary key index. |
| `pk_plan_steps` | `id` | B-Tree (Implicit) | Primary key index. |
| `pk_approval_requests` | `id` | B-Tree (Implicit) | Primary key index. |
| `idx_plan_steps_session` | `session_id`, `sequence_number` | B-Tree (Composite) | Optimizes step retrieval in plan order during trace updates. |
| `idx_sessions_workspace` | `workspace_id`, `status`, `updated_at` | B-Tree (Composite) | Lists active/executing traces inside a workspace (dashboard "active agent sessions" widget). |
| `idx_approvals_pending_expiry` | `status`, `expiration_time` | B-Tree (Composite) | Optimizes scanning for expired pending approvals. |

---

## 6. Query Optimization

### Expected Read Patterns
- **Trace Execution Progress**: `SELECT * FROM agent.plan_steps WHERE session_id = :sessionId ORDER BY sequence_number ASC`. Optimized by composite index `idx_plan_steps_session`.
- **Scan Expired Approvals**: `SELECT * FROM agent.approval_requests WHERE status = 'Pending' AND expiration_time < NOW()`. Optimized by composite index `idx_approvals_pending_expiry`.
- **Active Sessions (Dashboard)**: `SELECT * FROM agent.sessions WHERE workspace_id = :wsId AND status IN ('Planning', 'AwaitingApproval', 'Executing') ORDER BY updated_at DESC`. Optimized by `idx_sessions_workspace`.

### Expected Write Patterns
- **Trace step outcomes**: Frequent write updates to `plan_steps` status, `started_at`, and `completed_at` during loops. High write concurrency, mitigated by isolating steps into separate rows to avoid locking the parent table.
- **Resolve Approval**: Updates `status` to `Approved`/`Rejected`/`Expired` and records `resolved_at` and `resolved_by_user_id` in one transaction.

---

## 7. Integrity Rules

- **Replan Limit Check**: The database check constraint `CHECK (replan_attempt_count BETWEEN 0 AND 4)` ensures the replanning count does not exceed safety limits. 4th trigger throws a database/domain exception, which the system catches to transition status to `Escalated`.
- **Acyclic DAG**: Step dependencies are validated in the application planner logic before persisting parent links to database fields.

---

## 8. Persistence Notes

- **Optimistic Locking**: Tracked on `sessions` via `version` column.
- **Tool Audit Trail**: Parameter snapshots are stored as structured `JSONB` to enable auditing of parameters passed to downstream domains (Todo, Calendar).

---

## 9. Future Evolution

- **Step History Archival**: Plan steps and execution details are highly volatile. Post-MVP, a retention policy of 14 days is applied to `plan_steps` for completed sessions, archiving older steps to cold storage.
