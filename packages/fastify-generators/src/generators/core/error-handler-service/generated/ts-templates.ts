import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../config-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '../../logger-service/generated/ts-import-maps.js';

const errorHandlerPlugin = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'error-handler-plugin',
  projectExports: {},
  source: { path: 'plugins/error-handler.ts' },
  variables: {},
});

const errorLogger = createTsTemplateFile({
  importMapProviders: { loggerServiceImports: loggerServiceImportsProvider },
  name: 'error-logger',
  projectExports: { logError: {} },
  source: { path: 'services/error-logger.ts' },
  variables: { TPL_CONTEXT_ACTIONS: {}, TPL_LOGGER_ACTIONS: {} },
});

const httpErrors = createTsTemplateFile({
  group: 'utils',
  name: 'http-errors',
  projectExports: {
    BadRequestError: {},
    ForbiddenError: {},
    HttpError: {},
    InternalServerError: {},
    NotFoundError: {},
    UnauthorizedError: {},
  },
  source: { path: 'utils/http-errors.ts' },
  variables: {},
});

const zod = createTsTemplateFile({
  group: 'utils',
  name: 'zod',
  projectExports: { handleZodRequestValidationError: {} },
  source: { path: 'utils/zod.ts' },
  variables: {},
});

const utilsGroup = createTsTemplateGroup({
  templates: {
    httpErrors: { destination: 'http-errors.ts', template: httpErrors },
    zod: { destination: 'zod.ts', template: zod },
  },
});

export const CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES = {
  errorHandlerPlugin,
  errorLogger,
  utilsGroup,
};
