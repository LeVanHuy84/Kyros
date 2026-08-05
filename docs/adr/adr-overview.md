# Architecture Decision Records (ADR) Overview

This document lists and summarizes the Architecture Decision Records (ADR) for the **AI Executive Assistant** project. These records document the key architectural and design decisions, their contexts, rationale, consequences, and implementation notes.

## ADR Status Summary

| ID | Title | Status | Group / Category |
| :--- | :--- | :--- | :--- |
| [ADR-0001](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0001-modular-monolith-architecture.md) | [Adoption of Modular Monolith Architectural Style](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0001-modular-monolith-architecture.md) | **Approved** | System Architecture & Phasing |
| [ADR-0002](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0002-hexagonal-architecture-and-layering.md) | [Hexagonal (Ports & Adapters) per Module and Strict Layering](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0002-hexagonal-architecture-and-layering.md) | **Approved** | Modularity & Code Layering |
| [ADR-0003](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0003-event-driven-communication-and-in-process-bus.md) | [Asynchronous Event-Driven Communication with In-Process Bus](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0003-event-driven-communication-and-in-process-bus.md) | **Approved** | Inter-Module Integration |
| [ADR-0004](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0004-agent-sandbox-and-tool-registry.md) | [Agent Sandbox and Exclusive Tool Registry Gateway](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0004-agent-sandbox-and-tool-registry.md) | **Approved** | AI Agent Security & Interface |
| [ADR-0005](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0005-human-in-the-loop-and-re-planning-limits.md) | [Human-in-the-Loop Approvals and Self-Reflection Limits](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0005-human-in-the-loop-and-re-planning-limits.md) | **Approved** | AI Agent Control & Safety |
| [ADR-0006](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0006-memory-agent-decoupling-and-rag-policy.md) | [Memory-Agent Decoupling and RAG Grounding Policies](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0006-memory-agent-decoupling-and-rag-policy.md) | **Approved** | Context, Memory & RAG |
| [ADR-0007](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0007-workspace-scoping-and-tenancy.md) | [Workspace-Scoped Multi-Tenancy and Data Isolation](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0007-workspace-scoping-and-tenancy.md) | **Approved** | Security Isolation |
| [ADR-0008](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0008-connector-hub-and-credential-security.md) | [Connector Hub Anti-Corruption Layer and Credential Vault Security](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0008-connector-hub-and-credential-security.md) | **Approved** | External Integration & Security |
| [ADR-0009](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0009-relational-database-engine-and-schema-isolation.md) | [Relational Database Selection and Schema-per-Context Isolation](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0009-relational-database-engine-and-schema-isolation.md) | **Approved** | Database Engine & Schema |
| [ADR-0010](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0010-persistence-policies-migrations-and-concurrency.md) | [Database Migration, Soft Delete, and Concurrency Policies](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0010-persistence-policies-migrations-and-concurrency.md) | **Approved** | Persistence, Soft Delete & Migration |
| [ADR-0011](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0011-token-revocation-and-session-management-with-redis.md) | [Token Revocation and Session Invalidation with Redis](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0011-token-revocation-and-session-management-with-redis.md) | **Approved** | Session Security & Cache |
| [ADR-0012](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md) | [LLM Provider Selection and Low-Latency Inference with Groq](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0012-llm-provider-selection-and-low-latency-inference-with-groq.md) | **Approved** | AI Agent & Inference |
| [ADR-0013](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0013-workflow-automation-engine-decision-in-app-vs-n8n.md) | [Workflow Automation Engine Decision — In-App Engine vs. n8n Integration](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0013-workflow-automation-engine-decision-in-app-vs-n8n.md) | **Approved** | Workflow & Automation |
| [ADR-0014](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0014-containerized-deployment-and-environment-standardization-via-docker.md) | [Containerized Deployment and Environment Standardization via Docker](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0014-containerized-deployment-and-environment-standardization-via-docker.md) | **Approved** | Deployment & Infrastructure |
| [ADR-0015](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0015-core-software-design-patterns.md) | [Adoption of Core Software Design Patterns](file:///D:/VsCode/Java/ai_executive_assistant/docs/adr/ADR-0015-core-software-design-patterns.md) | **Approved** | Software Architecture Patterns |


---

## Template Guideline

Each Architecture Decision Record follows the standard template below:

```markdown
# ADR-XXXX: [Title]

## Status
[Approved | Proposed | Deprecated | Superseded]

## Context
[The background context, business drivers, requirements, and constraints that necessitate the decision.]

## Decision
[The core architectural decision, clearly stated without ambiguity.]

## Evidence
[References to baseline requirements, user stories, architecture baseline documents, or reviews that justify the decision.]

## Alternatives
[Alternative approaches that were considered and why they were rejected, if mentioned in the project documentation.]

## Consequences
[The positive and negative trade-offs resulting from this decision (e.g. complexity, scalability, testability, security).]

## Implementation Notes
[Guidelines, code structure rules, packages, framework considerations, or verification rules (like ArchUnit) to enforce the decision during construction.]
```
