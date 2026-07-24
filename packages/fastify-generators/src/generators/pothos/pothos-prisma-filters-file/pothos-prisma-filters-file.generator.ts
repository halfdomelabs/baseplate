import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageInfoProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { lowerCaseFirst } from '#src/utils/case.js';
import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import {
  pothosConfigProvider,
  pothosImportsProvider,
} from '../pothos/index.js';

const descriptorSchema = z.object({});

/**
 * Maximum nesting depth allowed for AND/OR/NOT in a WhereInput. Applies to
 * every model's WhereInput uniformly — GraphQL's own selection-set depth
 * isn't affected by how deeply a `where` argument value is nested, so this
 * is enforced separately via `validateWhereComplexity`.
 */
const MAX_WHERE_DEPTH = 4;

/**
 * Maximum total number of AND/OR/NOT clauses allowed anywhere in a
 * WhereInput (its "breadth"). Bounds e.g. `{ OR: [ ...500 clauses... ] }`,
 * which a depth check alone wouldn't catch since it can stay shallow.
 */
const MAX_WHERE_CLAUSE_COUNT = 25;

export interface PothosPrismaWhereComplexityValidatorProvider {
  /** Fragment referencing the shared `validateWhereComplexity` function. */
  getValidatorFragment: () => TsCodeFragment;
  /** The configured maximum AND/OR/NOT nesting depth. */
  getMaxDepth: () => number;
  /** The configured maximum total AND/OR/NOT clause count. */
  getMaxClauseCount: () => number;
}

export const pothosPrismaWhereComplexityValidatorProvider =
  createReadOnlyProviderType<PothosPrismaWhereComplexityValidatorProvider>(
    'pothos-prisma-where-complexity-validator',
  );

const STRING_LIKE_OPS = [
  'equals',
  'not',
  'in',
  'notIn',
  'lt',
  'lte',
  'gt',
  'gte',
  'contains',
  'startsWith',
  'endsWith',
];
const ORDERED_OPS = ['equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte'];
const EQUALITY_ONLY_OPS = ['equals', 'not'];

/**
 * Names of the shared scalar filter input types keyed by the GraphQL scalar
 * name they filter (e.g. 'String' -> 'StringFilter'). Covers both Pothos's
 * built-in scalars and the custom scalars registered by `pothos-scalar`
 * (Uuid, DateTime, Date). JSON/JSONObject scalars intentionally have no
 * filter type — filtering on opaque JSON blobs isn't supported.
 */
const SCALAR_FILTER_OPS: Record<string, string[]> = {
  String: STRING_LIKE_OPS,
  Uuid: ORDERED_OPS,
  DateTime: ORDERED_OPS,
  Date: ORDERED_OPS,
  Int: ORDERED_OPS,
  Float: ORDERED_OPS,
  Boolean: EQUALITY_ONLY_OPS,
};

/**
 * Generates a single, app-wide `src/plugins/graphql/filters.ts` file
 * defining Prisma-compatible scalar filter input types (`StringFilter`,
 * `IntFilter`, etc.) shared by every model's `WhereInput` type. Enum filters
 * are generated separately, alongside each enum, by `pothos-prisma-enum`.
 * All filter types are registered into `pothosConfig.inputTypes`, so
 * consumers resolve them via
 * `pothosSchemaBaseTypesProvider.inputRef('XFilter')`.
 */
export const pothosPrismaFiltersFileGenerator = createGenerator({
  name: 'pothos/pothos-prisma-filters-file',
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
        pothosPrismaWhereComplexityValidator:
          pothosPrismaWhereComplexityValidatorProvider.export(packageScope),
      },
      run({ packageInfo, typescriptFile, pothosConfig, pothosImports }) {
        const filtersPath = `${packageInfo.getPackageSrcPath()}/plugins/graphql/filters.ts`;

        pothosConfig.schemaFiles.push(filtersPath);

        const filterDefinitions = new Map<string, TsCodeFragment>();

        const whereComplexityValidatorFragment = tsCodeFragment(
          `
/**
 * Recursively checks that a WhereInput value's AND/OR/NOT nesting does not
 * exceed maxDepth, and that the total number of AND/OR/NOT clauses across
 * the whole tree does not exceed maxClauseCount. GraphQL's own query
 * complexity/depth limiting only measures the selection set, not argument
 * values, so a \`where\` filter's shape must be bounded separately. The
 * configured limits are embedded at generation time in each query's
 * \`validate\` call rather than read from constants here.
 *
 * Depth alone doesn't bound breadth — \`{ OR: [ ...500 clauses... ] }\` stays
 * at depth 2 no matter how many clauses are in the array — so both checks
 * run in the same pass.
 */
export function validateWhereComplexity(
  where: unknown,
  maxDepth: number,
  maxClauseCount: number,
): boolean {
  let clauseCount = 0;

  function walk(value: unknown, depth: number): boolean {
    if (!value || typeof value !== 'object') {
      return true;
    }
    const { AND, OR, NOT } = value as {
      AND?: unknown[];
      OR?: unknown[];
      NOT?: unknown;
    };
    const nested = [...(AND ?? []), ...(OR ?? []), ...(NOT ? [NOT] : [])];
    if (nested.length === 0) {
      return true;
    }
    if (depth + 1 > maxDepth) {
      return false;
    }
    clauseCount += nested.length;
    if (clauseCount > maxClauseCount) {
      return false;
    }
    return nested.every((clause) => walk(clause, depth + 1));
  }

  return walk(where, 1);
}
`.trim(),
        );

        filterDefinitions.set(
          '_validateWhereComplexity',
          whereComplexityValidatorFragment,
        );

        const validatorImportRef = tsCodeFragment(
          'validateWhereComplexity',
          tsImportBuilder(['validateWhereComplexity']).from(filtersPath),
        );

        function defineFilterType(
          filterName: string,
          fields: Record<string, TsCodeFragment | string>,
        ): void {
          const variableName = lowerCaseFirst(filterName);

          const fieldFragments = Object.fromEntries(
            Object.entries(fields).map(([fieldName, type]) => [
              fieldName,
              TsCodeUtils.formatFragment('t.field({ type: TYPE })', {
                TYPE: type,
              }),
            ]),
          );

          filterDefinitions.set(
            filterName,
            TsCodeUtils.formatFragment(
              `export const VARIABLE_NAME = BUILDER.inputType(FILTER_NAME, {
                fields: (t) => (FIELDS),
              });`,
              {
                VARIABLE_NAME: variableName,
                BUILDER: pothosImports.builder.fragment(),
                FILTER_NAME: quot(filterName),
                FIELDS: TsCodeUtils.mergeFragmentsAsObject(fieldFragments, {
                  disableSort: true,
                }),
              },
            ),
          );

          pothosConfig.inputTypes.set(
            filterName,
            createPothosTypeReference({
              name: filterName,
              exportName: variableName,
              moduleSpecifier: filtersPath,
            }),
          );
        }

        const LIST_OPS = new Set(['in', 'notIn']);

        for (const [scalarName, ops] of Object.entries(SCALAR_FILTER_OPS)) {
          defineFilterType(
            `${scalarName}Filter`,
            Object.fromEntries(
              ops.map((op) => [
                op,
                LIST_OPS.has(op) ? `[${quot(scalarName)}]` : quot(scalarName),
              ]),
            ),
          );
        }
        // Note: for shorthand string scalar names, Pothos list types are
        // written as `['String']` (a TS array), not an SDL-style bracket
        // string — the quoting above produces `['String']` since
        // `quot('String')` yields `'String'` and the template wraps it.

        return {
          providers: {
            pothosPrismaWhereComplexityValidator: {
              getValidatorFragment: () => validatorImportRef,
              getMaxDepth: () => MAX_WHERE_DEPTH,
              getMaxClauseCount: () => MAX_WHERE_CLAUSE_COUNT,
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: 'pothos-prisma-filters-file',
                destination: filtersPath,
                fragment: TsCodeUtils.mergeFragments(filterDefinitions, '\n\n'),
              }),
            );
          },
        };
      },
    }),
  }),
});
