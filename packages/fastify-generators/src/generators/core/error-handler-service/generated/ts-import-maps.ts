import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

export const errorHandlerServiceImportsSchema = createTsImportMapSchema({
  logError: {},
  HttpError: {},
  BadRequestError: {},
  UnauthorizedError: {},
  ForbiddenError: {},
  NotFoundError: {},
  InternalServerError: {},
  handleZodRequestValidationError: {},
});

export type ErrorHandlerServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof errorHandlerServiceImportsSchema
>;

export const errorHandlerServiceImportsProvider =
  createReadOnlyProviderType<ErrorHandlerServiceImportsProvider>(
    'error-handler-service-imports',
  );

export function createErrorHandlerServiceImports(
  baseDirectory: string,
): ErrorHandlerServiceImportsProvider {
  return createTsImportMapProvider(errorHandlerServiceImportsSchema, {
    logError: path.join(baseDirectory, 'services/error-logger.js'),
    HttpError: path.join(baseDirectory, 'utils/http-errors.js'),
    BadRequestError: path.join(baseDirectory, 'utils/http-errors.js'),
    UnauthorizedError: path.join(baseDirectory, 'utils/http-errors.js'),
    ForbiddenError: path.join(baseDirectory, 'utils/http-errors.js'),
    NotFoundError: path.join(baseDirectory, 'utils/http-errors.js'),
    InternalServerError: path.join(baseDirectory, 'utils/http-errors.js'),
    handleZodRequestValidationError: path.join(baseDirectory, 'utils/zod.js'),
  });
}
