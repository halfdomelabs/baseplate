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
    logError: path.join(baseDirectory, 'services/error-logger.ts'),
    HttpError: path.join(baseDirectory, 'utils/http-errors.ts'),
    BadRequestError: path.join(baseDirectory, 'utils/http-errors.ts'),
    UnauthorizedError: path.join(baseDirectory, 'utils/http-errors.ts'),
    ForbiddenError: path.join(baseDirectory, 'utils/http-errors.ts'),
    NotFoundError: path.join(baseDirectory, 'utils/http-errors.ts'),
    InternalServerError: path.join(baseDirectory, 'utils/http-errors.ts'),
    handleZodRequestValidationError: path.join(baseDirectory, 'utils/zod.ts'),
  });
}
