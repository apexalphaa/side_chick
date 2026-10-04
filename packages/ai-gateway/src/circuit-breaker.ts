import type { ProviderHealth } from "./types.js";

export class CircuitBreaker {
  private readonly states = new Map<string, ProviderHealth>();

  constructor(
    private readonly failureThreshold: number,
    private readonly cooldownMs: number
  ) {}

  health(id: string): ProviderHealth {
    return this.states.get(id) ?? {
      consecutiveFailures: 0,
      state: "CLOSED"
    };
  }

  canRequest(id: string, now = Date.now()): boolean {
    const h = this.health(id);
    if (h.state === "CLOSED") return true;
    if (h.state === "OPEN" && h.openedAt && now - h.openedAt >= this.cooldownMs) {
      h.state = "HALF_OPEN";
      this.states.set(id, h);
      return true;
    }
    return h.state === "HALF_OPEN";
  }

  success(id: string, latencyMs: number): void {
    this.states.set(id, {
      consecutiveFailures: 0,
      state: "CLOSED",
      lastSuccessAt: Date.now(),
      latencyMs
    });
  }

  failure(id: string): void {
    const h = this.health(id);
    const failures = h.consecutiveFailures + 1;
    this.states.set(id, {
      ...h,
      consecutiveFailures: failures,
      state: failures >= this.failureThreshold ? "OPEN" : h.state,
      openedAt: failures >= this.failureThreshold ? Date.now() : h.openedAt,
      lastFailureAt: Date.now()
    });
  }

  all(): Record<string, ProviderHealth> {
    return Object.fromEntries(this.states.entries());
  }
}
