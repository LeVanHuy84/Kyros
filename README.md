# Kyros — AI Executive Assistant

**Kyros** is a Personal AI Operating System that combines task management, calendars, notes, workflow automation, and an intelligent AI Agent into one unified platform. The AI never touches your data directly — it operates exclusively through a secured **Tool Registry** to guarantee safety, auditability, and permission enforcement.

This is a personal production-grade project built to level up Java Backend and AI Agent integration skills.

---

## Features

- **Todo** — task CRUD, priorities, tags, deadlines, recurrence (RFC 5545), soft-delete & recovery.
- **Calendar** — events, overlap prevention, reminders, free-slot discovery.
- **Notes (Knowledge)** — Markdown notes, indexing, and semantic retrieval used to ground RAG answers.
- **Workflow** — domain-event or cron triggers, action sequences, run history.
- **Notification** — centralized routing and delivery (in-app, email, Slack) by urgency and user preference.
- **Memory** — conversation history, user preferences, and long-term semantic memory with confidence scores.
- **AI Agent** — streaming chat (SSE), planning, tool selection & execution, reflection, human-in-the-loop approval.
- **Connector Hub** — integrates Google Calendar, Outlook, Slack, GitHub, Notion, TickTick, Jira, SMTP/IMAP.
- **Workspace** — multi-tenancy; all data is isolated per workspace via the `X-Workspace-Id` header.

---

## Architecture

- **Modular Monolith** — a single Spring Boot process whose code is strictly partitioned into cohesive modules.
- **Hexagonal Architecture (Ports & Adapters)** — domain is framework-agnostic, easy to test and swap providers.
- **DDD Lite** — each module has `domain` / `application` / `infrastructure` (plus `presentation`).
- **Event-Driven** — modules communicate via domain events (Spring `ApplicationEventPublisher`).
- **Isolated Agent** — the AI Agent only depends on the Tool Registry and ports; it never touches storage directly.
- **Enforced by ArchUnit** in CI (no domain→framework deps, agent isolation, hexagonal boundaries).

### Backend modules

| Module          | Responsibility                                                                     |
| --------------- | ---------------------------------------------------------------------------------- |
| `shared-kernel` | Shared value objects, domain events, IDs, enums — leaf module, depends on nothing. |
| `auth`          | Registration, login, JWT, refresh tokens, RBAC.                                    |
| `workspace`     | Tenant boundary, workspace lifecycle, membership.                                  |
| `todo`          | Task management.                                                                   |
| `calendar`      | Scheduling, events, overlap prevention.                                            |
| `memory`        | Conversation history, preferences, semantic memory.                                |
| `notification`  | Notification routing & delivery.                                                   |
| `connector`     | External provider hub, credential vault.                                           |
| `agent`         | AI orchestration: planning, tool selection, execution, approval.                   |
| `bootstrap`     | Composition root, configuration, Flyway migrations, tool bridge adapters.          |

> `AgentTool` implementations (e.g. `CreateTaskTool`, `ScheduleEventTool`) live in the `bootstrap` module so `agent` never has a compile-time dependency on `todo`/`calendar`.

---

## Tech Stack

**Backend**

- Java 25 (Java 21 bytecode target) + Spring Boot 3
- Spring Security, Spring Data JPA, Spring AI
- PostgreSQL (pgvector) + Redis
- Flyway migrations
- Testcontainers, ArchUnit
- Quality gates: Spotless, Checkstyle, SpotBugs, ErrorProne, NullAway

**Frontend**

- React 19 + Vite + TypeScript
- Axios API client (`X-Workspace-Id` + refresh-token rotation)
- Vanilla CSS with design tokens
- Prettier + Oxlint

**DevOps**

- Docker Compose (dev & prod)
- Gradle (multi-module) with version catalog
- Taskfile for dev task orchestration

---

## Quick Start

Requirements: **Docker**, **Java 25 (Adoptium/Temurin)**, **Node.js ≥ 20**, **Taskfile**.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit the environment variables (JWT secret, database, SMTP, ...) in `.env` as needed.

### 2. Start everything (infra + backend + frontend)

```bash
task dev
```

Or run each piece individually:

```bash
task infra-up        # start Postgres + Redis containers
task dev-backend     # Spring Boot on :8080 (dev profile)
task dev-frontend    # React + Vite on :3000
```

### 3. Run the full stack with Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### 4. Quality checks & build

```bash
task format          # Spotless + Prettier
task check           # Checkstyle, SpotBugs, ErrorProne, NullAway, oxlint
task verify-backend  # gradlew clean build (CI equivalent)
task test-backend    # unit + architecture tests
```

---

## Repository Layout

```text
.
├── backend/                 # Spring Boot modular monolith
│   ├── modules/
│   │   ├── build-logic/     # Convention plugins (quality gates)
│   │   ├── shared-kernel/
│   │   ├── auth/            # ... business modules
│   │   └── bootstrap/       # Composition root + migrations
│   └── gradle/libs.versions.toml
├── frontend/                # React + Vite SPA
├── docs/                    # SDD, architecture, domain model, API design, wireframes...
├── compose.yaml             # Docker Compose (dev)
├── compose.prod.yaml        # Docker Compose (production)
├── Taskfile.yml             # Dev task runner
└── .env.example
```

---

## Documentation

Full documentation lives in [`docs/`](docs/):

- `docs/insights/AI_Executive_Assistant_SDD.md` — Software Design Document
- `docs/architecture/` — overall architecture & boundaries
- `docs/domain-model/` — domain model, value objects, invariants, events
- `docs/application-model/` & `docs/api-design/` — use cases & API design (OpenAPI)
- `docs/context-mapping/` — context map between modules
- `docs/wireframe/` & `docs/ui-flow/` — wireframes & UI flows
- `docs/requirements/` — user stories
- `docs/implementation/` — implementation plan & AI coding plan

## Roadmap

- [x] **Wave I** — monorepo setup, quality gates, frontend scaffold
- [x] **Wave II** — tenancy & JWT auth
- [x] **Wave III** — todo bounded context
- [x] **Wave IV** — calendar & overlap prevention
- [ ] **Wave V** — memory & vector search (RAG)
- [ ] **Wave VI** — AI agent integration

---

## License

Personal project — no specific license yet.
