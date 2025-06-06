import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

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

type ErrorHandlerServiceImportsProvider = TsImportMapProviderFromSchema<
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

  return createTsImportMap(errorHandlerServiceImportsSchema, {
    BadRequestError: path.join(importBase, 'utils/http-errors.js'),
    ForbiddenError: path.join(importBase, 'utils/http-errors.js'),
    handleZodRequestValidationError: path.join(importBase, 'utils/zod.js'),
    HttpError: path.join(importBase, 'utils/http-errors.js'),
    InternalServerError: path.join(importBase, 'utils/http-errors.js'),
    logError: path.join(importBase, 'services/error-logger.js'),
    NotFoundError: path.join(importBase, 'utils/http-errors.js'),
    UnauthorizedError: path.join(importBase, 'utils/http-errors.js'),
  });
}
