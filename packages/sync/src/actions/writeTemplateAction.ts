import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  template: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  noFormat?: boolean;
}

export const writeTemplateAction = createActionCreator<Options>(
  'write-template',
  async (options, context) => {
    const { currentDirectory, generatorDirectory, formatter } = context;
    const { destination, template, data, noFormat } = options;

    const templatePath = path.join(generatorDirectory, 'templates', template);

    const templateContents = await fs.readFile(templatePath, 'utf8');

    let contents = ejs.render(templateContents, data);

    const fullPath = path.join(currentDirectory, destination);
    if (formatter && !noFormat) {
      contents = await formatter.format(contents, fullPath);
    }
    const destinationPath = path.join(currentDirectory, destination);

    await fs.ensureDir(path.dirname(destinationPath));

    await fs.writeFile(destinationPath, contents, {
      encoding: 'utf-8',
    });
  }
);
