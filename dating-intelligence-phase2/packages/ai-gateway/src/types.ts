import type {
  AIProvider,
  GenerateRequest,
  GenerateResponse,
  ProviderCapabilities
} from "@dating/contracts";

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}

export interface ProviderHealth {
  consecutiveFailures: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  openedAt?: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  latencyMs?: number;
}

export interface ProviderTelemetry {
  providerId: string;
  model?: string;
  requestsRemaining?: number;
  tokensRemaining?: number;
  resetAt?: string;
  latencyMs?: number;
  errorRate?: number;
  observedAt: string;
}

export interface ProviderAdapter {
  provider: AIProvider;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  estimateCost?(request: GenerateRequest, response: GenerateResponse): number;
  getTelemetry?(): Promise<ProviderTelemetry>;
}

export interface ProviderRegistry {
  register(adapter: ProviderAdapter): void;
  list(): AIProvider[];
  adapters(): ProviderAdapter[];
  get(id: string): ProviderAdapter | undefined;
}

export type RoutingStrategy =
  | "ROUND_ROBIN"
  | "WEIGHTED_ROUND_ROBIN"
  | "LEAST_QUOTA_PRESSURE"
  | "LOWEST_LATENCY"
  | "CAPABILITY_FIRST";

export interface RouterPolicy {
  strategy: RoutingStrategy;
  fallbackProviderIds: string[];
  maxRetries: number;
  requiredCapability?: keyof ProviderCapabilities;
  requestTimeoutMs: number;
  circuitFailureThreshold: number;
  circuitCooldownMs: number;
}

export interface GatewayOptions {
  registry: ProviderRegistry;
  policy: RouterPolicy;
  monthlySpendCapUsd: number;
  initialSpendUsd?: number;
  onTelemetry?: (telemetry: ProviderTelemetry) => Promise<void>;
  onUsage?: (providerId: string, usage: ProviderUsage) => Promise<void>;
}

export interface RoutingDecision {
  providerId: string;
  strategy: RoutingStrategy;
  candidates: string[];
  attempt: number;
  reason: string;
}

export interface GatewayResult extends GenerateResponse {
  estimatedCostUsd: number;
  routing: RoutingDecision[];
}
