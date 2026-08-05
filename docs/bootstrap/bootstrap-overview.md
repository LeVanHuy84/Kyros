# Project Bootstrap Overview: AI Executive Assistant

This document defines the blueprint and architecture design for the project bootstrap phase of the **AI Executive Assistant**. It outlines the repository organization, multi-module Gradle build system, package layering rules, dependency restrictions, shared infrastructure patterns, local development environment, and a step-by-step initialization checklist.

---

## 1. Repository Structure

The codebase is organized as a Monorepo containing two separate top-level projects for the Backend and Frontend:
1. **`backend/`**: A Modular Monolith using a Gradle multi-module project (Spring Boot).
2. **`frontend/`**: A modern Frontend application (Next.js / React + Vite).

Application backend code and build plugins are strictly located in the `backend/modules/` directory. The package structure enforces **Hexagonal Architecture (Ports & Adapters)** per business module.

```text
ai-executive-assistant/
├── .gitignore
├── compose.yaml                              # Local dev services orchestrator
├── Taskfile.yml                              # Dev task runner configuration
├── docs/                                     # System-wide design documentation
│   ├── architecture/
│   └── bootstrap/
│       ├── bootstrap-overview.md             # This document
│       └── frontend-bootstrap.md             # Frontend project bootstrap configuration
│
├── backend/                                  # Java/Spring Boot Monolith project root
│   ├── build.gradle                          # Root Gradle build script
│   ├── settings.gradle                       # Root Gradle settings script
│   ├── gradle.properties                     # Root Gradle build properties
│   ├── Dockerfile                            # Backend multi-stage Docker build
│   ├── gradle/
│   │   ├── wrapper/
│   │   │   ├── gradle-wrapper.jar
│   │   │   └── gradle-wrapper.properties
│   │   └── libs.versions.toml                # Version Catalog
│   └── modules/
│       ├── build-logic/                      # Gradle convention plugins
│       │   ├── settings.gradle
│       │   ├── build.gradle
│       │   └── src/main/groovy/
│       │       └── java-quality.gradle       # Standard quality plugins
│       │
│       ├── shared-kernel/                    # Pure Java shared core library (no Spring/frameworks)
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/kernel/
│       │       ├── domain/                   # Shared ID types, Recurrence VO
│       │       ├── event/                    # Integration Event contracts
│       │       ├── exception/                # Global domain exceptions
│       │       └── package-info.java
│       │
│       ├── auth/                             # Identity & Access Management module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/auth/
│       │       ├── domain/                   # User, Session aggregates & repos
│       │       ├── application/              # Sign-in/Sign-up use cases & ports
│       │       ├── presentation/             # REST Controllers, JWT decoder
│       │       └── infrastructure/           # JPA db adapters, Redis client
│       │
│       ├── workspace/                        # Workspace Scoping & Tenancy module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/workspace/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/
│       │
│       ├── todo/                             # Task Management module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/todo/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/
│       │
│       ├── calendar/                         # Calendar & Schedule module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/calendar/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/
│       │
│       ├── memory/                           # Context, Fact, & Preference Memory module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/memory/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/           # JPA database, Vector search adapter
│       │
│       ├── notification/                     # Alerts & Dispatch module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/notification/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/
│       │
│       ├── connector/                        # External Integration Hub module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/connector/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── presentation/
│       │       └── infrastructure/           # Client adapters, Credential vault
│       │
│       ├── agent/                            # AI Agent & Tool Orchestration module
│       │   ├── build.gradle
│       │   └── src/main/java/com/assistant/agent/
│       │       ├── domain/                   # Goal, Plan, Approval aggregates
│       │       ├── application/              # Agent chat & reasoning use cases
│       │       ├── presentation/             # Chat REST/SSE Controllers
│       │       └── infrastructure/           # Outbound LLM adapters
│       │
│       └── bootstrap/                        # Execution Entry Point & Integration runner
│           ├── build.gradle
│           └── src/
│               ├── main/
│               │   ├── java/com/assistant/bootstrap/
│               │   │   ├── AiExecutiveAssistantApplication.java
│               │   │   ├── config/           # Global security and filters
│               │   │   ├── tools/            # Dynamic AgentTool bridge adapters
│               │   │   └── package-info.java
│               │   └── resources/
│               │       ├── application.yml
│               │       ├── application-dev.yml
│               │       └── db/migration/     # Flyway Database migrations (context-segregated)
│               │           ├── auth/
│               │           ├── workspace/
│               │           ├── todo/
│               │           ├── calendar/
│               │           ├── memory/
│               │           ├── notification/
│               │           ├── agent/
│               │           └── connector/
│               └── test/
│                   └── java/com/assistant/bootstrap/architecture/
│                       └── ArchitectureTests.java # ArchUnit checks
│
└── frontend/                                 # Frontend project (Next.js or React+Vite)
    ├── package.json                          # Node dependencies and scripts
    ├── tsconfig.json                         # TypeScript configuration
    ├── next.config.js / vite.config.ts       # Frontend build settings
    ├── Dockerfile                            # Production web server Docker build
    ├── public/                               # Static assets (images, fonts, icons)
    └── src/
        ├── components/                       # Shared custom UI components
        ├── pages/ or app/                    # Next.js/React Router pages & layouts
        ├── styles/                           # Styling layer (Vanilla CSS design tokens)
        ├── hooks/                            # Custom React Hooks (e.g. useAuth, useWorkspace)
        ├── services/                         # API Integration Client (interceptor with backend ports)
        └── context/                          # Active Session and Workspace global contexts
```
```

---

## 2. Multi-Module Gradle Configuration (Backend)

The build system utilizes Gradle version catalogs and local convention plugins to centralize version management and ensure consistent code quality across all modules under the `backend/` directory.

### 2.1 Backend `settings.gradle` (`backend/settings.gradle`)
```groovy
pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
    // Include the build-logic project for internal convention plugins
    includeBuild 'modules/build-logic'
}

rootProject.name = 'ai-executive-assistant'

dependencyResolutionManagement {
    repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
    repositories {
        mavenCentral()
    }
}

// Include all modules
include(
    ':modules:shared-kernel',
    ':modules:auth',
    ':modules:workspace',
    ':modules:todo',
    ':modules:calendar',
    ':modules:memory',
    ':modules:notification',
    ':modules:connector',
    ':modules:agent',
    ':modules:bootstrap'
)
```

### 2.2 Backend `build.gradle` (`backend/build.gradle`)
```groovy
import org.gradle.jvm.toolchain.JavaLanguageVersion

plugins {
    alias(libs.plugins.spring.boot) apply false
    alias(libs.plugins.sonarqube) apply false
    id 'java'
    alias(libs.plugins.spotless) apply false
}

allprojects {
    apply plugin: 'com.diffplug.spotless'

    spotless {
        format('misc') {
            target '*.md', '.gitignore', '*.yml', '*.yaml'
            trimTrailingWhitespace()
            leadingTabsToSpaces(2)
            endWithNewline()
        }
        format('gradle') {
            target '*.gradle'
            trimTrailingWhitespace()
            leadingTabsToSpaces(4)
            endWithNewline()
        }
    }
}

subprojects {
    apply plugin: 'java-library'

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(25)
        }
    }
}
```

### 2.3 Gradle Version Catalog (`backend/gradle/libs.versions.toml`)
```toml
[versions]
springBoot = "3.4.2"
spotless = "6.25.0"
spotbugsPlugin = "6.0.20"
errorpronePlugin = "4.0.1"
archUnit = "1.3.0"
postgresql = "42.7.2"
redis = "3.4.2"

[libraries]
spring-boot-bom = { module = "org.springframework.boot:spring-boot-dependencies", version.ref = "springBoot" }
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-starter-security = { module = "org.springframework.boot:spring-boot-starter-security" }
spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa" }
spring-boot-starter-data-redis = { module = "org.springframework.boot:spring-boot-starter-data-redis" }
spring-boot-starter-actuator = { module = "org.springframework.boot:spring-boot-starter-actuator" }
spring-boot-starter-validation = { module = "org.springframework.boot:spring-boot-starter-validation" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test" }
flyway-core = { module = "org.flywaydb:flyway-core" }
flyway-database-postgresql = { module = "org.flywaydb:flyway-database-postgresql" }
postgresql = { module = "org.postgresql:postgresql", version.ref = "postgresql" }
archunit = { module = "com.tngtech.archunit:archunit", version.ref = "archUnit" }

spotless-gradle-plugin = { module = "com.diffplug.spotless:spotless-plugin-gradle", version.ref = "spotless" }
spotbugs-gradle-plugin = { module = "com.github.spotbugs:com.github.spotbugs.gradle.plugin", version.ref = "spotbugsPlugin" }
errorprone-gradle-plugin = { module = "net.ltgt.errorprone:net.ltgt.errorprone.gradle.plugin", version.ref = "errorpronePlugin" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "springBoot" }
spotless = { id = "com.diffplug.spotless", version.ref = "spotless" }
```

---

## 3. Build Logic (Convention Plugins)

To ensure code quality, build logic is isolated. The `backend/modules/build-logic` directory defines convention plugins for Spotless, SpotBugs, Checkstyle, and compiler-level checks (ErrorProne + NullAway).

### 3.1 `backend/modules/build-logic/settings.gradle`
```groovy
pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}
rootProject.name = 'build-logic'

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
    versionCatalogs {
        libs {
            from(files('../../gradle/libs.versions.toml'))
        }
    }
}
```

### 3.2 `backend/modules/build-logic/build.gradle`
```groovy
plugins {
    id 'groovy-gradle-plugin'
}

dependencies {
    implementation libs.spotless.gradle.plugin
    implementation libs.spotbugs.gradle.plugin
    implementation libs.errorprone.gradle.plugin
}
```

### 3.3 `backend/modules/build-logic/src/main/groovy/java-quality.gradle`
```groovy
import org.gradle.api.tasks.compile.JavaCompile

plugins {
    id 'java'
    id 'com.diffplug.spotless'
    id 'com.github.spotbugs'
    id 'net.ltgt.errorprone'
    id 'checkstyle'
}

checkstyle {
    toolVersion = '10.15.0'
}

spotless {
    java {
        googleJavaFormat().reflowLongStrings()
    }
}

spotbugs {
    toolVersion.set('4.8.4')
    ignoreFailures = false
    effort.set(com.github.spotbugs.snom.Effort.valueOf('MAX'))
    reportLevel.set(com.github.spotbugs.snom.Confidence.valueOf('HIGH'))
}

tasks.withType(com.github.spotbugs.snom.SpotBugsTask).configureEach {
    reports {
        html.required.set(true)
        xml.required.set(false)
    }
}

dependencies {
    compileOnly 'org.jspecify:jspecify:1.0.0'
    errorprone 'com.google.errorprone:error_prone_core:2.27.0'
    errorprone 'com.uber.nullaway:nullaway:0.11.0'
    spotbugsPlugins 'com.h3xstream.findsecbugs:findsecbugs-plugin:1.13.0'
}

tasks.withType(JavaCompile).configureEach {
    options.encoding = 'UTF-8'
    options.compilerArgs.addAll(['-XDaddTypeAnnotationsToSymbol=true', '-XDcompilePolicy=simple'])
    options.errorprone {
        excludedPaths = '.*/build/generated/.*'
        disableWarningsInGeneratedCode = true
        option 'NullAway:OnlyNullMarked', 'true'
        option 'NullAway:JSpecifyMode', 'true'
        error 'NullAway'
    }
}
```

---

## 4. Package Layering & Dependency Graph

### 4.1 Strict Hexagonal Layering
Every bounded context module enforces strict Hexagonal structure:
1. **Domain Layer (`domain/`)**: Framework-free business models, domain events, rule definitions, and outbound repository interfaces. (No Spring/JPA imports).
2. **Application Layer (`application/`)**: Inbound ports (`port.in`), outbound ports (`port.out`), and use-case service orchestrations that manage transactions (`@Transactional`).
3. **Presentation Layer (`presentation/`)**: Inbound adapters, REST/SSE controllers, HTTP serialization DTOs, and request validation (`jakarta.validation`).
4. **Infrastructure Layer (`infrastructure/`)**: Outbound adapters, JPA entities, database repositories, client library configurations, and local configuration beans.

### 4.2 Module Dependency Graph
Compile-time dependencies are restricted to avoid circular dependencies:
- **`shared-kernel`** is a leaf module with zero dependencies on other modules.
- **Business Modules** (`auth`, `workspace`, `todo`, `calendar`, `memory`, `notification`, `connector`, `agent`) depend on `shared-kernel` and `workspace` (to pull tenant context).
- **`agent`** has NO compile-time dependencies on `todo`, `calendar`, or other productivity modules. It depends only on the `Tool Registry` contract, `LLMPort`, `MemoryStorePort`, and `ApprovalRequestPort`.
- **`bootstrap`** acts as the composition root. It depends on all modules and coordinates runtime wiring.

### 4.3 Agent Tool Wiring Pattern
Because the `agent` module cannot depend on `todo` or `calendar` at compile-time (to prevent cycles and preserve isolation), concrete implementations of `AgentTool` (e.g., `CreateTaskTool` or `ScheduleEventTool`) reside in the **`bootstrap`** module (specifically inside the `com.assistant.bootstrap.tools` package). 
- These tools act as bridges: they implement `AgentTool` (defined in `agent` or `shared-kernel`) and depend on the inbound ports of target modules (e.g., `TodoPort` or `CalendarPort`).
- Spring Boot wires and registers these tool beans into the `ToolRegistry` at application startup.

---

## 5. Architecture Guardrails (ArchUnit)

ArchUnit tests enforce architectural rules. The following suite resides in the `bootstrap` module to inspect the entire classpath.

```java
package com.assistant.bootstrap.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.onionArchitecture;
import static org.junit.jupiter.api.Assertions.fail;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class ArchitectureTests {

    private static final String BASE_PACKAGE = "com.assistant";
    private static final String AGENT_PACKAGE = "com.assistant.agent..";
    
    @Test
    void shouldFollowHexagonalArchitecturePerModule() {
        // Enforces Onion/Hexagonal boundaries for each business module
        String[] modules = {"auth", "workspace", "todo", "calendar", "memory", "notification", "connector"};
        
        for (String module : modules) {
            String modulePackage = BASE_PACKAGE + "." + module;
            onionArchitecture()
                .domainModels(modulePackage + ".domain.model..")
                .domainServices(modulePackage + ".domain.service..")
                .applicationServices(modulePackage + ".application..")
                .adapter("presentation", modulePackage + ".presentation..")
                .adapter("infrastructure", modulePackage + ".infrastructure..")
                .check(importedClasses());
        }
    }

    @Test
    void domainShouldBeFrameworkFree() {
        noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "com.fasterxml.jackson..")
            .because("Domain layers must remain framework and serialization agnostic")
            .check(importedClasses());
    }

    @Test
    void agentShouldRemainIsolated() {
        // Agent cannot import classes from todo, calendar, or other productivity contexts
        noClasses()
            .that()
            .resideInAPackage(AGENT_PACKAGE)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                "com.assistant.todo..",
                "com.assistant.calendar..",
                "com.assistant.notification.infrastructure.."
            )
            .because("AI Agent must be decoupled and invoke other contexts only via dynamic tools")
            .check(importedClasses());
    }

    private JavaClasses importedClasses() {
        return new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages(BASE_PACKAGE);
    }
}
```

---

## 6. Local Development Environment

The project standardizes local services using Docker Compose, aligning dependencies (PostgreSQL 16 + pgvector, Redis) with production.

### 6.1 Backend Dockerfile (`backend/Dockerfile`)
A multi-stage build optimization splits the Spring Boot executable Jar into distinct layer files to speed up build caching.
```dockerfile
ARG BUILD_JDK_IMAGE=eclipse-temurin:25-jdk-jammy
ARG RUNTIME_IMAGE=eclipse-temurin:25-jre-jammy

FROM ${BUILD_JDK_IMAGE} AS builder
WORKDIR /workspace
ENV GRADLE_USER_HOME=/cache/.gradle

# Cache Gradle wrappers and configurations first
COPY gradle ./gradle
COPY gradlew ./
COPY settings.gradle ./
COPY gradle.properties ./
COPY build.gradle ./
COPY modules/build-logic ./modules/build-logic
RUN chmod +x ./gradlew

# Copy source and build
COPY modules/shared-kernel ./modules/shared-kernel
COPY modules/auth ./modules/auth
COPY modules/workspace ./modules/workspace
COPY modules/todo ./modules/todo
COPY modules/calendar ./modules/calendar
COPY modules/memory ./modules/memory
COPY modules/notification ./modules/notification
COPY modules/connector ./modules/connector
COPY modules/agent ./modules/agent
COPY modules/bootstrap ./modules/bootstrap

RUN --mount=type=cache,target=/cache/.gradle \
    ./gradlew :modules:bootstrap:bootJar --no-daemon

# Extract layers
RUN mkdir -p /workspace/extracted \
    && java -Djarmode=tools -jar /workspace/modules/bootstrap/build/libs/app.jar extract --destination /workspace/extracted

FROM ${RUNTIME_IMAGE} AS runtime
WORKDIR /app

RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/sh --create-home appuser

COPY --chown=appuser:appgroup --from=builder /workspace/extracted/dependencies/ /app/
COPY --chown=appuser:appgroup --from=builder /workspace/extracted/spring-boot-loader/ /app/
COPY --chown=appuser:appgroup --from=builder /workspace/extracted/snapshot-dependencies/ /app/
COPY --chown=appuser:appgroup --from=builder /workspace/extracted/application/ /app/

USER appuser

ENV JAVA_TOOL_OPTIONS="\
    -XX:InitialRAMPercentage=70.0 \
    -XX:MaxRAMPercentage=70.0 \
    -XX:+ExitOnOutOfMemoryError \
    -Dfile.encoding=UTF-8 \
    -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080/tcp
STOPSIGNAL SIGTERM
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### 6.2 `compose.yaml`
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: ai-executive-assistant-backend:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      PORT: 8080
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/assistant_db
      SPRING_DATASOURCE_USERNAME: assistant_user
      SPRING_DATASOURCE_PASSWORD: assistant_secure_pwd
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: ai-executive-assistant-frontend:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
    depends_on:
      - backend

  postgres:
    image: pgvector/pgvector:16-pgdg
    restart: unless-stopped
    environment:
      POSTGRES_DB: assistant_db
      POSTGRES_USER: assistant_user
      POSTGRES_PASSWORD: assistant_secure_pwd
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assistant_user -d assistant_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 6.3 `Taskfile.yml`
```yaml
version: "3"

vars:
  MAIN_MODULE: modules:bootstrap
  GRADLE_CMD: '{{if eq OS "windows"}}gradlew.bat{{else}}./gradlew{{end}}'

tasks:
  dev-backend:
    desc: "Launch backend application locally in development mode"
    dir: backend
    cmds:
      - '{{.GRADLE_CMD}} :{{.MAIN_MODULE}}:bootRun --args="--spring.profiles.active=dev"'

  test-backend:
    desc: "Run all automated backend unit and architecture tests"
    dir: backend
    cmds:
      - "{{.GRADLE_CMD}} test"

  format-backend:
    desc: "Automatically format backend files using Spotless"
    dir: backend
    cmds:
      - "{{.GRADLE_CMD}} spotlessApply"

  check-backend:
    desc: "Run backend static analysis checks (Checkstyle, SpotBugs, ErrorProne, NullAway)"
    dir: backend
    cmds:
      - "{{.GRADLE_CMD}} check"

  verify-backend:
    desc: "Run clean, compilation, test, and quality tasks for backend (CI equivalence)"
    dir: backend
    cmds:
      - "{{.GRADLE_CMD}} clean build"

  dev-frontend:
    desc: "Launch frontend application locally in development mode"
    dir: frontend
    cmds:
      - "npm run dev"

  build-frontend:
    desc: "Build frontend application for production"
    dir: frontend
    cmds:
      - "npm run build"
```

---

## 7. Step-by-Step Repository Initialization Checklist

This checklist must be executed to boot and verify the repository:

- [ ] **Step 1: Setup Monorepo Folders**
  - Create directories `backend/` and `frontend/` under the root repository directory.
- [ ] **Step 2: Cleanup Spring Initializr template for Backend**
  - Generate a Spring Boot base configuration (Gradle Groovy, Java 25, Spring Web, Spring Security, Spring Data JPA, PostgreSQL Driver, Validation, Flyway).
  - Place it in the `backend/` folder and delete `src/main` and `src/test` at the `backend/` root (source code belongs in submodules only).
- [ ] **Step 3: Create settings and properties**
  - Write `backend/settings.gradle`, `backend/build.gradle`, `backend/gradle.properties`.
  - Add version catalog variables in `backend/gradle/libs.versions.toml`.
- [ ] **Step 4: Setup build-logic conventions**
  - Write `backend/modules/build-logic/settings.gradle` and `backend/modules/build-logic/build.gradle`.
  - Write convention plugins in `backend/modules/build-logic/src/main/groovy/java-quality.gradle`.
- [ ] **Step 5: Create Backend submodules**
  - Create directories under `backend/modules/` for `shared-kernel`, `auth`, `workspace`, `todo`, `calendar`, `memory`, `notification`, `connector`, `agent`, `bootstrap`.
  - Create package structures for each module (e.g. `com.assistant.todo.domain`, etc.).
  - Create `package-info.java` containing `@NullMarked` in every module package folder.
- [ ] **Step 6: Write Main application and database migrations**
  - Write `AiExecutiveAssistantApplication.java` inside `backend/modules/bootstrap`.
  - Add default database credentials in `backend/modules/bootstrap/src/main/resources/application.yml` and `application-dev.yml`.
  - Create empty placeholder Flyway migrations under `db/migration/` for all contexts.
- [ ] **Step 7: Write ArchUnit architecture tests**
  - Create `ArchitectureTests.java` in `backend/modules/bootstrap/src/test/java/com/assistant/bootstrap/architecture/`.
- [ ] **Step 8: Setup virtual environment files**
  - Write `backend/Dockerfile`, root `compose.yaml`, root `Taskfile.yml`.
- [ ] **Step 9: Perform verification compile for Backend**
  - Run `task verify-backend` (or `gradlew clean build` in the `backend` folder) to ensure zero format warnings, checkstyle compliance, and ArchUnit success.
- [ ] **Step 10: Initialize Frontend project**
  - Follow the instructions in [frontend-bootstrap.md](file:///D:/VsCode/Java/ai_executive_assistant/docs/bootstrap/frontend-bootstrap.md) to bootstrap the frontend web application in the `frontend/` directory.
