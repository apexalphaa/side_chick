import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WEB_PORT: z.coerce.number().default(3000),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),

  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  ALIBABA_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  ZAI_API_KEY: z.string().optional(),

  AI_ROUTING_STRATEGY: z.enum([
    "ROUND_ROBIN",
    "WEIGHTED_ROUND_ROBIN",
    "LEAST_QUOTA_PRESSURE",
    "LOWEST_LATENCY",
    "CAPABILITY_FIRST"
  ]).default("ROUND_ROBIN"),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  AI_CIRCUIT_FAILURE_THRESHOLD: z.coerce.number().int().min(1).default(3),
  AI_CIRCUIT_COOLDOWN_MS: z.coerce.number().int().min(1000).default(30000),
  AI_MONTHLY_SPEND_CAP_USD: z.coerce.number().min(0).default(0)
});

export const config = schema.parse(process.env);
