import type { AIProvider, GenerateRequest, GenerateResponse } from "@dating/contracts";
import type { ProviderAdapter, ProviderTelemetry } from "../types.js";

export interface OpenAICompatibleConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  capabilities: AIProvider["capabilities"];
  priority?: number;
}

export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly provider: AIProvider;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.provider = {
      id: config.id,
      name: config.name,
      models: [config.model],
      capabilities: config.capabilities,
      quota: {},
      enabled: Boolean(config.apiKey),
      priority: config.priority ?? 100
    };
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.config.apiKey) throw new Error(`${this.config.id}: API key not configured`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const started = performance.now();

    try {
      const body = {
        model: request.model ?? this.config.model,
        messages: [
          ...(request.system ? [{ role: "system", content: request.system }] : []),
          { role: "user", content: request.prompt }
        ],
        temperature: request.temperature,
        max_tokens: request.maxTokens
      };

      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(`${this.config.id}: HTTP ${response.status}`);
        Object.assign(error, { status: response.status, body: json });
        throw error;
      }

      const text = json?.choices?.[0]?.message?.content;
      if (typeof text !== "string") throw new Error(`${this.config.id}: invalid response`);

      const latencyMs = Math.round(performance.now() - started);
      return {
        providerId: this.provider.id,
        model: json.model ?? request.model ?? this.config.model,
        text,
        usage: {
          inputTokens: json?.usage?.prompt_tokens,
          outputTokens: json?.usage?.completion_tokens
        },
        latencyMs
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getTelemetry(): Promise<ProviderTelemetry> {
    return {
      providerId: this.provider.id,
      observedAt: new Date().toISOString(),
      requestsRemaining: this.provider.quota.requestsRemaining,
      tokensRemaining: this.provider.quota.tokensRemaining,
      resetAt: this.provider.quota.resetAt
    };
  }
}
