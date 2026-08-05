# ADR-0007: Workspace-Scoped Multi-Tenancy and Data Isolation

## Status
Approved

## Context
The AI Executive Assistant is a multi-tenant platform. Every user operates within a Workspace, which acts as the primary data boundary. The assistant manages highly sensitive executive context, including calendars, tasks, memories, and access tokens for external systems. Any leakage of data across workspace boundaries is a critical security failure. To prevent this, data scoping must be robust, easy to enforce, and verified at every boundary.

## Decision
We enforce **Workspace-Scoped Multi-Tenancy** as the absolute security boundary:

1. **Gateway Resolution**: The user's active workspace tenant is resolved at the presentation gateway during authentication.
2. **Context Propagation**: Once resolved, the active `WorkspaceId` is bound to a secure thread-local context (`WorkspaceContextHolder`).
3. **Port Validation**: Every inbound port method must retrieve the `WorkspaceId` from the context and validate that the executing user has access to the workspace.
4. **Data Isolation**: All database tables containing user-owned data (Tasks, Calendar events, Memory logs, Connector profiles) must include a `workspace_id` column. Direct database SQL joins or foreign keys across schemas are forbidden to prevent bypassing workspace boundaries.
5. **Shared Kernel Identifier**: `WorkspaceId` is defined as a strongly typed Value Object in the Shared Kernel leaf module to allow type-safe propagation across contexts.

## Evidence
- [architecture.md:L13-L14 (Workspace boundary)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L13-L14)
- [architecture.md:L235-L237 (AD-009)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L235-L237)
- [architecture-v2.md:L145 (AD-009)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L145)
- [architecture-v2.md:L285-L289 (Phasing context)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L285-L289)
- [context-map.md:L195-L205 (Workspace Multi-Tenancy map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L195-L205)
- [context-map.md:L262-L264 (Workspace Scoping)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L262-L264)
- [context-map.md:L386-L387 (No Database Sharing)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L386-L387)
- [database-overview.md:L135-L163 (§8 Cross-Context Relationship Rules)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-overview.md#L135-L163)

## Alternatives
- **Database / Schema-per-Tenant**: Considered and rejected. Although separating databases or schemas per user workspace provides the highest isolation, it introduces extreme operational overhead, makes database schema migrations complex, and scales poorly on a single database instance.
- **Purely Application-Level Scoping**: Considered and rejected. Relying on developers to manually write workspace filters in every query without a central context holder and automated checks is highly error-prone.

## Consequences
### Positive
- **Strong Isolation**: A unified boundary is checked at the authentication gateway, protecting all database records.
- **Simpler Business Code**: Application services retrieve the current workspace context implicitly instead of requiring it as a parameter in every method signature.
- **Independent Contexts**: Deleting a workspace publishes a `WorkspaceDeleted` event, allowing each module to clean up its local schema tables asynchronously.

### Negative
- **Query Complexity**: Custom database queries must explicitly include `workspace_id = :workspaceId` to prevent full table scans and leakages.
- **Cross-Workspace Workflows**: Relational data structures cannot be queried directly using joins across modules (e.g. joining workspace profiles with tasks), requiring application-level assembly.

## Implementation Notes
- Implement a thread-local `WorkspaceContextHolder` in the Shared Kernel or Workspace context.
- Use Spring Security filters to decode the JWT, extract the active workspace claim, and populate the context.
- All JPA entities must use Hibernate filters or Spring Data JPA specifications to automatically append the `workspaceId` condition to select queries.
- Build composite indexes on tables containing `(workspace_id, ...)` to optimize query speed and prevent sequential table scans.
