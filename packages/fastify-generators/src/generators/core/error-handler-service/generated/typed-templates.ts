import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

const errorHandlerPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'error-handler-plugin',
  referencedGeneratorTemplates: { errorLogger: {}, httpErrors: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/error-handler.ts',
    ),
  },
  variables: {},
});

const errorLogger = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { loggerServiceImports: loggerServiceImportsProvider },
  name: 'error-logger',
  projectExports: { logError: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/error-logger.ts',
    ),
  },
  variables: { TPL_CONTEXT_ACTIONS: {}, TPL_LOGGER_ACTIONS: {} },
});

const httpErrors = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'http-errors',
  projectExports: {
    BadRequestError: {},
    ForbiddenError: {},
    HttpError: {},
    InternalServerError: {},
    NotFoundError: {},
    UnauthorizedError: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/http-errors.ts',
    ),
  },
  variables: {},
});

const zod = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'zod',
  projectExports: { handleZodRequestValidationError: {} },
  referencedGeneratorTemplates: { httpErrors: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/utils/zod.ts'),
  },
  variables: {},
});

export const utilsGroup = { httpErrors, zod };

export const CORE_ERROR_HANDLER_SERVICE_TEMPLATES = {
  errorHandlerPlugin,
  errorLogger,
  utilsGroup,
};
