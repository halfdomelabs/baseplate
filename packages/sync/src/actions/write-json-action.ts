import { createBuilderActionCreator } from '@src/output/builder-action.js';

interface Options {
  destination: string;
  contents: unknown;
  noFormat?: boolean;
}

export const writeJsonAction = createBuilderActionCreator<[Options]>(
  (options: Options) => (builder) => {
    const { destination, contents, noFormat } = options;

    const jsonString = `${JSON.stringify(contents, null, 2)}\n`;

    builder.writeFile({
      id: destination,
      filePath: destination,
      contents: jsonString,
      options: {
        shouldFormat: !noFormat,
      },
    });
  },
);
