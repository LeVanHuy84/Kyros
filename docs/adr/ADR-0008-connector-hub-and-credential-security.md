# ADR-0008: Connector Hub Anti-Corruption Layer and Credential Vault Security

## Status
Approved

## Context
The AI Executive Assistant integrates with multiple third-party SaaS platforms (Google Calendar, Outlook, Slack, GitHub, Notion, Jira, TickTick). Directly coupling the core domains (Todo, Calendar) to external APIs would leak third-party data formats and schema details into internal code, leading to fragility when external APIs change. Additionally, the system must securely manage highly sensitive OAuth refresh tokens, API keys, and email credentials.

## Decision
We decouple integrations using a centralized **Connector Hub** and secure credential handling:

1. **Anti-Corruption Layer (ACL)**: The Connector Hub acts as an ACL. It maps external JSON payloads into native domain value objects and routes operations through public ports (`TodoPort`, `CalendarPort`). Internal domain logic remains completely unaware of external provider models.
2. **Credential Vault**: All access tokens, passwords, and API keys are stored encrypted at rest. Credential read/write operations must go through a secure `CredentialVaultPort` interface, shielding domain code from KMS or filesystem specifics.
3. **SPI-First Strategy**: The Connector module provides a plugin Service Provider Interface (SPI). Third-party connectors are implemented as external plugins matching `ExternalProviderPort`, keeping the core codebase slim.
4. **Decoupled Urgency Logic**: Slack and email notification delivery limits (such as restricting Slack delivery to "Urgent/Critical" messages) are owned by the **Notification** module, not the Connector Hub. The Connector Hub acts purely as the delivery transport.

## Evidence
- [architecture.md:L153-L176 (Connector Architecture)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L153-L176)
- [architecture.md:L235-L239 (AD-008, AD-010)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture.md#L235-L239)
- [architecture-v2.md:L79-L84 (ISS-07 - Slack urgency ownership split)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L79-L84)
- [architecture-v2.md:L124-L125 (Connector recommendations)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L124-L125)
- [architecture-v2.md:L143-L148 (AD-008, AD-010, AD-012)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L143-L148)
- [architecture-v2.md:L378-L387 (Connector Architecture baseline)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L378-L387)
- [context-map.md:L326-L350 (§9 Anti-Corruption Layer Map)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L326-L350)
- [context-map.md:L388-L390 (External SDK leakage prevention)](file:///D:/VsCode/Java/ai_executive_assistant/docs/context-mapping/context-map.md#L388-L390)

## Alternatives
- **Direct Integration**: Considered and rejected. Allowing modules like Todo or Calendar to directly reference external SDKs or call third-party APIs results in a brittle codebase where external API deprecations cause compilation and execution failures inside core business domains.
- **Plaintext Secret Storage**: Rejected. Storing OAuth tokens and secrets in standard database columns without encryption poses severe security risks and violates basic compliance standards.

## Consequences
### Positive
- **Stability**: Internal task and scheduling logic remains unchanged when an external provider updates its API version.
- **Extensibility**: Adding a new integration requires only implementing a new `ExternalProviderPort` adapter inside the Connector context.
- **Enhanced Security**: Credentials are encrypted at rest using system-level KMS or vault mechanisms.

### Negative
- **Mapping Overhead**: Developers must write translation code to map objects between third-party formats and internal value objects.
- **Rate-Limit Handling**: The Connector Hub must manage complex rate-limiting, retries, and network timeouts.

## Implementation Notes
- Define connector adapters in `com.assistant.connector.adapter`. Standardize incoming payloads through mappings to Shared Kernel types.
- Restrict imports: only the `Connector` and `Notification` channel adapters may import external SDK libraries (e.g. Google APIs Client, Slack Web API).
- Secure the vault behind the `CredentialVaultPort` interface, allowing database-level AES-256 encryption in phase one and transitioning to HashiCorp Vault in later phases.
