import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactLoggerImportsProvider } from '#src/generators/core/react-logger/generated/ts-import-providers.js';

const errorFormatter = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'error-formatter',
  projectExports: { formatError: {}, logAndFormatError: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/error-formatter.ts',
    ),
  },
  variables: { TPL_ERROR_FORMATTERS: {} },
});

const errorLogger = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { reactLoggerImports: reactLoggerImportsProvider },
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

export const CORE_REACT_ERROR_TEMPLATES = { errorFormatter, errorLogger };
