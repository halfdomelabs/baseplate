import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactLoggerImportsProvider } from '../../react-logger/generated/ts-import-maps.js';

const errorFormatter = createTsTemplateFile({
  name: 'error-formatter',
  projectExports: { formatError: {}, logAndFormatError: {} },
  source: { path: 'error-formatter.ts' },
  variables: { TPL_ERROR_FORMATTERS: {} },
});

const errorLogger = createTsTemplateFile({
  importMapProviders: { reactLoggerImports: reactLoggerImportsProvider },
  name: 'error-logger',
  projectExports: { logError: {} },
  source: { path: 'error-logger.ts' },
  variables: { TPL_CONTEXT_ACTIONS: {}, TPL_LOGGER_ACTIONS: {} },
});

export const CORE_REACT_ERROR_TS_TEMPLATES = { errorFormatter, errorLogger };
