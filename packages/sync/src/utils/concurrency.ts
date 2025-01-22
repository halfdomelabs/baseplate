import os from 'node:os';

/**
 * Get the concurrency limit for generation
 *
 * @returns The concurrency limit
 */
export function getGenerationConcurrencyLimit(): number {
  const cpus = os.cpus().length;
  return Math.max(cpus * 2, 10);
}
