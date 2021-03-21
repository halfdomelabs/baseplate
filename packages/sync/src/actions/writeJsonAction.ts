import fs from 'fs-extra';
import path from 'path';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: Record<string, unknown>;
  noFormat?: boolean;
}

export const writeJsonAction = createActionCreator<Options>(
  'write-json',
  async (options, context) => {
    const { currentDirectory, formatter } = context;
    const { destination, contents, noFormat } = options;
    let text = JSON.stringify(contents, null, 2);

    const fullPath = path.join(currentDirectory, destination);
    if (formatter && !noFormat) {
      text = await formatter.format(text, fullPath);
    }
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, text, {
      encoding: 'utf-8',
    });
  }
);
