import type {
  AIProvider,
  GenerateRequest,
  GenerateResponse,
  ProviderCapabilities
} from "@dating/contracts";

export type RoutingStrategy =
  | "ROUND_ROBIN"
  | "WEIGHTED_ROUND_ROBIN"
  | "LEAST_QUOTA_PRESSURE"
  | "LOWEST_LATENCY"
  | "CAPABILITY_FIRST";

export interface ProviderAdapter {
  provider: AIProvider;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}

export interface ProviderRegistry {
  register(adapter: ProviderAdapter): void;
  list(): AIProvider[];
  get(id: string): ProviderAdapter | undefined;
}

export interface RouterPolicy {
  strategy: RoutingStrategy;
  fallbackProviderIds: string[];
  maxRetries: number;
  requiredCapability?: keyof ProviderCapabilities;
}

export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.provider.id, adapter);
  }

  list(): AIProvider[] {
    return [...this.adapters.values()].map((a) => a.provider);
  }

  get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }
}

export class AIRouter {
  private cursor = 0;

  constructor(
    private readonly registry: ProviderRegistry,
    private readonly policy: RouterPolicy
  ) {}

  private candidates(request: GenerateRequest): ProviderAdapter[] {
    return this.registry.list()
      .filter((p) => p.enabled)
      .filter((p) => !this.policy.requiredCapability || Boolean(p.capabilities[this.policy.requiredCapability]))
      .filter((p) => !request.capability || Boolean(p.capabilities[request.capability]))
      .sort((a, b) => a.priority - b.priority)
      .map((p) => this.registry.get(p.id)!)
      .filter(Boolean);
  }

  private choose(candidates: ProviderAdapter[]): ProviderAdapter {
    if (!candidates.length) throw new Error("No enabled provider matches request");

    switch (this.policy.strategy) {
      case "LOWEST_LATENCY":
        // Latency telemetry will be persisted in Phase 2; priority is the Phase 1 fallback.
        return candidates[0]!;
      case "LEAST_QUOTA_PRESSURE":
        // Quota-aware selection will consume live telemetry in Phase 2.
        return [...candidates].sort(
          (a, b) => (a.provider.quota.requestsRemaining ?? Number.MAX_SAFE_INTEGER)
            - (b.provider.quota.requestsRemaining ?? Number.MAX_SAFE_INTEGER)
        )[0]!;
      case "WEIGHTED_ROUND_ROBIN":
      case "ROUND_ROBIN":
      case "CAPABILITY_FIRST":
      default:
        const selected = candidates[this.cursor % candidates.length]!;
        this.cursor = (this.cursor + 1) % candidates.length;
        return selected;
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const candidates = this.candidates(request);
    const attempts = Math.min(this.policy.maxRetries + 1, candidates.length);

    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      const adapter = this.choose(candidates);
      try {
        return await adapter.generate(request);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("All providers failed");
  }
}
