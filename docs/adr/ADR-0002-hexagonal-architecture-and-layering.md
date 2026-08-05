# ADR-0002: Hexagonal (Ports & Adapters) per Module and Strict Layering

## Status
Approved

## Context
Traditional 3-tier layering architectures (Presentation → Business → Data Access) couple business domain logic to database schemas, ORM frameworks, and communication libraries. For the AI Executive Assistant, which must integrate with various external platforms (e.g. Google Calendar, Outlook, Slack, Jira) and support different LLM backends (e.g. Gemini, OpenAI), database schemas or external API changes could ripple through and break core business rules. Additionally, testing business rules in isolation becomes difficult when they depend directly on databases or external services.

## Decision
We enforce **Hexagonal Architecture (Ports & Adapters)** boundaries **per module** combined with **strict layering** pointing inward toward the Domain:
$$\text{Presentation} \longrightarrow \text{Application} \longrightarrow \text{Domain} \longleftarrow \text{Infrastructure}$$

1. **Domain Layer**: Contains entities, value objects, domain services, domain events, and repository/outbound interfaces. It is entirely framework-agnostic (no Spring annotations, JPA, Hibernate, or Jackson serialization details).
2. **Application Layer**: Implements use cases and coordinates transaction boundaries, events, and port mappings.
3. **Infrastructure Layer**: Implements outbound ports (repositories, API clients, vector stores) and handles framework dependencies.
4. **Presentation Layer**: Handles REST, Server-Sent Events, or WebSockets, and maps payloads to Application layer commands.
5. **Seams**: Direct cross-module imports are prohibited. Modules communicate sideways only via public **inbound ports** (as Java interfaces) or published **domain events**.

## Evidence
- [architecture.md:L59-L84 (Layered Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L59-L84)
- [architecture.md:L86-L113 (Hexagonal Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L86-L113)
- [architecture-v2.md:L28-L30 (Hexagonal contradiction)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L28-L30)
- [architecture-v2.md:L42-L47 (ISS-01)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L42-L47)
- [architecture-v2.md:L120-L121 (Hexagonal recommendation)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L120-L121)
- [architecture-v2.md:L138 (AD-002)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L138)
- [architecture-v2.md:L151 (AD-015)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L151)
- [architecture-v2.md:L295-L312 (Final Layered Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L295-L312)
- [context-map.md:L255-L264 (Context Communication)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L255-L264)
- [context-map.md:L370-L380 (§11 Dependency Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L370-L380)

## Alternatives
- **Standard 3-Tier Layering**: Rejected. Leaks database schema details and ORM annotations (like JPA `@Entity` or Spring's `@Service`) into domain logic, violating testability, separation of concerns, and future microservice extraction goals.

## Consequences
### Positive
- **High Testability**: Core domain and application services can be fully tested in seconds using simple Java unit tests and in-memory fakes for port interfaces (no Spring Boot test container required).
- **Technology Independence**: Replacing PostgreSQL, changing the vector store from pgvector to Qdrant, or updating the LLM provider does not modify any code in the Domain layer.
- **Microservices-Ready Seams**: Clean boundaries make extraction simple.

### Negative
- **Boilerplate & Overhead**: Requires mapping objects across layers (e.g. mapping a JPA Entity in the Infrastructure layer to a Domain Entity in the Domain layer, and mapping a Domain Entity to a DTO in the Presentation layer).
- **Cognitive Overhead**: Developers must maintain strict discipline regarding package imports and dependency inversion.

## Implementation Notes
- Domain classes must not import packages starting with `org.springframework`, `jakarta.persistence`, or any external client library.
- Repository interfaces reside in the Domain layer, while their SQL/JPA implementations reside in the Infrastructure layer.
- Configure ArchUnit rules to verify that no class in `..domain..` depends on `..infrastructure..`, `..presentation..`, or any third-party framework package.
