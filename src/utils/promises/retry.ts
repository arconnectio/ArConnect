/**
 * Retries a given function up to a maximum number of attempts.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param delay - The delay between attempts in milliseconds.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let attempts = 0;

  const attempt = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      attempts += 1;
      if (attempts < maxAttempts) {
        // console.log(`Attempt ${attempts} failed, retrying...`)
        return new Promise<T>((resolve) =>
          setTimeout(() => resolve(attempt()), delay)
        );
      } else {
        throw error;
      }
    }
  };

  return attempt();
}

/**
 * Generic retry function for any async operation.
 * @param fn - The async function to be retried.
 * @param maxRetries - Maximum retry attempts.
 * @param retryDelay - Delay between retries in milliseconds.
 * @returns A promise of the type that the async function returns.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<T> {
  let lastError: any;

  // TODO: Replace with sleep
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * retryDelay;
        console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        console.error(
          `All ${maxRetries} attempts failed. Last error:`,
          lastError
        );
      }
    }
  }

  throw lastError;
}
