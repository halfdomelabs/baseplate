import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const axios = createTsTemplateFile({
  name: 'axios',
  projectExports: { getAxiosErrorInfo: {} },
  source: { path: 'axios.ts' },
  variables: {},
});

export const CORE_AXIOS_TS_TEMPLATES = { axios };
