import {
  normalizeModuleSpecifier,
  packageScope,
  pathRootsProvider,
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { compareStrings } from '@baseplate-dev/utils';
import { z } from 'zod';

import { reactPathsProvider } from '#src/providers/react-paths.js';

import { reactComponentsImportsProvider } from '../react-components/generated/ts-import-providers.js';

const descriptorSchema = z.object({});

const BARREL_DESTINATION = 'src/index.ts';

/**
 * Generator that turns a `react-library` package into the home of the shared
 * `react-components` template set (Button, Dialog, Toaster, form controllers, etc.).
 *
 * It supplies the components path root that `core/react-components` renders against in
 * `library` mode, and re-exports every symbol from `src/index.ts` so the package can be
 * imported by name from a consuming app.
 *
 * Composed by the library compiler alongside `coreReactComponentsGenerator({ mode: 'library' })`
 * when a web app opts in to sourcing its shared components from this library
 * (`componentsLibraryRef`).
 */
export const reactComponentsLibraryGenerator = createGenerator({
  name: 'core/react-components-library',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    reactPaths: createGeneratorTask({
      dependencies: {
        pathRoots: pathRootsProvider,
      },
      exports: {
        reactPaths: reactPathsProvider.export(packageScope),
      },
      run({ pathRoots }) {
        // Mirrors `core/react` in an app so the component templates keep resolving against
        // `{components-root}` when they are extracted from the library instead of an app.
        pathRoots.registerPathRoot('components-root', '@/src/components');

        return {
          providers: {
            reactPaths: {
              getComponentsFolder: () => `@/src/components`,
            },
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ reactComponentsImports, typescriptFile }) {
        return {
          build: async (builder) => {
            const symbolsByModule = new Map<
              string,
              { name: string; isTypeOnly: boolean }[]
            >();
            const entries = Object.values(reactComponentsImports) as {
              name: string;
              moduleSpecifier: string;
              isTypeOnly?: boolean;
            }[];
            for (const entry of entries) {
              const relativeSpecifier = normalizeModuleSpecifier(
                entry.moduleSpecifier,
                'src',
                { moduleResolution: 'node16', pathMapEntries: [] },
              );
              const symbols = symbolsByModule.get(relativeSpecifier) ?? [];
              symbols.push({
                name: entry.name,
                isTypeOnly: entry.isTypeOnly ?? false,
              });
              symbolsByModule.set(relativeSpecifier, symbols);
            }

            // Emitted as single-line statements; Prettier reformats the
            // rendered file, breaking any that exceed the print width.
            const barrelContents = [...symbolsByModule.entries()]
              .toSorted(([a], [b]) => compareStrings(a, b))
              .flatMap(([moduleSpecifier, symbols]) => {
                const renderExport = (
                  names: string[],
                  keyword: 'export' | 'export type',
                ): string[] =>
                  names.length > 0
                    ? [
                        `${keyword} { ${names.join(', ')} } from '${moduleSpecifier}';`,
                      ]
                    : [];
                return [
                  ...renderExport(
                    symbols.filter((s) => !s.isTypeOnly).map((s) => s.name),
                    'export',
                  ),
                  ...renderExport(
                    symbols.filter((s) => s.isTypeOnly).map((s) => s.name),
                    'export type',
                  ),
                ];
              })
              .join('\n');

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: 'react-components-library-index-file',
                destination: BARREL_DESTINATION,
                fragment: tsCodeFragment(`${barrelContents}\n`),
              }),
            );
          },
        };
      },
    }),
  }),
});
