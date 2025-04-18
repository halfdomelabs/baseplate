import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceConfigProvider } from '../error-handler-service/error-handler-service.generator.js';
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
    main: createGeneratorTask({
      dependencies: {
        errorHandlerServiceConfig: errorHandlerServiceConfigProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ errorHandlerServiceConfig, typescriptFile }) {
        const axiosFilePath = '@/src/services/axios.ts';

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_AXIOS_TS_TEMPLATES.axios,
                destination: axiosFilePath,
              }),
            );

            errorHandlerServiceConfig.contextActions.set(
              'getAxiosErrorInfo',
              tsCodeFragment(
                `Object.assign(context, getAxiosErrorInfo(error));`,
                tsImportBuilder(['getAxiosErrorInfo']).from(axiosFilePath),
              ),
            );
          },
        };
      },
    }),
  }),
});
