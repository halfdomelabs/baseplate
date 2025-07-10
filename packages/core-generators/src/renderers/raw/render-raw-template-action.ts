import type { BuilderAction, WriteFileOptions } from '@baseplate-dev/sync';

import { readTemplateFileSourceBuffer } from '@baseplate-dev/sync';

import type { RawTemplateFile } from './types.js';

interface RenderRawTemplateFileActionInputBase<
  TemplateFile extends RawTemplateFile,
> {
  template: TemplateFile;
  destination: string;
  options?: Omit<WriteFileOptions, 'templateInfo'>;
}

export type RenderRawTemplateFileActionInput<
  TTemplateFile extends RawTemplateFile,
> = RenderRawTemplateFileActionInputBase<TTemplateFile> &
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
      const source = await readTemplateFileSourceBuffer(template.source);

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

      builder.writeFile({
        id: fileId,
        destination,
        contents: source,
        options: {
          skipFormatting: true,
          ...options,
        },
        templateInfo: {
          template: template.name,
          generator: builder.generatorInfo.name,
          instanceData: shouldWriteMetadata ? {} : undefined,
        },
      });
    },
  };
}
