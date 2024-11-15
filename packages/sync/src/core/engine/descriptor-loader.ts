import { promises as fs } from 'node:fs';

import { getErrorMessage } from '@src/utils/errors.js';

import type { BaseGeneratorDescriptor } from '../descriptor.js';

import { baseDescriptorSchema } from '../descriptor.js';

export async function loadDescriptorFromFile(
  filePath: string,
): Promise<BaseGeneratorDescriptor> {
  try {
    const fileString = await fs.readFile(`${filePath}.json`, 'utf8');
    const data = JSON.parse(fileString) as BaseGeneratorDescriptor;

    baseDescriptorSchema.parse(data);
    return data;
  } catch (error) {
    throw new Error(
      `Unable to load descriptor file: ${filePath} (${getErrorMessage(error)})`,
    );
  }
}
