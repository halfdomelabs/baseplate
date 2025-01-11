import { readdir } from 'node:fs/promises';
import path from 'node:path';

import type { TypescriptMorpher } from './types.js';

export async function loadMorphers(): Promise<TypescriptMorpher[]> {
  const morphersPath = path.resolve(
    path.join(import.meta.dirname, './morphers'),
  );
  const files = await readdir(morphersPath);

  const morphers = await Promise.all(
    files
      .filter((file) => file.endsWith('.morpher.ts'))
      .map(async (file) => {
        const module = (await import(path.join(morphersPath, file))) as {
          default: TypescriptMorpher;
        };
        const morpher = module.default;
        if (!morpher.name) {
          throw new Error(`Morpher ${file} has no name`);
        }

        return morpher;
      }),
  );

  if (morphers.length === 0) {
    throw new Error(`No morphers found in ${morphersPath}`);
  }

  return morphers;
}
