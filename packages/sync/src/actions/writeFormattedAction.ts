import { createBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  contents: string;
}

export const writeFormattedAction = createBuilderActionCreator(
  (options: Options) => (builder) => {
    const { destination, contents } = options;

    builder.writeFile(destination, contents, {
      shouldFormat: true,
    });
  }
);
