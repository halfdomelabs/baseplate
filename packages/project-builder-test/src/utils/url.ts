/**
 * Checks if a URL is healthy by polling it until a successful response is received or a timeout occurs.
 * @param url The URL to check.
 * @param timeout Timeout in milliseconds after which the checking should stop if not successful.
 * @returns Promise that resolves when the URL is healthy within the timeout, otherwise throws.
 */
export async function waitForHealthyUrl(
  url: string,
  timeout: number,
): Promise<boolean> {
  const interval = 200; // Interval between checks in milliseconds

  return new Promise((resolve, reject) => {
    // Poll the URL at the specified interval
    const intervalId = setInterval((): void => {
      fetch(url)
        .then((response) => {
          if (response.ok) {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            resolve(true);
          }
        })
        .catch(() => {
          /* ignore error */
        });
    }, interval);

    // Set a timeout to stop polling and resolve the promise with false if not healthy
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error(`Timed out waiting for URL to be healthy: ${url}`));
    }, timeout);
  });
}
