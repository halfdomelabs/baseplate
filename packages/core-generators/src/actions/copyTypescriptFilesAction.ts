import path from 'path';
import { createBuilderActionCreator } from '@halfdomelabs/sync';
import { ImportMapper } from '../providers/index.js';
import { PathMapEntry } from '../writers/index.js';
import { copyTypescriptFileAction } from './copyTypescriptFileAction.js';

export interface CopyTypescriptFilesOptions {
  sourceBaseDirectory?: string;
  destinationBaseDirectory?: string;
  paths: (
    | string
    | {
        path: string;
        replacements?: { [key: string]: string };
        neverOverwrite?: boolean;
      }
  )[];
  importMappers?: ImportMapper[];
  pathMappings?: PathMapEntry[];
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
      typeof p === 'string' ? { path: p } : p
    );

    const actions = normalizedPaths.map((p) =>
      copyTypescriptFileAction({
        source: path.join(sourceBaseDirectory, p.path),
        destination: path.join(destinationBaseDirectory, p.path),
        replacements: p.replacements,
        neverOverwrite: p.neverOverwrite,
        ...rest,
      })
    );

    return async (builder) => {
      await Promise.all(actions.map((action) => builder.apply(action)));
    };
  }
);
