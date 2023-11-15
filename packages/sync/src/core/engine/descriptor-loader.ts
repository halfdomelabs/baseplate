import { promises as fs } from 'fs';

import {
  baseDescriptorSchema,
  BaseGeneratorDescriptor,
} from '../descriptor.js';
import { getErrorMessage } from '@src/utils/errors.js';

export async function loadDescriptorFromFile(
  filePath: string,
): Promise<BaseGeneratorDescriptor> {
  try {
    const fileString = await fs.readFile(`${filePath}.json`, 'utf8');
    const data = JSON.parse(fileString) as BaseGeneratorDescriptor;

    if (!data) {
      throw new Error(`Descriptor in is invalid!`);
    }
    baseDescriptorSchema.parse(data);
    return data;
  } catch (err) {
    throw new Error(
      `Unable to load descriptor file: ${filePath} (${getErrorMessage(err)})`,
    );
  }
}
