import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import { createActionCreator } from '../core/action';

interface Options {
  destination: string;
  template: string;
  data: Record<string, any>;
}

export const writeTemplateAction = createActionCreator<Options>(
  'write-file',
  async (options, context) => {
    const { currentDirectory, generatorDirectory } = context;
    const { destination, template, data } = options;

    const templatePath = path.join(generatorDirectory, 'templates', template);

    const templateContents = await fs.readFile(templatePath, 'utf8');

    const contents = ejs.render(templateContents, data);

    await fs.writeFile(path.join(currentDirectory, destination), contents, {
      encoding: 'utf-8',
    });
  }
);
