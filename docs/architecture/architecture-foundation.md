# System Vision

The **AI Executive Assistant** is a production-grade personal assistant system designed to help executives, individual professionals, and developers manage their workloads and coordinate their digital lives. The product aims to dramatically reduce administrative overhead and cognitive load by integrating core personal management tools—Tasks (Todo), Calendar Events, Reminders, Notes, and Automated Workflows—with an autonomous AI Agent.

Unlike traditional assistant applications, the AI Executive Assistant is designed from the ground up to let the AI act on behalf of the user. Users can define high-level goals in natural language (e.g., "Review my schedule for next Monday and prepare a plan for any conflicts"), and the AI Agent will decompose these goals, formulate execution plans, invoke internal tools, and self-reflect to recover from failures. 

Crucially, the system is a secure, single-tenant workspace environment for each user. Security, data privacy, and user control are paramount: the AI Agent is restricted from direct database access and must interact solely through a secure Tool Registry, and critical actions (such as plan execution and email task generation) require explicit user confirmation. By providing a decoupled, connector-based integration hub, the assistant synchronizes with third-party platforms (like Google Calendar, Outlook, Slack, Jira, Notion, and TickTick) to establish a unified digital command center.

---

# Core Architectural Principles

These fundamental principles drive the architecture and are strictly derived from the system requirements:

1. **Workspace Boundary & Isolation (Security-First)**
   Every interaction, data record, configuration, and execution is strictly bounded to a single workspace. Authentication is a mandatory gateway validated before any domain operation is allowed ([AUTH-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L64)). Data from one workspace must never leak to another.

2. **Tool-Driven Agent Interaction (Auditability & Safety)**
   The AI Agent has no direct database access. It operates exclusively through a strictly defined Tool Registry ([AI-002](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L310)). This ensures that every AI action is decoupled from underlying databases, validated against permission policies, and fully auditable.

3. **Human-in-the-Loop (User Control)**
   While the AI Agent is autonomous, the system keeps the user in control. The AI Agent must always request and obtain user confirmation before executing any decomposed plan ([AI-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L287)) or processing incoming email tasks ([CON-004](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L521)). In the event of an unrecoverable failure, the AI must escalate directly to the user rather than failing silently ([AI-003](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L331)).

4. **Connector-Based Integration (Decoupled Adaptability)**
   Integration with external systems is managed through a central Connector Hub ([CON-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L452)). This hub translates external third-party data models into internal domain representations, isolating internal business logic from changes in external API schemas.

5. **Strict Domain Modularity (Modular Monolith)**
   The system is structured as a Modular Monolith, separating distinct business domains (Auth, Todo, Calendar, Workflow, AI Agent, Memory, Notification, Connector) into highly cohesive, loosely coupled modules. Modules communicate via clear interfaces and events to prevent spaghetti dependencies.

---

# Core Concepts

The first-class concepts of the system and their respective responsibilities include:

* **Workspace**: The ultimate security and data boundary. It owns all user data (tasks, events, notes, memory, conversations, and connectors) and guarantees complete multi-tenant isolation.
* **Agent**: The cognitive orchestration layer. It handles natural language understanding, parses user requests, generates plans, dynamically selects tools, evaluates outputs, and performs self-reflection and correction.
* **Goal**: A natural language expression of a user's intent or desired outcome (e.g., "Schedule a weekly sync with the dev team and email them the agenda").
* **Plan**: A sequenced, dependency-aware set of actions produced by the Agent. Each action maps to a specific tool or domain operation.
* **Tool & Tool Registry**: A tool is a callable, sandbox capability (e.g., create task, modify calendar event) exposed to the AI. The Tool Registry is the secure registry that lists and governs these tools; it cannot be bypassed by the AI.
* **Connector & Connector Hub**: A connector is a plugin that adapts a specific third-party API (e.g., Jira, Slack) to the internal system. The Connector Hub manages the lifecycle, credentials, and routing of these connectors.
* **Memory**: The system's contextual retention mechanism. It comprises:
  * *Conversation History*: A multi-turn log of interactions scoped to a workspace ([MEM-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L379)).
  * *User Preferences*: Customized settings (e.g., timezone, default lead times) influencing AI and notification behaviors ([MEM-002](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L402)).
  * *Long-Term Semantic Memory*: Key facts and preferences extracted from conversations, tagged with confidence scores ([MEM-003](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L425)).
* **Task**: A work item in the Todo domain, characterized by a title, description, priority (High, Medium, Low), tags, and an optional due date.
* **Schedule**: The orchestration of time-based parameters. This includes start/end constraints for events, lead times for reminders, and iCalendar recurrence rules.
* **Knowledge (Notes)**: User-authored documents and wikis (represented in Markdown format) that serve as a source for RAG grounding context ([CON-006](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L567), [AI-004](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L353)).

---

# Supporting Domains

These business domains exist to support the system's core capabilities:

* **Authentication & Identity Management (Auth)**: Exists to securely register and verify users, manage credentials, and map each user to their unique primary workspace, providing a secure access control baseline.
* **Task Management (Todo)**: Exists to handle CRUD operations on tasks, prioritization, tagging, filtering, and the logic of recurring intervals.
* **Calendar & Event Scheduling (Calendar)**: Exists to block time, schedule events, prevent overlaps, and compute lead times for reminders.
* **Workflow Automation (Workflow)**: Exists to evaluate triggers (domain events or cron schedules) and execute corresponding sequence actions, eliminating manual administrative work.
* **Notification Dispatching (Notification)**: Exists to centralize routing, formatting, and delivery of alerts (in-app fallback, Slack, email) while honoring user preferences and urgency levels.
* **Context & Memory Management (Memory)**: Exists to store past conversations and extract persistent preferences, enabling the agent to learn from user context over time.
* **Knowledge Base (Notes)**: Exists to store, index, and query text content, providing the context required for retrieval-augmented generation.

---

# External Systems

The requirements imply integration with the following external systems:

* **Google Calendar API**: Bidirectional synchronization of local events with the user's Google Calendar ([CON-002](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L475)).
* **Microsoft Outlook Calendar API**: Bidirectional synchronization of local events with Outlook ([CON-002](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L475)).
* **GitHub API**: Fetching user repository activity logs and code metrics to generate developer productivity summaries ([CON-003](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L498)).
* **SMTP/IMAP / Gmail API**: Sending email summaries and reports ([NOTIF-002](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L641)) and processing/extracting tasks from incoming emails ([CON-004](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L521)).
* **Slack Web API**: Sending urgent or critical alerts to specified channels and receiving quick slash command actions ([CON-005](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L544)).
* **Notion API**: Fetching and importing pages and databases into the local notes repository for RAG ingestion ([CON-006](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L567)).
* **TickTick API**: Bidirectional synchronization of task lists ([CON-007](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L590)).
* **Jira API**: Pulling issue cards and mapping them to internal task models ([CON-007](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L590)).
* **LLM Provider API** (e.g., Google Gemini, OpenAI): Serves as the external AI model backend that processes user requests, performs RAG, generates planning steps, and handles reflection.

---

# System Constraints

The system must comply with the following technical and business constraints:

* **Strict Workspace Boundaries**: Authentication must be successfully completed before any other domain operation is permitted. Cross-workspace data sharing or access is prohibited ([AUTH-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L64)).
* **Password Complexity**: User passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character. Emails must be unique across the platform ([AUTH-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L64)).
* **Soft-Delete Recovery Duration**: Tasks that are deleted must be soft-deleted and remain recoverable only within the active session, up to a maximum duration of 2 hours of inactivity ([TODO-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L91)).
* **No-Overlap Event Preference**: Calendar event updates or creations must fail validation if they overlap with an existing event and the user has enabled the "prevent calendar overlap" setting ([CAL-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L164)).
* **iCalendar Compliance**: Recurrence rules for repeating tasks must strictly conform to the RFC 5545 specification ([TODO-003](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L136)).
* **Self-Reflection Limit**: The AI Agent is limited to a maximum of 3 automatic re-planning attempts per goal to prevent runaway token costs and infinite loops ([AI-003](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L331)).
* **Grounding and Citation Integrity**: Question answering (RAG) responses must be strictly grounded in workspace documents (notes or history) with source citations. If no workspace documents support the answer, the AI must state "I do not know" rather than hallucinate ([AI-004](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L353)).
* **Slack Routing Restriction**: Only notifications classified with an urgency level of "Urgent" or "Critical" are permitted to be pushed to Slack channels ([CON-005](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L544)).
* **Plan and Action Consent**: The AI cannot execute plans or create tasks from email extraction without explicit user confirmation ([AI-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L287), [CON-004](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L521)).
* **Workflow Rule Prevention**: The workflow rule engine must validate rules to prevent circular trigger-action paths (e.g., preventing Rule A from triggering Rule B which triggers Rule A) ([WF-001](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/user-stories-v2.md#L215)).

---

# Risks

The architecture must address the following key risks:

* **LLM Non-Determinism and Infinite Loops**: The AI Agent's planning and self-correction loop can result in infinite loops, high costs, or unexpected tool execution. The 3-attempt limit partially mitigates this, but complex tasks could still execute bad tools or get stuck in repetitive sequences.
* **Workspace Isolation Violations (Data Leakage)**: In a Modular Monolith sharing a single database, logical bugs or incorrect tenant mapping could expose private workspace data to other tenants.
* **External API Failures and Rate Limits**: Heavily integrating with third-party systems (GitHub, Notion, Jira, Google Calendar) makes the platform vulnerable to rate limits and external downtime, which can hang asynchronous processes or degrade user experience.
* **Synchronization Conflicts**: Bidirectional sync between local workspace data and external sources (Google Calendar, Outlook, TickTick) can result in complex conflicts that are hard to resolve automatically without disrupting user data.
* **OAuth Token & Credential Exposure**: Storing access tokens for external systems (e.g., GitHub, Notion) requires high security (encryption at rest, secure rotation) to prevent system-wide compromises.
* **Performance Overhead of Vector Searches**: High-frequency RAG searches or semantic memory queries could introduce significant latency, degrading the real-time interaction experience.

---

# Open Decisions

The following structural decisions must be finalized during the architectural design phase:

* **Module Communication Pattern**: Should the modules in the Modular Monolith communicate via synchronous direct Spring bean calls, internal interface boundaries, or asynchronously via an internal event bus (e.g., Spring ApplicationEvents) to maintain loose coupling?
* **Vector Database Technology Selection**: Whether pgvector (leveraging the existing PostgreSQL setup) or a dedicated vector database (like Qdrant) is preferred for RAG and semantic memory.
* **Bidirectional Sync Conflict Resolution Strategy**: Defining the default conflict resolution policies for calendar and task sync (e.g., last-write-wins, prioritizing internal workspace, or requesting user feedback).
* **Workspace Data Partitioning Strategy**: Whether to implement multi-tenancy at the schema level (separate schemas for each workspace) or at the row level (tenant ID column in a shared database schema).
* **Background Job Scheduler Choice**: Selection of a scheduler framework (e.g., Quartz, Spring Scheduler, or DbScheduler) that supports workspace isolation, scalability, and cron expressions for workflow automation.
* **Credential Storage Security Mechanism**: The encryption standard and key vault solution (e.g., HashiCorp Vault, Spring Cloud Config Server, or database-level encryption) for protecting users' OAuth tokens.
* **LLM Context Window Management Strategy**: The method for summarizing, truncating, or sliding the conversation history and tool outputs to keep the context window compact and cost-effective.
