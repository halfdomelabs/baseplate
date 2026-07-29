import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageInfoProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import {
  pothosConfigProvider,
  pothosImportsProvider,
} from '../pothos/index.js';

const descriptorSchema = z.object({});

export interface PothosSortOrderProvider {
  /** Fragment referencing the shared `applyStableOrderBy` function. */
  getApplyStableOrderByFragment: () => TsCodeFragment;
}

export const pothosSortOrderProvider =
  createReadOnlyProviderType<PothosSortOrderProvider>('pothos-sort-order');

/**
 * Generates a single, app-wide `src/plugins/graphql/sort-order.ts` file
 * defining the `SortOrder` enum (shared by every model's `OrderByInput`
 * type) plus the `applyStableOrderBy` helper that appends a model's ID
 * field(s) as a tiebreaker so paginated results stay stable when the
 * caller's sort has ties. The `SortOrder` enum is registered into
 * `pothosConfig.enums`, so consumers resolve it via
 * `pothosSchemaBaseTypesProvider.enumRefOrThrow('SortOrder')`.
 */
export const pothosSortOrderGenerator = createGenerator({
  name: 'pothos/pothos-sort-order',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        packageInfo: packageInfoProvider,
        typescriptFile: typescriptFileProvider,
        pothosConfig: pothosConfigProvider,
        pothosImports: pothosImportsProvider,
      },
      exports: {
        pothosSortOrder: pothosSortOrderProvider.export(packageScope),
      },
      run({ packageInfo, typescriptFile, pothosConfig, pothosImports }) {
        const sortOrderPath = path.posix.join(
          packageInfo.getPackageSrcPath(),
          'plugins',
          'graphql',
          'sort-order.ts',
        );

        pothosConfig.schemaFiles.push(sortOrderPath);

        const exportName = 'sortOrderEnum';
        pothosConfig.enums.set(
          'SortOrder',
          createPothosTypeReference({
            name: 'SortOrder',
            exportName,
            moduleSpecifier: sortOrderPath,
          }),
        );

        const applyStableOrderByRef = TsCodeUtils.importFragment(
          'applyStableOrderBy',
          sortOrderPath,
        );

        return {
          providers: {
            pothosSortOrder: {
              getApplyStableOrderByFragment: () => applyStableOrderByRef,
            },
          },
          build: async (builder) => {
            const enumFragment = TsCodeUtils.formatFragment(
              `export const ${exportName} = BUILDER.enumType('SortOrder', {
                values: { ASC: { value: 'asc' }, DESC: { value: 'desc' } },
              });`,
              { BUILDER: pothosImports.builder.fragment() },
            );

            const helperFragment = tsCodeFragment(
              `/**
 * Resolves a Prisma \`orderBy\`, falling back to \`defaultSort\` when the caller
 * supplies none and appending the model's ID field(s) as a tiebreaker.
 *
 * The tiebreaker keeps cursor pagination stable: Prisma only guarantees
 * non-skipping/non-repeating pages when \`orderBy\` is a total order.
 *
 * @param orderBy - The caller-supplied sort clauses, if any.
 * @param idFields - The model's ID field(s), appended as a tiebreaker.
 * @param defaultSort - Used when the caller supplies no sort.
 * @returns The resolved clauses, or \`undefined\` when empty.
 */
export function applyStableOrderBy<T extends Record<string, 'asc' | 'desc'>>(
  orderBy: T[] | null | undefined,
  idFields: string[],
  defaultSort: Record<string, 'asc' | 'desc'>[] = [],
): (T | Record<string, 'asc' | 'desc'>)[] | undefined {
  // Every field on an OrderByInput is optional, so \`[{}]\` is a valid input,
  // and an empty clause reaching Prisma throws at runtime.
  const callerClauses = (orderBy ?? []).filter(
    (clause) => Object.keys(clause).length > 0,
  );
  const clauses = callerClauses.length > 0 ? callerClauses : defaultSort;
  // Derived after the fallback so a default sorting on an ID field doesn't
  // get a duplicate tiebreaker appended.
  const specifiedFields = new Set(
    clauses.flatMap((clause) => Object.keys(clause)),
  );
  const tiebreakers = idFields
    .filter((field) => !specifiedFields.has(field))
    .map((field) => ({ [field]: 'asc' as const }));
  const result = [...clauses, ...tiebreakers];
  return result.length > 0 ? result : undefined;
}`,
            );

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: 'sort-order',
                destination: sortOrderPath,
                fragment: TsCodeUtils.mergeFragments(
                  new Map([
                    ['enum', enumFragment],
                    ['helper', helperFragment],
                  ]),
                  '\n\n',
                ),
              }),
            );
          },
        };
      },
    }),
  }),
});
