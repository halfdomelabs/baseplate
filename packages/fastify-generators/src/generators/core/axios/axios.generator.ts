import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsTemplate,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceConfigProvider } from '../error-handler-service/error-handler-service.generator.js';
import {
  axiosImportsProvider,
  createAxiosImports,
} from './generated/ts-import-maps.js';
import { CORE_AXIOS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const axiosGenerator = createGenerator({
  name: 'core/axios',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(CORE_PACKAGES, ['axios']),
    }),
    axiosImports: createGeneratorTask({
      exports: {
        axiosImports: axiosImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            axiosImports: createAxiosImports('@/src/services'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        errorHandlerServiceConfig: errorHandlerServiceConfigProvider,
        typescriptFile: typescriptFileProvider,
        axiosImports: axiosImportsProvider,
      },
      run({ errorHandlerServiceConfig, typescriptFile, axiosImports }) {
        const axiosFilePath = '@/src/services/axios.ts';

        return {
          providers: {
            axiosImports: createAxiosImports('@/src/services'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_AXIOS_TS_TEMPLATES.axios,
                destination: axiosFilePath,
              }),
            );

            errorHandlerServiceConfig.contextActions.set(
              'getAxiosErrorInfo',
              tsTemplate`
                Object.assign(context, ${axiosImports.getAxiosErrorInfo.fragment()}(error));
              `,
            );
          },
        };
      },
    }),
  }),
});

export { axiosImportsProvider } from './generated/ts-import-maps.js';
