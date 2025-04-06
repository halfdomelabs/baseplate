import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceSetupProvider } from '../error-handler-service/index.js';

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
        errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
        typescript: typescriptProvider,
      },
      run({ errorHandlerServiceSetup, typescript }) {
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

            errorHandlerServiceSetup
              .getHandlerFile()
              .addCodeBlock(
                'CONTEXT_ACTIONS',
                TypescriptCodeUtils.createBlock(
                  `Object.assign(context, getAxiosErrorInfo(error));`,
                  [`import { getAxiosErrorInfo } from '${axiosImport}'`],
                ),
              );
          },
        };
      },
    }),
  }),
});
