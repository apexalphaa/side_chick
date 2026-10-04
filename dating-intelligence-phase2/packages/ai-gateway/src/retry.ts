export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: number;
  shouldRetry?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 0; attempt < options.attempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const retryable = options.shouldRetry ? options.shouldRetry(error) : true;
      if (!retryable || attempt === options.attempts - 1) throw error;

      const exponential = Math.min(
        options.maxDelayMs,
        options.baseDelayMs * 2 ** attempt
      );
      const randomFactor = 1 + (Math.random() * 2 - 1) * options.jitter;
      await sleep(Math.max(0, Math.round(exponential * randomFactor)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Operation failed");
}
