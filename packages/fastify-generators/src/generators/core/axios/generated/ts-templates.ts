import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const axios = createTsTemplateFile({
  name: 'axios',
  projectExports: {
    axiosClient: {},
    getAxiosErrorInfo: {},
    setupAxiosBetterStackTrace: {},
  },
  source: { path: 'axios.ts' },
  variables: {},
});

export const CORE_AXIOS_TS_TEMPLATES = { axios };
