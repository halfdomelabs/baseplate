import path from 'path';
import ejs from 'ejs';
import fs from 'fs-extra';
import { createBuilderActionCreator } from '../core';

interface Options {
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
      template
    );

    const templateContents = await fs.readFile(templatePath, 'utf8');

    const contents = ejs.render(templateContents, data);

    builder.writeFile(destination, contents, { shouldFormat: !noFormat });
  }
);
