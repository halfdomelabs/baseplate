import crypto from 'node:crypto';

/**
 * Generates a deterministic ID for a project based on its directory path.
 * @param directory - The absolute directory path of the project.
 * @returns A deterministic project ID.
 */
export function generateProjectId(directory: string): string {
  return crypto
    .createHash('shake256', { outputLength: 9 })
    .update(directory)
    .digest('base64')
    .replaceAll('/', '-')
    .replaceAll('+', '_');
}
