import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const axios = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'axios',
  projectExports: { getAxiosErrorInfo: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/axios.ts'),
  },
  variables: {},
});

export const CORE_AXIOS_TEMPLATES = { axios };
