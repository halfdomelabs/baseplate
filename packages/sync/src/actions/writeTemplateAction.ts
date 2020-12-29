import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  template: string;
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

    if (formatter && !noFormat) {
      const extension = path.extname(destination);
      contents = await formatter.format(contents, extension);
    }

    await fs.writeFile(path.join(currentDirectory, destination), contents, {
      encoding: 'utf-8',
    });
  }
);
