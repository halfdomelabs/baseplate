import { createBuilderActionCreator } from '../core/index.js';

interface Options {
  destination: string;
  contents: string;
  neverOverwrite?: boolean;
}

export const writeFormattedAction = createBuilderActionCreator<[Options]>(
  (options: Options) => (builder) => {
    const { destination, contents, neverOverwrite } = options;

    builder.writeFile(destination, contents, {
      shouldFormat: true,
      neverOverwrite,
    });
  }
);
