import type { GeneratorOutputMetadata } from '@halfdomelabs/sync';

import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeGeneratorSteps(
  metadata: GeneratorOutputMetadata,
  outputDirectory: string,
): Promise<void> {
  await fs.writeFile(
    path.join(outputDirectory, 'baseplate/build/generator-steps.json'),
    JSON.stringify(metadata, null, 2),
  );
}
