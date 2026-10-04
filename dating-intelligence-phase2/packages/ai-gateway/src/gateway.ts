import type { GenerateRequest } from "@dating/contracts";
import { CircuitBreaker } from "./circuit-breaker.js";
import { withRetry } from "./retry.js";
import type {
  GatewayOptions,
  GatewayResult,
  ProviderAdapter,
  RoutingDecision,
  ProviderUsage
} from "./types.js";

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 400 || status === 401 || status === 403 || status === 404) return false;
  return true;
}

export class AIGateway {
  private cursor = 0;
  private spendUsd: number;
  private readonly breaker: CircuitBreaker;

  constructor(private readonly options: GatewayOptions) {
    this.spendUsd = options.initialSpendUsd ?? 0;
    this.breaker = new CircuitBreaker(
      options.policy.circuitFailureThreshold,
      options.policy.circuitCooldownMs
    );
  }

  private eligible(request: GenerateRequest): ProviderAdapter[] {
    return this.options.registry
      .adapters()
      .filter((a) => a.provider.enabled)
      .filter((a) => !request.capability || Boolean(a.provider.capabilities[request.capability]))
      .filter((a) => !this.options.policy.requiredCapability ||
        Boolean(a.provider.capabilities[this.options.policy.requiredCapability]))
      .filter((a) => this.breaker.canRequest(a.provider.id))
      .sort((a, b) => a.provider.priority - b.provider.priority);
  }

  private choose(candidates: ProviderAdapter[]): ProviderAdapter {
    if (!candidates.length) throw new Error("No healthy provider matches request");

    const strategy = this.options.policy.strategy;

    if (strategy === "LEAST_QUOTA_PRESSURE") {
      return [...candidates].sort((a, b) => {
        const ar = a.provider.quota.requestsRemaining ?? Number.MAX_SAFE_INTEGER;
        const br = b.provider.quota.requestsRemaining ?? Number.MAX_SAFE_INTEGER;
        return br - ar;
      }).at(0)!;
    }

    if (strategy === "LOWEST_LATENCY") {
      return [...candidates].sort((a, b) => {
        const ar = (a.provider as any).latencyMs ?? Number.MAX_SAFE_INTEGER;
        const br = (b.provider as any).latencyMs ?? Number.MAX_SAFE_INTEGER;
        return ar - br;
      }).at(0)!;
    }

    // Phase 2 deterministic weighted/round-robin baseline.
    const selected = candidates[this.cursor % candidates.length]!;
    this.cursor = (this.cursor + 1) % candidates.length;
    return selected;
  }

  async generate(request: GenerateRequest): Promise<GatewayResult> {
    if (this.options.monthlySpendCapUsd > 0 && this.spendUsd >= this.options.monthlySpendCapUsd) {
      throw new Error("AI monthly spend cap reached");
    }

    const candidates = this.eligible(request);
    const fallback = this.options.policy.fallbackProviderIds
      .map((id) => this.options.registry.get(id))
      .filter((x): x is ProviderAdapter => Boolean(x))
      .filter((x) => x.provider.enabled && this.breaker.canRequest(x.provider.id));

    const ordered: ProviderAdapter[] = [];
    const seen = new Set<string>();
    for (const candidate of [...candidates, ...fallback]) {
      if (!seen.has(candidate.provider.id)) {
        seen.add(candidate.provider.id);
        ordered.push(candidate);
      }
    }

    const maxAttempts = Math.min(
      this.options.policy.maxRetries + 1,
      Math.max(1, ordered.length)
    );
    const routing: RoutingDecision[] = [];
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const remaining = ordered.filter((x) => this.breaker.canRequest(x.provider.id));
      if (!remaining.length) break;

      const adapter = this.choose(remaining);
      routing.push({
        providerId: adapter.provider.id,
        strategy: this.options.policy.strategy,
        candidates: remaining.map((x) => x.provider.id),
        attempt,
        reason: attempt === 0 ? "primary selection" : "fallback after provider failure"
      });

      const started = performance.now();
      try {
        const result = await withRetry(
          () => adapter.generate(request),
          {
            attempts: 1,
            baseDelayMs: 200,
            maxDelayMs: 2_000,
            jitter: 0.2,
            shouldRetry: isRetryable
          }
        );

        const latency = Math.round(performance.now() - started);
        this.breaker.success(adapter.provider.id, latency);
        (adapter.provider as any).latencyMs = latency;

        const estimatedCostUsd = adapter.estimateCost?.(request, result) ?? 0;
        if (
          this.options.monthlySpendCapUsd > 0 &&
          this.spendUsd + estimatedCostUsd > this.options.monthlySpendCapUsd
        ) {
          throw new Error("Request would exceed AI monthly spend cap");
        }

        this.spendUsd += estimatedCostUsd;
        const usage: ProviderUsage = {
          inputTokens: result.usage?.inputTokens,
          outputTokens: result.usage?.outputTokens,
          estimatedCostUsd
        };

        if (this.options.onUsage) await this.options.onUsage(adapter.provider.id, usage);
        return { ...result, estimatedCostUsd, routing };
      } catch (error) {
        lastError = error;
        this.breaker.failure(adapter.provider.id);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("All AI providers failed");
  }

  health() {
    return this.breaker.all();
  }

  currentSpendUsd(): number {
    return this.spendUsd;
  }
}
