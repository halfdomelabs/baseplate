import ejs from 'ejs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createBuilderActionCreator } from '@src/output/builder-action.js';

interface Options {
  id?: string;
  destination: string;
  template: string;
  data: Record<string, unknown>;
  noFormat?: boolean;
}

export const writeTemplateAction = createBuilderActionCreator<[Options]>(
  (options: Options) => async (builder) => {
    const { destination, template, data, noFormat } = options;

    const templatePath = path.join(
      builder.generatorBaseDirectory,
      'templates',
      template,
    );

    const templateContents = await fs.readFile(templatePath, 'utf8');

    const contents = ejs.render(templateContents, data);

    builder.writeFile({
      id: options.id ?? destination,
      filePath: destination,
      contents,
      options: {
        shouldFormat: !noFormat,
      },
    });
  },
);
