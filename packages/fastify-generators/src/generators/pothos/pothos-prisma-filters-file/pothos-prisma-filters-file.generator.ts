import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { lowerCaseFirst } from '#src/utils/case.js';
import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import { pothosConfigProvider } from '../pothos/index.js';
import { POTHOS_POTHOS_PRISMA_FILTERS_FILE_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

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
 * which a depth check alone wouldn't catch since it can stay shallow. Also
 * bounds a single scalar filter's `in`/`notIn` operand array length.
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

/**
 * Names of the scalar filter input types declared by the static
 * `filters.ts` template (as `export const <lowerCaseFirst(name)>`). Kept in
 * sync by hand with the template's `export const` declarations — see
 * templates/src/plugins/graphql/filters.ts.
 */
const SCALAR_FILTER_NAMES = [
  'BooleanFilter',
  'DateFilter',
  'DateTimeFilter',
  'FloatFilter',
  'IntFilter',
  'StringFilter',
  'UuidFilter',
];

/**
 * Generates a single, app-wide `src/plugins/graphql/filters.ts` file
 * defining Prisma-compatible scalar filter input types (`StringFilter`,
 * `IntFilter`, etc.) shared by every model's `WhereInput` type, plus the
 * `validateWhereComplexity` guard. The file's content is static — every
 * project gets the same filter types — so it's rendered from a template
 * rather than built dynamically. Enum filters are generated separately,
 * alongside each enum, by `pothos-prisma-enum`. All filter types are
 * registered into `pothosConfig.inputTypes`, so consumers resolve them via
 * `pothosSchemaBaseTypesProvider.inputRef('XFilter')`.
 */
export const pothosPrismaFiltersFileGenerator = createGenerator({
  name: 'pothos/pothos-prisma-filters-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        pothosConfig: pothosConfigProvider,
      },
      exports: {
        pothosPrismaWhereComplexityValidator:
          pothosPrismaWhereComplexityValidatorProvider.export(packageScope),
      },
      run({ paths, renderers, pothosConfig }) {
        const filtersPath = paths.filters;

        pothosConfig.schemaFiles.push(filtersPath);

        for (const filterName of SCALAR_FILTER_NAMES) {
          pothosConfig.inputTypes.set(
            filterName,
            createPothosTypeReference({
              name: filterName,
              exportName: lowerCaseFirst(filterName),
              moduleSpecifier: filtersPath,
            }),
          );
        }

        const validatorImportRef = tsCodeFragment(
          'validateWhereComplexity',
          tsImportBuilder(['validateWhereComplexity']).from(filtersPath),
        );

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
              renderers.mainGroupGroup.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
