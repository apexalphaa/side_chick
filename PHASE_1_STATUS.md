# Phase 1 Status

This bundle is the Phase 1 source foundation. It is intentionally dependency-light and uses interfaces/stubs where a provider or platform needs an external authorization flow.

Before production use:
1. Install dependencies with pnpm.
2. Verify the PostgreSQL image has pgvector support; if not, switch to a pgvector-enabled PostgreSQL image.
3. Implement OAuth/session management.
4. Add real provider adapters only for keys/accounts you control.
5. Add authorized platform integrations.
6. Add queue workers and durable event handling.
7. Add tests and CI.
