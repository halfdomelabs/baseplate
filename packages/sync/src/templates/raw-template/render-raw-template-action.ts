import type { BuilderAction } from '#src/output/builder-action.js';
import type { WriteFileOptions } from '#src/output/generator-task-output.js';

import type { RawTemplateFile, RawTemplateFileMetadata } from './types.js';

import { readTemplateFileSourceBuffer } from '../utils/index.js';
import { RAW_TEMPLATE_TYPE } from './types.js';

interface RenderRawTemplateFileActionInput {
  template: RawTemplateFile;
  id?: string;
  destination: string;
  options?: Omit<WriteFileOptions, 'templateMetadata'>;
}

export function renderRawTemplateFileAction({
  template,
  id,
  destination,
  options,
}: RenderRawTemplateFileActionInput): BuilderAction {
  return {
    execute: async (builder) => {
      const source = await readTemplateFileSourceBuffer(
        builder.generatorInfo.baseDirectory,
        template.source,
      );
      const shouldWriteMetadata =
        builder.metadataOptions.includeTemplateMetadata &&
        builder.metadataOptions.shouldGenerateMetadata({
          fileId: id ?? template.name,
          filePath: destination,
          generatorName: builder.generatorInfo.name,
          hasManualId: !!id,
        });

      const templateMetadata: RawTemplateFileMetadata | undefined =
        'path' in template.source
          ? {
              template: template.source.path,
              generator: builder.generatorInfo.name,
              type: RAW_TEMPLATE_TYPE,
              name: template.name,
            }
          : undefined;

      builder.writeFile({
        id: id ?? template.name,
        destination,
        contents: source,
        options: {
          skipFormatting: true,
          ...options,
        },
        templateMetadata: shouldWriteMetadata ? templateMetadata : undefined,
      });
    },
  };
}
