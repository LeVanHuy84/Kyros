# ADR-0014: Containerized Deployment and Environment Standardization via Docker

## Status
Approved

## Context
The AI Executive Assistant requires a specific, multi-component infrastructure stack: a Java runtime environment (JDK 21/25), a PostgreSQL database populated with the `pgvector` extension, a Redis instance for session caching, and potentially KMS or external vaults. If developers, CI/CD runners, and deployment operators install these components manually on their host machines, version drift, missing database extensions, or mismatching network ports will cause deployment failures and "works on my machine" bugs. Additionally, the technical goal demands a secure and simple deployment model for single-tenant user workspaces.

## Decision
We standardize all development, testing, and production deployment environments using **Docker** containerization:

1. **Multi-Stage Java Monolith Build**: The Spring Boot modular monolith is compiled and packaged via a multi-stage Dockerfile. The build stage compiles the code using a full JDK image, while the final stage packages the compiled JAR file into a minimal JRE base image (e.g., Eclipse Temurin Alpine or Google Distroless) to reduce container size and security vulnerability exposure.
2. **Docker Compose Stack**: We maintain a standard `docker-compose.yml` file in the root of the project to orchestrate all local development and testing services:
   - `app`: The Spring Boot monolith.
   - `postgres`: PostgreSQL 15+ configured with the `pgvector` extension.
   - `redis`: Redis cache configured with AOF storage.
3. **Execution Sandbox Isolation (Future)**: If the Agent's tool capabilities are expanded to run untrusted user-defined scripts (e.g., Python code or shell commands), they must be spawned and executed within isolated, resource-constrained ephemeral Docker container sandboxes rather than directly on the application host JVM.

## Evidence
- [project-discovery.md:L20-L23 (Technical goals - containerized deployment)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L20-L23)
- [database-overview.md:L7-L15 (PostgreSQL version and pgvector extension)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L7-L15)
- [database-overview.md:L41-L43 (Persistence levels of infrastructure)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L41-L43)

## Alternatives
- **Manual Host Installation Guide**: Considered and rejected. Instructing developers and system operators to manually install and configure PostgreSQL, compile pgvector from source, and run Redis on varied operating systems (Windows, macOS, Linux) is slow and highly error-prone.
- **Bare Metal / VM-centric Deployments**: Rejected. Standardizing virtual machines (VMs) is slow, resource-heavy, and incompatible with modern container orchestrators (Kubernetes, AWS ECS, or sidecar deployments).

## Consequences
### Positive
- **Onboarding Speed**: New developers can run the entire platform, including database and caches, in under a minute with a single command: `docker compose up -d`.
- **Environment Parity**: The code executes in the exact same environment during local development, integration tests in CI/CD, and production deployments.
- **Dependency Cleanliness**: Eliminates the need to install PostgreSQL or Redis directly on the developer's operating system.

### Negative
- **Resource Footprint**: Docker containers (specifically when running multiple services) consume noticeable memory and CPU on local development machines.
- **Debugging Complexity**: Inspecting logs or attaching remote Java debuggers to a containerized JVM requires configuring custom Docker entry points and forwarding debugger ports (e.g., port 5005).

## Implementation Notes
- Store the multi-stage Dockerfile in `deploy/Dockerfile` or in the project root.
- Use `ankane/pgvector:v0.5.0` (or official successor) as the base Docker image for PostgreSQL to guarantee the `pgvector` extension is pre-compiled and ready.
- Expose environment variables to configure database hosts (`SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/...`) and Redis hosts (`SPRING_REDIS_HOST=redis`) dynamically across compose services.
