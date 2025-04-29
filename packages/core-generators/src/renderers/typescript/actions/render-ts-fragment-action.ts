import type { BuilderAction, WriteFileOptions } from '@halfdomelabs/sync';

import type { TsCodeFragment } from '../fragments/types.js';
import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';

import { renderTsCodeFileTemplate } from '../renderers/file.js';

export interface RenderTsFragmentActionInput {
  fragment: TsCodeFragment;
  id: string;
  destination: string;
  renderOptions?: RenderTsCodeFileTemplateOptions;
  writeOptions?: Omit<WriteFileOptions, 'templateMetadata'>;
}

export function renderTsFragmentAction({
  fragment,
  id,
  destination,
  writeOptions,
  renderOptions,
}: RenderTsFragmentActionInput): BuilderAction {
  return {
    execute: (builder) => {
      const renderedTemplate = renderTsCodeFileTemplate(
        'TPL_CONTENTS',
        { TPL_CONTENTS: fragment },
        {},
        {
          includeMetadata: false,
          ...renderOptions,
        },
      );

      builder.writeFile({
        id,
        destination,
        contents: renderedTemplate,
        options: writeOptions,
        generatorName: builder.generatorInfo.name,
      });
    },
  };
}
