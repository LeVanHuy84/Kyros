# ADR-0009: Relational Database Selection and Schema-per-Context Isolation

## Status
Approved

## Context
The AI Executive Assistant requires:
1. **Strong Relational Integrity**: Scheduling algorithms (Calendar overlap prevention, recurrence calculations) and task states require strict ACID transactions and relational constraints.
2. **Semi-structured Data**: Integration connectors, notification templates, and tool invocation payloads use dynamic parameters that are best represented as documents.
3. **Vector Storage**: RAG grounding and semantic memory require high-performance vector similarity searches.
4. **Extraction Seams**: To keep modules ready for future microservices, database schemas must not be physically coupled.

## Decision
We select **PostgreSQL (15+)** as the unified relational database engine and enforce strict physical schema isolation:

1. **Unified Engine**: We use PostgreSQL for both relational storage and (via the `pgvector` extension) semantic vector storage, reducing infrastructure operational overhead.
2. **Schema Separation**: The database is partitioned into isolated PostgreSQL schemas corresponding to each bounded context: `auth`, `workspace`, `todo`, `calendar`, `memory`, `notification`, `agent`, and `connector`.
3. **No Cross-Schema Foreign Keys or Joins**: Tables in one schema cannot define foreign key constraints pointing to tables in another schema, and SQL queries must never JOIN tables across different schemas. References are made purely by storing the target ID as a UUID column, resolved at the application layer.
4. **UUID v4 Identifiers**: Every table primary key uses UUID v4 (PostgreSQL `uuid` type) to guarantee global uniqueness.

## Evidence
- [database-overview.md:L7-L15 (§1 Database Engine & Version)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L7-L15)
- [database-overview.md:L18-L44 (§2 Schema Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L18-L44)
- [database-overview.md:L63-L76 (§4 UUID & Key Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L63-L76)
- [database-overview.md:L135-L163 (§8 Cross-Context Relationship Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L135-L163)

## Alternatives
- **Multi-Database Setup (Day 1)**: Considered and rejected. Running separate database instances for each module from day one would complicate transaction management and increase local development and cloud hosting costs.
- **NoSQL Engine (e.g. MongoDB)**: Rejected. Lacks the robust relational integrity, constraint validation, and complex scheduling query performance required for the Todo and Calendar domains.

## Consequences
### Positive
- **Extraction-Ready Schemas**: Because schemas do not share SQL joins or constraints, splitting the database into separate physical databases for microservices is trivial.
- **Offline ID Generation**: Generating UUID v4 in application memory before saving prevents round-trips to the database to resolve sequence values.
- **Relational + Vector Coexistence**: Storing vectors alongside standard data rows in PostgreSQL simplifies transactional rollbacks and keeps the operational footprint low.

### Negative
- **Application Joins**: Queries that span multiple domains must be joined at the Application layer, causing slight development overhead.
- **No Cascade Deletes**: Cascading deletions across schemas are forbidden. Subsystems must listen to delete events (e.g. `WorkspaceDeleted`) and clean up their tables asynchronously.

## Implementation Notes
- Configure PostgreSQL to load the `pgvector` extension.
- Use PostgreSQL's `gen_random_uuid()` function to generate default UUIDs.
- Keep cross-schema ID references as plain UUID fields in JPA entities, avoiding `@ManyToOne` or `@JoinColumn` mappings across schemas.
