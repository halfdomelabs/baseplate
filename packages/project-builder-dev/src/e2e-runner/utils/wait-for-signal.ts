export async function waitForSignal(): Promise<void> {
  return new Promise<void>((resolve) => {
    const resolvePromise = (): void => {
      resolve();
    };
    process.once('SIGINT', resolvePromise);
    process.once('SIGTERM', resolvePromise);
  });
}
