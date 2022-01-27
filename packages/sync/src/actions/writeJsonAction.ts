import { makeBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  contents: Record<string, unknown>;
  noFormat?: boolean;
}

export const writeJsonAction = makeBuilderActionCreator(
  (options: Options) => (builder) => {
    const { destination, contents, noFormat } = options;

    const jsonString = JSON.stringify(contents, null, 2);

    builder.writeFile(destination, jsonString, {
      shouldFormat: !noFormat,
    });
  }
);
