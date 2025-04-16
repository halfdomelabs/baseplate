import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceConfigProvider } from '../error-handler-service/error-handler-service.generator.js';

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
        typescript: typescriptProvider,
      },
      run({ errorHandlerServiceConfig, typescript }) {
        const [axiosImport, axiosFile] = makeImportAndFilePath(
          `src/services/axios.ts`,
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'axios.ts',
                destination: axiosFile,
              }),
            );

            errorHandlerServiceConfig.contextActions.set(
              'getAxiosErrorInfo',
              tsCodeFragment(
                `Object.assign(context, getAxiosErrorInfo(error));`,
                tsImportBuilder(['getAxiosErrorInfo']).from(axiosImport),
              ),
            );
          },
        };
      },
    }),
  }),
});
