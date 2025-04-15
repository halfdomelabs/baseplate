import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@halfdomelabs/core-generators';

import { configServiceImportsProvider } from '../../config-service/generated/ts-import-maps.js';

const httpErrors = createTsTemplateFile({
  name: 'http-errors',
  group: 'utils',
  source: { path: 'utils/http-errors.ts' },
  variables: {},
  projectExports: {
    HttpError: {},
    BadRequestError: {},
    UnauthorizedError: {},
    ForbiddenError: {},
    NotFoundError: {},
    InternalServerError: {},
  },
});

const zod = createTsTemplateFile({
  name: 'zod',
  group: 'utils',
  source: { path: 'utils/zod.ts' },
  variables: {},
  projectExports: { handleZodRequestValidationError: {} },
});

const utilsGroup = createTsTemplateGroup({
  templates: {
    httpErrors: { destination: 'http-errors.ts', template: httpErrors },
    zod: { destination: 'zod.ts', template: zod },
  },
});

const errorLogger = createTsTemplateFile({
  name: 'error-logger',
  source: { path: 'services/error-logger.ts' },
  variables: { TPL_CONTEXT_ACTIONS: {}, TPL_LOGGER_ACTIONS: {} },
  projectExports: { logError: {} },
});

const errorHandlerPlugin = createTsTemplateFile({
  name: 'error-handler-plugin',
  source: { path: 'plugins/error-handler.ts' },
  variables: {},
  projectExports: {},
  importMapProviders: { configServiceImports: configServiceImportsProvider },
});

export const CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES = {
  utilsGroup,
  errorLogger,
  errorHandlerPlugin,
};
