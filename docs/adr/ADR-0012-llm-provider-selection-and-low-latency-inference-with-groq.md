# ADR-0012: LLM Provider Selection and Low-Latency Inference with Groq

## Status
Approved

## Context
The AI Agent executes actions through a multi-stage cognitive loop (NLU Parsing → Sequencing & Planning → Tool Call Execution → Outcome Evaluation & Self-Reflection). Because this loop requires multiple sequential LLM calls for a single user goal, latency accumulates rapidly. If standard commercial LLM APIs with typical response times of 2-5 seconds per call are used, a 3-step planning and reflection loop will result in 10-15 seconds of total user wait time, creating a slow and unresponsive experience. The system requires an inference platform that delivers extreme token-generation speeds while supporting industry-standard tool-calling capabilities.

## Decision
We decouple the LLM integration behind a clean outbound port and standardize on a dual-provider LLM strategy:

1. **Inference Port Isolation**: The AI Agent module defines an outbound `LLMPort` interface. All prompt rendering, history formatting, and JSON tool schema declarations are managed in the application layer. The infrastructure layer implements this port using HTTP clients, completely isolating domain logic from provider SDKs.
2. **Groq API as Primary Planning Backend**: We select the **Groq API** as the primary inference engine for the Agent's planning and self-reflection loops. By hosting open-source models (such as Llama 3) on custom LPU (Language Processing Unit) hardware, Groq provides extremely high generation speeds (often exceeding 500 tokens per second). This reduces the latency of a single reasoning step to a fraction of a second.
3. **Gemini API as Fallback & RAG Analyzer**: We select the **Google Gemini API** (Gemini 1.5 Pro / Flash) as a secondary provider. Gemini serves as a fallback for complex reasoning tasks that exceed the capabilities of smaller open models and is the primary model for Retrieval-Augmented Generation (RAG) due to its massive context window and native multimodal support.

## Evidence
- [project-discovery.md:L25-L27 (AI Technical Goals)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L25-L27)
- [project-discovery.md:L78-L78 (LLM Provider API Integration)](file:///D:/VsCode/Java/ai_executive_assistant/docs/requirements/project-discovery.md#L78-L78)
- [architecture-v2.md:L333 (LLMPort outbound abstraction)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L333)
- [architecture-v2.md:L472-L474 (LLM adapter ACL)](file:///D:/VsCode/Java/ai_executive_assistant/docs/architecture/architecture-v2.md#L472-L474)

## Alternatives
- **Local Model Execution (e.g. Ollama/Llama.cpp)**: Considered and rejected. Running LLMs locally provides high privacy but demands substantial CPU/GPU resources, resulting in slow inference speeds on average user machines and complicating installation.
- **Frontier Cloud APIs (OpenAI GPT-4/Anthropic Claude) exclusively**: Rejected. While possessing excellent reasoning capabilities, their high latency (2-5 seconds per request) and high token costs are inefficient for high-frequency internal reasoning and planning iterations.

## Consequences
### Positive
- **Responsive User Experience**: Sequential planning loops execute in under 2 seconds total.
- **Lower Operational Costs**: Token pricing for open-source models on Groq is significantly cheaper than commercial frontier models.
- **Provider Redundancy**: If Groq encounters downtime or rate limits, the system dynamically routes calls to Gemini.

### Negative
- **Model Reasoning Differences**: Open-source models (Llama 3) can occasionally generate incorrect JSON formats or fail to follow complex tool instructions compared to larger frontier models. We mitigate this by using strictly structured prompts, system instructions, and schema validation.
- **API Key Complexity**: The system operator must manage multiple API keys (Groq and Google Gemini).

## Implementation Notes
- Define the `LLMPort` interface in `com.assistant.agent.application.port.out`.
- Implement `GroqLLMAdapter` and `GeminiLLMAdapter` in `com.assistant.agent.infrastructure.llm`.
- Use a fallback design pattern: when a `GroqRateLimitException` or timeout occurs, catch it and delegate to the `GeminiLLMAdapter`.
- Store LLM API keys securely inside the vault (accessible via `CredentialVaultPort`).
