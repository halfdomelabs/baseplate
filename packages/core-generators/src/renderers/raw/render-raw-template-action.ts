import type { BuilderAction, WriteFileOptions } from '@baseplate-dev/sync';

import { readTemplateFileSourceBuffer } from '@baseplate-dev/sync';

import type {
  RawTemplateFile,
  RawTemplateOutputTemplateMetadata,
} from './types.js';

import { RAW_TEMPLATE_TYPE } from './types.js';

interface RenderRawTemplateFileActionInputBase<
  TemplateFile extends RawTemplateFile,
> {
  template: TemplateFile;
  destination: string;
  options?: Omit<WriteFileOptions, 'templateMetadata'>;
}

type RenderRawTemplateFileActionInput<TTemplateFile extends RawTemplateFile> =
  RenderRawTemplateFileActionInputBase<RawTemplateFile> &
    (TTemplateFile['fileOptions']['kind'] extends 'singleton'
      ? { id?: undefined }
      : { id: string });

export function renderRawTemplateFileAction<
  TTemplateFile extends RawTemplateFile,
>({
  template,
  id,
  destination,
  options,
}: RenderRawTemplateFileActionInput<TTemplateFile>): BuilderAction {
  return {
    execute: async (builder) => {
      const source = await readTemplateFileSourceBuffer(
        builder.generatorInfo.baseDirectory,
        template.source,
      );

      if (template.fileOptions.kind === 'instance' && !id) {
        throw new Error('Instance template must have an id');
      }

      const fileId = id ?? template.name;

      const shouldWriteMetadata =
        builder.metadataOptions.includeTemplateMetadata &&
        builder.metadataOptions.shouldGenerateMetadata({
          fileId,
          filePath: destination,
          generatorName: builder.generatorInfo.name,
          isInstance: template.fileOptions.kind === 'instance',
        });

      const templateMetadata: RawTemplateOutputTemplateMetadata | undefined =
        'path' in template.source
          ? {
              template: '', // deprecated
              generator: builder.generatorInfo.name,
              type: RAW_TEMPLATE_TYPE,
              name: template.name,
              fileOptions: template.fileOptions,
            }
          : undefined;

      builder.writeFile({
        id: fileId,
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
