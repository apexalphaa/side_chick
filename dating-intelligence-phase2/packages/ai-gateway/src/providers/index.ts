import { GeminiAdapter } from "./gemini.js";
import { OpenAICompatibleAdapter } from "./openai-compatible.js";
import type { ProviderAdapter } from "../types.js";

export interface ProviderEnv {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  ALIBABA_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  ZAI_API_KEY?: string;
}

export function createConfiguredProviders(env: ProviderEnv): ProviderAdapter[] {
  const providers: ProviderAdapter[] = [];

  providers.push(new GeminiAdapter(env.GEMINI_API_KEY ?? ""));

  providers.push(new OpenAICompatibleAdapter({
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: env.GROQ_API_KEY ?? "",
    model: "llama-3.3-70b-versatile",
    capabilities: { text: true, vision: true, reasoning: false, embeddings: false },
    priority: 20
  }));

  providers.push(new OpenAICompatibleAdapter({
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY ?? "",
    model: "openrouter/free",
    capabilities: { text: true, vision: true, reasoning: true, embeddings: false },
    priority: 30
  }));

  providers.push(new OpenAICompatibleAdapter({
    id: "nvidia",
    name: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: env.NVIDIA_API_KEY ?? "",
    model: "meta/llama-3.1-70b-instruct",
    capabilities: { text: true, vision: false, reasoning: false, embeddings: false },
    priority: 40
  }));

  providers.push(new OpenAICompatibleAdapter({
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY ?? "",
    model: "deepseek-chat",
    capabilities: { text: true, vision: false, reasoning: true, embeddings: false },
    priority: 50
  }));

  providers.push(new OpenAICompatibleAdapter({
    id: "zai",
    name: "Z.AI",
    baseUrl: "https://api.z.ai/api/paas/v4",
    apiKey: env.ZAI_API_KEY ?? "",
    model: "glm-4.5",
    capabilities: { text: true, vision: true, reasoning: true, embeddings: false },
    priority: 60
  }));

  providers.push(new OpenAICompatibleAdapter({
    id: "alibaba",
    name: "Alibaba Cloud Model Studio",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: env.ALIBABA_API_KEY ?? "",
    model: "qwen-plus",
    capabilities: { text: true, vision: true, reasoning: true, embeddings: false },
    priority: 70
  }));

  return providers;
}
