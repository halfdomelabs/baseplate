import { makeBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  contents: string;
}

export const writeFormattedAction = makeBuilderActionCreator(
  (options: Options) => (builder) => {
    const { destination, contents } = options;

    builder.writeFile(destination, contents, {
      shouldFormat: true,
    });
  }
);
