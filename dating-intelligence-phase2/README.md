# Personal Dating Intelligence & Copilot — Phase 1

Phase 1 establishes the production-oriented foundation for a multi-agent dating intelligence platform.

## Architecture

- `apps/web` — Next.js web shell
- `apps/api` — Fastify API shell
- `packages/contracts` — shared domain/event/agent contracts
- `packages/config` — validated environment/configuration
- `packages/ai-gateway` — provider registry + routing abstractions
- `packages/agents` — agent interfaces + conversation state machine
- `packages/platforms` — platform adapter/capability contracts
- `packages/observability` — structured logging helpers
- `packages/db` — PostgreSQL schema/migrations/seed
- `infra` — Docker Compose for PostgreSQL + Redis
- `docs` — architecture and permission model

## Core product rule

The default mode is human-controlled.

1. Copilot: AI recommends; user sends.
2. Autonomous initiation: AI may discover eligible profiles and send one first message when explicitly enabled; it stops when a reply arrives and hands off to the user.
3. Delegated conversation: AI may continue only after explicit user delegation, with configurable time/message limits and stop conditions.

Platform adapters must use authorized APIs or user-controlled workflows. This foundation intentionally does not implement CAPTCHA bypasses, anti-bot evasion, credential theft, mass unsolicited spam, or unsupported private APIs.

## Run

Requirements:
- Node.js 20+
- pnpm 9+
- Docker

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: http://localhost:3000
API: http://localhost:4000
Health: http://localhost:4000/health

## Next phase

Phase 2 should implement concrete AI providers behind `packages/ai-gateway`, starting with legitimate API keys and provider-specific quota telemetry.


## Phase 2 — Multi-Provider AI Gateway

Phase 2 adds:

- Gemini adapter
- OpenAI-compatible adapter for Groq, OpenRouter, NVIDIA NIM, Alibaba Cloud Model Studio, DeepSeek and Z.AI
- central provider registry
- round-robin routing
- least-quota-pressure routing
- latency-aware routing
- capability filtering
- fallback providers
- retry abstraction with exponential backoff + jitter
- circuit breaker / cooldown
- application-level hard spend cap
- provider health diagnostics
- provider quota telemetry schema
- monthly provider usage schema
- gateway unit tests

Provider keys remain environment variables and are never returned by diagnostics.

### Gateway endpoint

`GET /api/v1/ai/providers`

Returns provider/model/capability/health metadata but not credentials.

`POST /api/v1/ai/generate`

```json
{
  "prompt": "Generate three playful opening lines based on this public profile.",
  "capability": "text",
  "temperature": 0.8,
  "maxTokens": 200
}
```

### Important

Free-tier availability, model names, quotas and regional eligibility can change. The provider adapter layer is deliberately configurable so current provider documentation can be applied without changing the agent layer. Do not rotate identities, bypass quotas, scrape credentials, or evade provider/platform rate limits.
