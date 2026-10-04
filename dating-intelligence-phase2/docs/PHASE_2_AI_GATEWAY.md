# Phase 2 — AI Gateway

## Request flow

`Agent -> AIGateway -> capability filter -> health filter -> routing strategy -> provider adapter -> telemetry -> agent`

## Provider adapters

Gemini uses its native `generateContent` endpoint.

Groq, OpenRouter, NVIDIA NIM, Alibaba Cloud Model Studio, DeepSeek and Z.AI are represented through an OpenAI-compatible adapter where their compatible endpoint is configured.

The gateway never exposes API keys to agents.

## Routing

### Round Robin
Cycles through eligible healthy providers.

### Weighted Round Robin
The Phase 2 contract includes weights. A full smooth weighted implementation can be substituted without changing callers.

### Least Quota Pressure
Uses provider request-remaining telemetry when available.

### Lowest Latency
Uses observed latency telemetry.

### Capability First
Filters providers by requested capability before selection.

## Failure handling

- provider disabled -> excluded
- circuit open -> excluded
- transient failure -> fallback
- repeated failure -> circuit opens
- cooldown -> half-open probe
- success -> circuit closes
- non-retryable HTTP classes (400/401/403/404) do not retry inside the provider operation

## Spend controls

`AI_MONTHLY_SPEND_CAP_USD` is an application-level hard ceiling.

Provider-specific pricing should be added in Phase 2.1 because model pricing changes and must be kept in a versioned price table rather than guessed.

## Security

Never put provider keys in:
- database records
- frontend code
- API responses
- logs
- git

Use only keys/accounts you control.
