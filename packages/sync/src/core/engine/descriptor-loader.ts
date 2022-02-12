import { promises as fs } from 'fs';
import * as yup from 'yup';
import { getErrorMessage } from '@src/utils/errors';
import { BaseGeneratorDescriptor, baseDescriptorSchema } from '../descriptor';

export async function loadDescriptorFromFile(
  filePath: string
): Promise<BaseGeneratorDescriptor> {
  try {
    const fileString = await fs.readFile(`${filePath}.json`, 'utf8');
    const data = JSON.parse(fileString) as BaseGeneratorDescriptor;

    if (!data) {
      throw new Error(`Descriptor in is invalid!`);
    }
    yup.object(baseDescriptorSchema).validateSync(data);
    return data;
  } catch (err) {
    throw new Error(
      `Unable to load descriptor file: ${filePath} (${getErrorMessage(err)})`
    );
  }
}
