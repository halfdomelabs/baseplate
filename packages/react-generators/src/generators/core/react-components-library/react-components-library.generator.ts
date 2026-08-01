import {
  createNodePackagesTask,
  extractPackageVersions,
  normalizeModuleSpecifier,
  packageScope,
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { reactPathsProvider } from '#src/providers/react-paths.js';

import { CORE_REACT_COMPONENTS_GENERATED } from '../react-components/generated/index.js';
import { reactComponentsImportsProvider } from '../react-components/generated/ts-import-providers.js';

const descriptorSchema = z.object({});

const BARREL_DESTINATION = 'src/index.ts';

const PRINT_WIDTH = 80;

/**
 * Renders a single `export { ... } from '...';` statement, matching
 * Prettier's bracket-expansion rule (one symbol per line, trailing comma)
 * once the single-line form would exceed the print width — so the generated
 * barrel round-trips through `prettier:write` without reformatting.
 */
function renderExportStatement(
  names: string[],
  moduleSpecifier: string,
  { isTypeOnly }: { isTypeOnly: boolean },
): string {
  const keyword = isTypeOnly ? 'export type' : 'export';
  const singleLine = `${keyword} { ${names.join(', ')} } from '${moduleSpecifier}';`;
  // Prettier never breaks braces around a single specifier — doing so
  // wouldn't shorten the line since the module path dominates its length.
  if (names.length === 1 || singleLine.length <= PRINT_WIDTH) {
    return singleLine;
  }
  const indentedNames = names.map((name) => `  ${name},`).join('\n');
  return `${keyword} {\n${indentedNames}\n} from '${moduleSpecifier}';`;
}

/**
 * Generator that renders the `react-components` template set (Button, Dialog,
 * Toaster, form controllers, etc.) into a `react-library` package instead of
 * an app, and re-exports every symbol from `src/index.ts` so the package can
 * be imported by name from a consuming app.
 *
 * Composed by the library compiler when a web app opts in to sourcing its
 * shared components from this library (`componentsLibraryRef`).
 */
export const reactComponentsLibraryGenerator = createGenerator({
  name: 'core/react-components-library',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@hookform/resolvers',
        '@base-ui/react',
        'clsx',
        'react-hook-form',
        'react-icons',
        'zustand',
        'class-variance-authority',
        'sonner',
        'react-day-picker',
        'date-fns',
        'tailwind-merge',
      ]),
      // `not-found-card.tsx` uses router hooks/components — a peer since a
      // second copy of the router in the tree would break navigation context
      peer: extractPackageVersions(REACT_PACKAGES, ['@tanstack/react-router']),
      dev: extractPackageVersions(REACT_PACKAGES, ['@tanstack/react-router']),
    }),
    reactPaths: createGeneratorTask({
      exports: {
        reactPaths: reactPathsProvider.export(packageScope),
      },
      run() {
        return {
          providers: {
            reactPaths: {
              getComponentsFolder: () => `@/src/components`,
            },
          },
        };
      },
    }),
    paths: CORE_REACT_COMPONENTS_GENERATED.paths.task,
    imports: CORE_REACT_COMPONENTS_GENERATED.imports.task,
    renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.provider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ renderers, reactComponentsImports, typescriptFile }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.componentsGroup.render({}),
              renderers.hooksGroup.render({}),
              renderers.stylesGroup.render({}),
              renderers.utilsGroup.render({}),
            );

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

            const barrelContents = [...symbolsByModule.entries()]
              .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([moduleSpecifier, symbols]) => {
                const typeExports = symbols.filter((s) => s.isTypeOnly);
                const valueExports = symbols.filter((s) => !s.isTypeOnly);
                const lines: string[] = [];
                if (valueExports.length > 0) {
                  lines.push(
                    renderExportStatement(
                      valueExports.map((s) => s.name),
                      moduleSpecifier,
                      { isTypeOnly: false },
                    ),
                  );
                }
                if (typeExports.length > 0) {
                  lines.push(
                    renderExportStatement(
                      typeExports.map((s) => s.name),
                      moduleSpecifier,
                      { isTypeOnly: true },
                    ),
                  );
                }
                return lines.join('\n');
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
