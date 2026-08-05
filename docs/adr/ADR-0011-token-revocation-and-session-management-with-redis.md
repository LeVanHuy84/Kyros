# ADR-0011: Token Revocation and Session Invalidation with Redis

## Status
Approved

## Context
The system uses JSON Web Tokens (JWT) for stateless authentication. However, requirements dictate that users must be able to log out, change passwords, or have their accounts suspended, which necessitates immediate token invalidation. Standard JWTs cannot be revoked without state. Storing revoked token IDs (JTIs) in PostgreSQL and querying the relational database on every API request would degrade performance and overload the relational database with high-frequency, simple reads on the hot path.

## Decision
We select **Redis** as our in-memory cache and transient data store, specifically to handle real-time token invalidation and session management:

1. **In-Memory Deny-List**: On logout, password change, or account suspension, the system publishes a revocation event and writes the token identifier (`jti`) to Redis as a key (e.g., `revoked:jti`) with a Time-To-Live (TTL) set to the remaining validity duration of the token.
2. **O(1) Gateway Validation**: The authentication gateway intercepts incoming requests, extracts the JWT, and performs a single $O(1)$ read from Redis to check if the token has been revoked. If the key exists in Redis, the request is rejected immediately without hitting PostgreSQL.
3. **Database Audit Log**: The revocation event is persisted to PostgreSQL schema `auth.session_events` purely as an append-only audit trail and recovery source. PostgreSQL is never queried for the per-request token validity check.

## Evidence
- [auth.md:L74-L77 (Persistence Notes)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L74-L77)
- [auth.md:L84-L85 (Infrastructure non-relational)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L84-L85)
- [auth.md:L98-L99 (Index Strategy)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L98-L99)
- [auth.md:L107-L108 (Token Validity Check)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L107-L108)
- [auth.md:L134-L135 (Redis for the Deny-List)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/auth.md#L134-L135)
- [database-review.md:L157 (Redis deny-list)](file:///D:/VsCode/Java/ai_executive_assistant/docs/database-design/database-review.md#L157)

## Alternatives
- **PostgreSQL Deny-List Check**: Rejected. Querying a relational table on every single request introduces database connection pool contention and latency on the application's hottest path.
- **Stateful Database Session Store**: Rejected. Storing all active user sessions in PostgreSQL couples the server to state, violating the stateless scalability goal.

## Consequences
### Positive
- **High Performance**: Token validation runs in sub-millisecond time.
- **Automatic Cleanup**: Redis automatically prunes expired keys using the native key-level TTL, avoiding manual clean-up scripts.
- **Resilient Audit Trail**: If Redis experiences data loss, the Postgres `auth.session_events` table contains the complete historical record.

### Negative
- **Infrastructure Overhead**: Adds a new infrastructure component (Redis) to the deployment stack.
- **Security-Availability Trade-off**: If Redis is unreachable, the system must decide whether to fail-open (allow potentially revoked tokens) or fail-closed (reject requests). We select **fail-closed** to maintain the platform's security-first guarantee.

## Implementation Notes
- Configure Redis with **Append Only File (AOF)** persistence enabled (setting `appendfsync everysec`) so that database restarts do not restore revoked tokens.
- Implement the deny-list check in the API gateway filter (`com.assistant.auth.presentation.GatewayFilter`).
- Handle Redis connection exceptions: throw a secure `503 Service Unavailable` error if the Redis connection is lost (fail-closed).
