import { createBuilderActionCreator } from '@src/output/builder-action.js';

export interface WriteFormattedActionOptions {
  id?: string;
  destination: string;
  contents: string;
  shouldNeverOverwrite?: boolean;
}

export const writeFormattedAction = createBuilderActionCreator<
  [WriteFormattedActionOptions]
>((options: WriteFormattedActionOptions) => (builder) => {
  const { id, destination, contents, shouldNeverOverwrite } = options;

  builder.writeFile({
    id: id ?? destination,
    destination: destination,
    contents,
    options: {
      shouldFormat: true,
      shouldNeverOverwrite,
    },
  });
});
