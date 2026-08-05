# AI Executive Assistant - Agent & Developer Log

This file acts as a living document mapping the project architecture, coding standards, quality gates, active session logs, and handoff instructions for agents and developers collaborating on the AI Executive Assistant monorepo.

---

## Project Overview

The AI Executive Assistant is a multi-tenant workspace platform designed to manage cognitive agent tasks, calendars, and workspace sandboxes.

- Repository Layout: Monorepo
  - /backend: Modular Monolith (Spring Boot 3.4.2 + Java 25 toolchain with Java 21 bytecode targets + Gradle 9.1.0).
  - /frontend: Single Page Application (React + Vite + TypeScript + Vanilla CSS).
  - /docs: Architecture blueprints, implementation plans, and bootstrap guides.

---

## Architectural Standards

The system adheres to modular and tenant-isolated architectural patterns as defined in the system documentation.

### Modular Monolith Architecture

- Each business domain resides in an independent Gradle module under backend/modules.
- Explicit dependency rules: Modules must communicate across boundaries only via public API facades or domain events. Cross-module database joins are strictly prohibited.
- Shared code is centralized in modules/shared-kernel. Shared kernel must not depend on any business modules.

### Clean Architecture and DDD Structure

Each business module follows Domain-Driven Design layout principles:

- domain: Core business logic, aggregate roots, entities, value objects, and repository interfaces. This layer is pure Java and must remain framework-agnostic.
- application: Use cases, command and query handlers, mapping layer, and transaction boundaries.
- infrastructure: Framework-specific implementations, Spring REST controllers, JPA adapters, and third-party integrations.

### Multi-Tenancy Isolation (AD-002)

- Partitioning: Shared database schema with tenant isolation implemented via workspace_id fields on all tenant-owned entities.
- Context Propagation: The frontend appends the X-Workspace-Id header to HTTP requests. The backend captures this via a filter and binds it to a ThreadLocal context.
- Safety: Repository queries must be automatically scoped using the active workspace context to prevent cross-tenant data leaks.

### Soft Delete Lifecycle (AD-003)

- Entities requiring soft delete must use a deleted timestamp or flag instead of physical deletion.
- Recovery Window: Soft-deleted items must remain recoverable by the user for 2 hours before becoming hidden.
- Permanent Purge: Data is permanently purged from the database after a retention period of 30 days.

---

## Coding Standards

### Null Safety Enforcement

- Package level null-safety: Every package must include a package-info.java file annotated with org.jspecify.annotations.NullMarked.
- NullAway static checks: Compile-time check verification via NullAway. Any reference that could be null must be explicitly annotated with org.jspecify.annotations.Nullable, otherwise compilation will fail.

### Java Versioning and Bytecode

- Toolchain: Compilation and execution are performed on Adoptium JDK 25.
- Bytecode Compatibility: The build script specifies target release version 21 (options.release.set(21)). This generates class files in major version 65 (Java 21) to ensure the Spring Boot ClassPath scanner (ASM) does not crash on startup, while still allowing the runtime environment to leverage JVM 25 optimizations.

### Formatting Rules

- Java formatting: Enforced via Spotless invoking Google Java Format (GJF) version 1.27.0 with reflow long strings enabled.
- Frontend formatting and linting: Enforced via Prettier (2-space indentation formatting for TSX/TS/CSS/JSON) and Oxlint (lightweight and fast static linting).
- CSS formatting: Vanilla CSS design tokens must be scoped under the :root selector. Ad-hoc utility styling is discouraged; reuse defined tokens.

---

## Infrastructure and Running Locally

All local development tasks are orchestrated using Taskfile (Taskfile.yml) and Docker Compose (compose.yaml).

### Database and Cache Infrastructure

PostgreSQL (with pgvector for embedding searches) and Redis are run containerized:

- Start database and cache services: task infra-up
- Stop database and cache services: task infra-down

### Backend Dev Server

Runs Spring Boot on JDK 25 using the dev profile. Database connection details are loaded from application-dev.yml pointing to localhost:5432:

- Launch backend application locally: task dev-backend

### Frontend Dev Server

Runs React + Vite client on port 3000 with automatic API request proxying:

- Launch frontend application locally: task dev-frontend

---

## Quality Gates and Static Analysis

We enforce strict compilation and formatting rules on the backend to ensure code safety and maintainability.

- Run code format auto-fix: task format
- Run static analysis checks: task check
- Clean build and test verification: task verify-backend

---

## Implementation Wave Status

We follow the roadmap defined in docs/implementation/ai-coding-plan.md.

- Wave I: Setup & Quality Gates (COMPLETED)
- Wave II: Tenancy & JWT Auth (UPCOMING / NEXT)
- Wave III: Task Bounded Context (TODO)
- Wave IV: Calendar & Overlaps (TODO)
- Wave V: Memory & Vector Search (TODO)
- Wave VI: Agent Integration (TODO)

### Active Session Completed Tasks (Wave I)

- Configure Root Monorepo Orchestration (compose.yaml, Taskfile.yml, .gitignore).
- Configure modular Gradle build scripts with Java 25 toolchain and target release compatibility.
- Setup static analysis plugin quality gates (spotless, checkstyle, spotbugs, errorprone, nullaway).
- Resolve Java 25 runtime ASM ClassReader crash using options.release.set(21) compilation target.
- Scaffold Frontend React + Vite SPA, clean boilerplate CSS, and integrate custom Vanilla CSS design tokens.
- Create Axios API Client wrapper supporting multi-tenancy X-Workspace-Id and token refresh rotation.
- Configure multi-stage production Dockerfiles for both backend and frontend.

### Next Handoff Focus (Wave II)

- Implement user registration, login, and token generation (auth module).
- Implement JWT Filter context integration to capture authentication state.
- Implement Workspace tenant creation and validation (workspace module).
- Implement tenant isolation filters at HTTP interceptor and JPA repository layers.

---

## Key File Navigation

- Root Compose: compose.yaml
- Root Taskfile: Taskfile.yml
- Gradle Version Catalog: backend/gradle/libs.versions.toml
- Static Analysis Rules: backend/modules/build-logic/src/main/groovy/java-quality.gradle
- Active Dev Config: backend/modules/bootstrap/src/main/resources/application-dev.yml
- GJF Custom Design Tokens: frontend/src/styles/variables.css
- API Connection Client: frontend/src/services/api-client.ts
- Main Layout: frontend/src/App.tsx

---

## Workspace Custom Skills

We have configured a custom Antigravity workspace skill to enforce Vite and React SPA development standards:
- Skill Manifest: .agent/skills/vite-react-best-practices/SKILL.md
- Full Rules Reference: .agent/skills/vite-react-best-practices/AGENTS.md
- Rules Directory: .agent/skills/vite-react-best-practices/rules/

