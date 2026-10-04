# Phase 2 Checklist

- [x] Central provider registry
- [x] Gemini native adapter
- [x] OpenAI-compatible adapter
- [x] Groq adapter configuration
- [x] OpenRouter adapter configuration
- [x] NVIDIA adapter configuration
- [x] Alibaba adapter configuration
- [x] DeepSeek adapter configuration
- [x] Z.AI adapter configuration
- [x] Capability filtering
- [x] Round robin
- [x] Least quota pressure
- [x] Latency-aware selection
- [x] Fallback chain
- [x] Retry abstraction
- [x] Exponential backoff + jitter
- [x] Circuit breaker
- [x] Provider health endpoint
- [x] Application spend cap
- [x] Provider quota telemetry schema
- [x] Provider monthly usage schema
- [x] API generation endpoint
- [x] Unit tests for routing/fallback/spend cap

## Phase 2.1 recommended

- [ ] Smooth weighted round robin
- [ ] Redis-backed distributed circuit state
- [ ] Persist every request/response telemetry record
- [ ] Parse provider-specific quota headers into PostgreSQL
- [ ] Versioned model price table
- [ ] Exact token-cost accounting per provider/model
- [ ] streaming support
- [ ] vision/multipart normalization
- [ ] embeddings provider implementation
- [ ] admin UI for provider toggles
- [ ] OpenTelemetry
- [ ] queue workers
