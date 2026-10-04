export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  traceId?: string;
  userId?: string;
  conversationId?: string;
  agentId?: string;
  providerId?: string;
}

export function log(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  }));
}

export function newTraceId(): string {
  return crypto.randomUUID();
}
