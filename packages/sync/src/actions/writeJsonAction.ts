import { createBuilderActionCreator } from '../core';

interface Options {
  destination: string;
  contents: Record<string, unknown>;
  noFormat?: boolean;
}

export const writeJsonAction = createBuilderActionCreator<[Options]>(
  (options: Options) => (builder) => {
    const { destination, contents, noFormat } = options;

    const jsonString = `${JSON.stringify(contents, null, 2)}\n`;

    builder.writeFile(destination, jsonString, {
      shouldFormat: !noFormat,
    });
  }
);
