import { createBuilderActionCreator } from '@halfdomelabs/sync';
import path from 'node:path';

import type { ImportMapper } from '../providers/index.js';
import type { ModuleResolutionKind, PathMapEntry } from '../writers/index.js';

import { copyTypescriptFileAction } from './copy-typescript-file-action.js';

export interface CopyTypescriptFilesOptions {
  sourceBaseDirectory?: string;
  destinationBaseDirectory?: string;
  paths: (
    | string
    | {
        path: string;
        replacements?: Record<string, string>;
        shouldNeverOverwrite?: boolean;
      }
  )[];
  importMappers?: ImportMapper[];
  pathMappings?: PathMapEntry[];
  moduleResolution: ModuleResolutionKind;
}

export const copyTypescriptFilesAction = createBuilderActionCreator(
  (options: CopyTypescriptFilesOptions) => {
    const {
      sourceBaseDirectory = '',
      destinationBaseDirectory = '',
      paths,
      ...rest
    } = options;

    const normalizedPaths = paths.map((p) =>
      typeof p === 'string' ? { path: p } : p,
    );

    const actions = normalizedPaths.map((p) =>
      copyTypescriptFileAction({
        source: path.join(sourceBaseDirectory, p.path),
        destination: path.join(destinationBaseDirectory, p.path),
        replacements: p.replacements,
        shouldNeverOverwrite: p.shouldNeverOverwrite,
        ...rest,
      }),
    );

    return async (builder) => {
      await Promise.all(actions.map((action) => builder.apply(action)));
    };
  },
);
