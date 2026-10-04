# Phase 1 Architecture

## 1. Control plane

Every action flows through:
`UI -> API -> Orchestrator -> Permission/Safety -> Agent -> AI Gateway/Platform Adapter -> Audit/Event`

Agents never own provider credentials and never directly bypass platform restrictions.

## 2. Agent boundaries

- Discovery: finds candidate profiles from authorized sources.
- Profile Intelligence: extracts non-sensitive conversation-relevant facts.
- Ranking: scores candidates using explicit, non-sensitive signals.
- Content: generates opener/reply/follow-up candidates.
- Conversation: interprets the current interaction.
- Conversation Phase/State: tracks small talk, rapport, playful/flirty, deeper, date planning, etc.
- Voice/Persona: models the user's writing style from permitted examples and edits.
- Memory: stores relationship facts and outcomes.
- Delegation: grants/revokes temporary AI send permission.
- Notification: hands replies and approval requests back to the user.
- Safety: checks permissions, limits, stop conditions, and prohibited behavior.
- Analytics/Learning: records outcomes and user corrections.

## 3. Permission model

COPILOT:
- AI can analyze/generate.
- AI cannot send.

AUTONOMOUS_INITIATION:
- Explicit campaign permission required.
- AI can send the first message only.
- On reply: immediate human handoff.
- Daily campaign budget applies.

DELEGATED_CONVERSATION:
- Explicit conversation-level permission.
- Expiration required.
- Message limit required.
- Any safety/uncertainty threshold can revoke delegation.

## 4. State machine

DISCOVERED -> ANALYZING -> RANKED -> QUALIFIED -> READY_TO_INITIATE
-> OPENER_GENERATED -> OPENER_SENT -> WAITING_FOR_REPLY

WAITING_FOR_REPLY + reply -> HUMAN_HANDOFF by default.

Only explicit delegation can enter AI_DELEGATED behavior after handoff.

## 5. Provider routing

The gateway owns:
- provider registry
- model capability registry
- request routing
- fallback
- quota telemetry
- latency telemetry
- hard spend caps
- provider enable/disable

Planned strategies:
- round robin
- weighted round robin
- least quota pressure
- lowest latency
- capability-first
- fallback chain
- ensemble/judge for high-value decisions

## 6. Data

PostgreSQL is the system of record.
Redis is the queue/cache/event transport layer.
Vector memory is stored in PostgreSQL via pgvector.

## 7. Privacy

Avoid inferring or ranking on sensitive traits. Store only information necessary for the product's user-directed purpose. Keep audit trails for AI actions and permissions.
