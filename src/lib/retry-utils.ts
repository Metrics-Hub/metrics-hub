interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain error types
      if (isNonRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < config.maxAttempts) {
        console.warn(
          `Attempt ${attempt}/${config.maxAttempts} failed, retrying in ${delay}ms...`,
          lastError.message
        );
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw lastError;
}

function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  // Don't retry auth errors or validation errors
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('not found')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
