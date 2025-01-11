import { access } from 'node:fs/promises';

export async function pathExists(filePath: string): Promise<boolean> {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}
