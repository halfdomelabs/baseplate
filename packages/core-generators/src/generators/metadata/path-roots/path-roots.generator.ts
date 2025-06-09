import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { stringifyPrettyCompact } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { TemplatePathRoot } from '#src/renderers/templates/plugins/template-paths/template-paths.plugin.js';

import { projectScope } from '#src/providers/scopes.js';
import { TEMPLATE_PATHS_METADATA_FILE } from '#src/renderers/templates/plugins/template-paths/template-paths.plugin.js';

const descriptorSchema = z.object({});

export interface PathRootsProvider {
  /**
   * Register a path root that will be written to the paths-root metadata if template metadata is enabled.
   *
   * @param pathRootName - The name of the path root e.g. `feature-root`.
   * @param outputRelativePath - The relative path to the output directory e.g. `@/src/features/feature-root`.
   */
  registerPathRoot(pathRootName: string, outputRelativePath: string): void;
}

export const pathRootsProvider =
  createProviderType<PathRootsProvider>('path-roots');

/**
 * Metadata generator for path roots that writes the metadata
 * for path roots to the base of the project.
 */
export const pathRootsGenerator = createGenerator({
  name: 'metadata/path-roots',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      exports: {
        pathRoots: pathRootsProvider.export(projectScope),
      },
      dependencies: {},
      run() {
        const pathRoots: TemplatePathRoot[] = [];
        return {
          providers: {
            pathRoots: {
              registerPathRoot(pathRootName, outputRelativePath) {
                if (
                  pathRoots.some((p) => p.canonicalPath === outputRelativePath)
                ) {
                  throw new Error(
                    `Path root ${outputRelativePath} already registered`,
                  );
                }
                pathRoots.push({
                  canonicalPath: outputRelativePath,
                  pathRootName,
                });
              },
            },
          },
          build: (builder) => {
            if (!builder.metadataOptions.includeTemplateMetadata) return;
            if (Object.keys(pathRoots).length === 0) return;

            builder.writeFile({
              id: 'path-roots',
              destination: TEMPLATE_PATHS_METADATA_FILE,
              contents: stringifyPrettyCompact(pathRoots),
            });
          },
        };
      },
    }),
  }),
});
