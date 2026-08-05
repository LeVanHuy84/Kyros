# Ubiquitous Language — Connector Bounded Context

This document defines the core business terms and concepts within the **Connector Bounded Context** (Connector Hub) of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. Connector
- **Definition**: An integration module that bridges the internal system to a specific external third-party service.
- **Synonyms**: Integration Plugin, Provider.
- **Context-Specific Meaning**: Translates external API schemas into internal domain representations via the Anti-Corruption Layer (ACL).

### 2. Connector Plugin
- **Definition**: A concrete implementation of the outbound integration SPI for a specific service provider.
- **Synonyms**: Provider Adapter.
- **Context-Specific Meaning**: Must be registered in the Connector Hub. Examples include the Google Calendar Adapter, GitHub Adapter, or Jira Adapter.

### 3. Connection
- **Definition**: A configured, authorized instance of a Connector associated with a specific user workspace.
- **Synonyms**: Authorized Profile, Integration Instance.
- **Context-Specific Meaning**: Stores sync configurations, last run metrics, and keys matching the encrypted authentication credentials stored in the Vault.

### 4. Connector Hub
- **Definition**: The central engine that coordinates connection lifecycles, schedules sync jobs, handles API rate limits, and maps models.
- **Synonyms**: Integration Engine, Sync Manager.
- **Context-Specific Meaning**: Provides the central ports (`ConnectorLifecyclePort`) through which presenters manage configurations.

### 5. Model Translation (Anti-Corruption Layer - ACL)
- **Definition**: The process of translating external data models into clean, native internal values, and vice versa.
- **Synonyms**: ACL Mapper, Data Mapping.
- **Context-Specific Meaning**: Isolates core productivity domains (Todo, Calendar) from external API changes or vendor SDK structures.

### 6. Synchronization (Sync)
- **Definition**: The scheduled or triggered process of aligning data between a local workspace and an external service.
- **Synonyms**: Sync Job, Data Sync.
- **Context-Specific Meaning**: Updates local or remote records by executing commands strictly through internal ports (like `TodoPort` or `CalendarPort`).

### 7. Bidirectional Sync
- **Definition**: A synchronization mode where data changes flow in both directions: from local to external and from external to local.
- **Synonyms**: Two-Way Sync.
- **Context-Specific Meaning**: The default synchronization mode unless configured otherwise.

### 8. One-Way Sync
- **Definition**: A synchronization mode where data flows in only one direction (typically from the external service to the local workspace).
- **Synonyms**: Read-Only Import.
- **Context-Specific Meaning**: Used for importing reference data without modifying the source system.

### 9. Sync Conflict
- **Definition**: A state where the same item has been modified in both the local workspace and the external service since the last synchronization.
- **Synonyms**: Scheduling Conflict, Version Conflict.
- **Context-Specific Meaning**: Suspends automatic merges for the conflicting record and flags it as a separate domain object awaiting user resolution.

### 10. Credential
- **Definition**: Authentication tokens, API keys, or security profiles used to authorize connections to external APIs.
- **Synonyms**: Security Token, OAuth Profile.
- **Context-Specific Meaning**: Credentials are never stored in plain text. They are stored in an encrypted vault accessed via the `CredentialVaultPort`.

### 11. Rate Limit & Backoff
- **Definition**: Rate Limit is the API call limit imposed by external services. Backoff is the wait time added between retries after a request failure.
- **Synonyms**: API Throttling, Retry Delay.
- **Context-Specific Meaning**: Implemented at the Connector Hub level to ensure API compliance and prevent account suspension.
