import { createBuilderActionCreator } from '@src/output/builder-action.js';

interface Options {
  destination: string;
  contents: string;
  shouldNeverOverwrite?: boolean;
}

export const writeFormattedAction = createBuilderActionCreator<[Options]>(
  (options: Options) => (builder) => {
    const { destination, contents, shouldNeverOverwrite } = options;

    builder.writeFile({
      id: destination,
      filePath: destination,
      contents,
      options: {
        shouldFormat: true,
        shouldNeverOverwrite,
      },
    });
  },
);
