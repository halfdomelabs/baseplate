import path from 'path';
import { createBuilderActionCreator } from '@baseplate/sync';
import { ImportMapper } from '../providers';
import { PathMapEntry } from '../writers';
import { copyTypescriptFileAction } from './copyTypescriptFileAction';

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
