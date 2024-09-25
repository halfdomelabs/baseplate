import { createBuilderActionCreator } from '@halfdomelabs/sync';
import path from 'path';

import { copyTypescriptFileAction } from './copyTypescriptFileAction.js';
import { ImportMapper } from '../providers/index.js';
import { ModuleResolutionMethod, PathMapEntry } from '../writers/index.js';

export interface CopyTypescriptFilesOptions {
  sourceBaseDirectory?: string;
  destinationBaseDirectory?: string;
  paths: (
    | string
    | {
        path: string;
        replacements?: Record<string, string>;
        neverOverwrite?: boolean;
      }
  )[];
  importMappers?: ImportMapper[];
  pathMappings?: PathMapEntry[];
  resolutionMethod: ModuleResolutionMethod;
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
        neverOverwrite: p.neverOverwrite,
        ...rest,
      }),
    );

    return async (builder) => {
      await Promise.all(actions.map((action) => builder.apply(action)));
    };
  },
);
