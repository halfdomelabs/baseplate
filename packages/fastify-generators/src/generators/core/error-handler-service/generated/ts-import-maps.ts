import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

export const errorHandlerServiceImportsSchema = createTsImportMapSchema({
  BadRequestError: {},
  ForbiddenError: {},
  HttpError: {},
  InternalServerError: {},
  NotFoundError: {},
  UnauthorizedError: {},
  handleZodRequestValidationError: {},
  logError: {},
});

export type ErrorHandlerServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof errorHandlerServiceImportsSchema
>;

export const errorHandlerServiceImportsProvider =
  createReadOnlyProviderType<ErrorHandlerServiceImportsProvider>(
    'error-handler-service-imports',
  );

export function createErrorHandlerServiceImports(
  importBase: string,
): ErrorHandlerServiceImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMapProvider(errorHandlerServiceImportsSchema, {
    BadRequestError: path.join(importBase, 'utils/http-errors.js'),
    ForbiddenError: path.join(importBase, 'utils/http-errors.js'),
    HttpError: path.join(importBase, 'utils/http-errors.js'),
    InternalServerError: path.join(importBase, 'utils/http-errors.js'),
    NotFoundError: path.join(importBase, 'utils/http-errors.js'),
    UnauthorizedError: path.join(importBase, 'utils/http-errors.js'),
    handleZodRequestValidationError: path.join(importBase, 'utils/zod.js'),
    logError: path.join(importBase, 'services/error-logger.js'),
  });
}
