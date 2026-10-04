import Fastify from "fastify";
import { config } from "@dating/config";
import {
  AIGateway,
  InMemoryProviderRegistry,
  createConfiguredProviders
} from "@dating/ai-gateway";
import { log } from "@dating/observability";

const app = Fastify({ logger: false });
const registry = new InMemoryProviderRegistry();

for (const adapter of createConfiguredProviders({
  GEMINI_API_KEY: config.GEMINI_API_KEY,
  GROQ_API_KEY: config.GROQ_API_KEY,
  OPENROUTER_API_KEY: config.OPENROUTER_API_KEY,
  NVIDIA_API_KEY: config.NVIDIA_API_KEY,
  ALIBABA_API_KEY: config.ALIBABA_API_KEY,
  DEEPSEEK_API_KEY: config.DEEPSEEK_API_KEY,
  ZAI_API_KEY: config.ZAI_API_KEY
})) {
  registry.register(adapter);
}

const gateway = new AIGateway({
  registry,
  policy: {
    strategy: config.AI_ROUTING_STRATEGY,
    fallbackProviderIds: registry.list().map((p) => p.id),
    maxRetries: config.AI_MAX_RETRIES,
    requestTimeoutMs: config.AI_REQUEST_TIMEOUT_MS,
    circuitFailureThreshold: config.AI_CIRCUIT_FAILURE_THRESHOLD,
    circuitCooldownMs: config.AI_CIRCUIT_COOLDOWN_MS
  },
  monthlySpendCapUsd: config.AI_MONTHLY_SPEND_CAP_USD
});

app.get("/health", async () => ({
  ok: true,
  service: "dating-api",
  timestamp: new Date().toISOString()
}));

app.get("/api/v1/ai/providers", async () => ({
  providers: registry.list().map((p) => ({
    id: p.id,
    name: p.name,
    models: p.models,
    capabilities: p.capabilities,
    enabled: p.enabled,
    priority: p.priority,
    quota: p.quota
  })),
  health: gateway.health(),
  spendUsd: gateway.currentSpendUsd()
}));

app.post("/api/v1/ai/generate", async (request, reply) => {
  const body = request.body as {
    prompt?: string;
    system?: string;
    model?: string;
    capability?: "text" | "vision" | "reasoning" | "embeddings";
    maxTokens?: number;
    temperature?: number;
  };

  if (!body?.prompt) {
    return reply.status(400).send({ error: "prompt is required" });
  }

  const result = await gateway.generate({
    prompt: body.prompt,
    system: body.system,
    model: body.model,
    capability: body.capability,
    maxTokens: body.maxTokens,
    temperature: body.temperature
  });

  return result;
});

app.setErrorHandler((error, request, reply) => {
  log("error", error.message, { traceId: request.id });
  reply.status(500).send({ error: error.message, traceId: request.id });
});

app.listen({ port: config.API_PORT, host: "0.0.0.0" })
  .then(() => log("info", `API listening on ${config.API_PORT}`))
  .catch(() => process.exit(1));
