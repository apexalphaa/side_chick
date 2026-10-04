# Phase 2.1 — AI Gateway Hardening

Phase 2.1 strengthens the gateway before the agent layer is built.

### Added
- smooth weighted round robin
- quota-header parsing
- versioned model-price catalog
- token-based cost accounting
- streaming contracts
- multimodal/vision normalization contracts
- Redis-compatible distributed-state abstraction
- stronger circuit/retry behavior
- provider weights
- routing/price/quota tests

### Production rule
Never guess provider pricing or quotas. Register current official model prices before relying on cost estimates. Unknown prices intentionally produce a zero estimate rather than fabricated numbers.

### Distributed deployment
The gateway exposes `DistributedState`; production should bind this to Redis/Upstash for atomic counters, circuit state, routing state and idempotency.

### Security
Provider keys remain server-side and are never returned by diagnostics. No quota bypass, CAPTCHA bypass, account farming, credential sharing, or anti-bot evasion is implemented.
