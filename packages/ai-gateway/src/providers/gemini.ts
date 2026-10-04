import type { AIProvider, GenerateRequest, GenerateResponse } from "@dating/contracts";
import type { ProviderAdapter } from "../types.js";

export class GeminiAdapter implements ProviderAdapter {
  readonly provider: AIProvider;

  constructor(
    private readonly apiKey: string,
    private readonly model = "gemini-2.5-flash"
  ) {
    this.provider = {
      id: "gemini",
      name: "Google Gemini",
      models: [model],
      capabilities: { text: true, vision: true, reasoning: true, embeddings: false },
      quota: {},
      enabled: Boolean(apiKey),
      priority: 10
    };
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.apiKey) throw new Error("gemini: API key not configured");

    const model = request.model ?? this.model;
    const started = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: request.system ? { parts: [{ text: request.system }] } : undefined,
            contents: [{ role: "user", parts: [{ text: request.prompt }] }],
            generationConfig: {
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens
            }
          }),
          signal: controller.signal
        }
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`gemini: HTTP ${response.status}`);

      const text = json?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";

      if (!text) throw new Error("gemini: empty response");

      return {
        providerId: this.provider.id,
        model,
        text,
        usage: {
          inputTokens: json?.usageMetadata?.promptTokenCount,
          outputTokens: json?.usageMetadata?.candidatesTokenCount
        },
        latencyMs: Math.round(performance.now() - started)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
