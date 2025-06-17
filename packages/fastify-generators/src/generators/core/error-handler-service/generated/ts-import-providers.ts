import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_ERROR_HANDLER_SERVICE_PATHS } from './template-paths.js';

const errorHandlerServiceImportsSchema = createTsImportMapSchema({
  BadRequestError: {},
  ForbiddenError: {},
  handleZodRequestValidationError: {},
  HttpError: {},
  InternalServerError: {},
  logError: {},
  NotFoundError: {},
  UnauthorizedError: {},
});

export type ErrorHandlerServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof errorHandlerServiceImportsSchema
>;

export const errorHandlerServiceImportsProvider =
  createReadOnlyProviderType<ErrorHandlerServiceImportsProvider>(
    'error-handler-service-imports',
  );

const coreErrorHandlerServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_ERROR_HANDLER_SERVICE_PATHS.provider,
  },
  exports: {
    errorHandlerServiceImports:
      errorHandlerServiceImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        errorHandlerServiceImports: createTsImportMap(
          errorHandlerServiceImportsSchema,
          {
            BadRequestError: paths.httpErrors,
            ForbiddenError: paths.httpErrors,
            handleZodRequestValidationError: paths.zod,
            HttpError: paths.httpErrors,
            InternalServerError: paths.httpErrors,
            logError: paths.errorLogger,
            NotFoundError: paths.httpErrors,
            UnauthorizedError: paths.httpErrors,
          },
        ),
      },
    };
  },
});

export const CORE_ERROR_HANDLER_SERVICE_IMPORTS = {
  task: coreErrorHandlerServiceImportsTask,
};
