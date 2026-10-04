import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WEB_PORT: z.coerce.number().default(3000),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  MAX_AUTONOMOUS_INITIATIONS_PER_DAY: z.coerce.number().int().min(0).default(10),
  MAX_DELEGATED_MESSAGES_PER_CONVERSATION: z.coerce.number().int().min(0).default(10),
  DEFAULT_DELEGATION_MINUTES: z.coerce.number().int().min(1).default(60),
  AI_MONTHLY_SPEND_CAP_USD: z.coerce.number().min(0).default(0)
});

export const config = schema.parse(process.env);
