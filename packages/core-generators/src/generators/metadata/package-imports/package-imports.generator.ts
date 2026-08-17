import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { stringifyPrettyCompact } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { DeclaredPackageImport } from '#src/renderers/typescript/extractor/build-declared-package-imports-map.js';

import { packageScope } from '#src/providers/scopes.js';
import { PACKAGE_IMPORTS_METADATA_FILE } from '#src/renderers/typescript/extractor/build-declared-package-imports-map.js';

const descriptorSchema = z.object({});

export interface PackageImportsProvider {
  /**
   * Register a module specifier that resolves to another package in the project rather than to
   * a file in this one, so template extraction can map it back to the owning import provider
   * instead of baking the project-specific package name into a shared template.
   *
   * @param declaredImport - The literal module specifier and the generator that owns the
   * import provider backing it, e.g. `@baseplate-dev/react-generators#core/react-components`.
   */
  registerPackageImportProvider(declaredImport: DeclaredPackageImport): void;
}

export const packageImportsProvider =
  createProviderType<PackageImportsProvider>('package-imports');

/**
 * Metadata generator for cross-package imports that writes the metadata for declared
 * package imports to the base of the package.
 */
export const packageImportsGenerator = createGenerator({
  name: 'metadata/package-imports',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      exports: {
        packageImports: packageImportsProvider.export(packageScope),
      },
      dependencies: {},
      run() {
        const packageImports: DeclaredPackageImport[] = [];
        return {
          providers: {
            packageImports: {
              registerPackageImportProvider(declaredImport) {
                if (
                  packageImports.some(
                    (existing) =>
                      existing.moduleSpecifier ===
                      declaredImport.moduleSpecifier,
                  )
                ) {
                  throw new Error(
                    `Package import ${declaredImport.moduleSpecifier} already registered`,
                  );
                }
                packageImports.push(declaredImport);
              },
            },
          },
          build: (builder) => {
            if (!builder.metadataOptions.includeTemplateMetadata) return;
            if (packageImports.length === 0) return;

            builder.writeFile({
              id: 'package-imports',
              destination: PACKAGE_IMPORTS_METADATA_FILE,
              contents: stringifyPrettyCompact(packageImports),
            });
          },
        };
      },
    }),
  }),
});
