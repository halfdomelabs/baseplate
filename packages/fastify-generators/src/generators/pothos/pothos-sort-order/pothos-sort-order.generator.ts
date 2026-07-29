import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { packageScope, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import { pothosConfigProvider } from '../pothos/index.js';
import { POTHOS_POTHOS_SORT_ORDER_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

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
 * type) plus the `applyStableOrderBy` helper that resolves a caller's sort,
 * a model's default sort, and its ID field(s) into a stable `orderBy`. The
 * file's content is static — every project gets the same helper — so it's
 * rendered from a template rather than built dynamically. The `SortOrder`
 * enum is registered into `pothosConfig.enums`, so consumers resolve it via
 * `pothosSchemaBaseTypesProvider.enumRefOrThrow('SortOrder')`.
 */
export const pothosSortOrderGenerator = createGenerator({
  name: 'pothos/pothos-sort-order',
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
        pothosSortOrder: pothosSortOrderProvider.export(packageScope),
      },
      run({ paths, renderers, pothosConfig }) {
        const sortOrderPath = paths.sortOrder;

        pothosConfig.schemaFiles.push(sortOrderPath);

        pothosConfig.enums.set(
          'SortOrder',
          createPothosTypeReference({
            name: 'SortOrder',
            exportName: 'sortOrderEnum',
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
            await builder.apply(
              renderers.mainGroupGroup.render({ variables: {} }),
            );
          },
        };
      },
    }),
  }),
});
