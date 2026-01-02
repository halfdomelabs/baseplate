import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_REACT_ERROR_BOUNDARY_PATHS } from './template-paths.js';

export const reactErrorBoundaryImportsSchema = createTsImportMapSchema({
  AsyncBoundary: {},
});

export type ReactErrorBoundaryImportsProvider = TsImportMapProviderFromSchema<
  typeof reactErrorBoundaryImportsSchema
>;

export const reactErrorBoundaryImportsProvider =
  createReadOnlyProviderType<ReactErrorBoundaryImportsProvider>(
    'react-error-boundary-imports',
  );

const coreReactErrorBoundaryImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ERROR_BOUNDARY_PATHS.provider,
  },
  exports: {
    reactErrorBoundaryImports:
      reactErrorBoundaryImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactErrorBoundaryImports: createTsImportMap(
          reactErrorBoundaryImportsSchema,
          { AsyncBoundary: paths.asyncBoundary },
        ),
      },
    };
  },
});

export const CORE_REACT_ERROR_BOUNDARY_IMPORTS = {
  task: coreReactErrorBoundaryImportsTask,
};
