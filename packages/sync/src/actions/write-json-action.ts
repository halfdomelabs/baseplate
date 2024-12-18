import { createBuilderActionCreator } from '../core/index.js';

interface Options {
  destination: string;
  contents: unknown;
  noFormat?: boolean;
}

export const writeJsonAction = createBuilderActionCreator<[Options]>(
  (options: Options) => (builder) => {
    const { destination, contents, noFormat } = options;

    const jsonString = `${JSON.stringify(contents, null, 2)}\n`;

    builder.writeFile(destination, jsonString, {
      shouldFormat: !noFormat,
    });
  },
);
