/**
 * Logs text to console unless NODE_ENV = TEST
 *
 * @param text Text to log
 */
export function logToConsole(text: string): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  console.log(text);
}
