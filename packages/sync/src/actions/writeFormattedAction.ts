import { createBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  contents: string;
  neverOverwrite?: boolean;
}

export const writeFormattedAction = createBuilderActionCreator(
  (options: Options) => (builder) => {
    const { destination, contents, neverOverwrite } = options;

    builder.writeFile(destination, contents, {
      shouldFormat: true,
      neverOverwrite,
    });
  }
);
