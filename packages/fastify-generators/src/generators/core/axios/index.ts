import {
  CORE_PACKAGES,
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createTaskConfigBuilder } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceSetupProvider } from '../error-handler-service/index.js';

const descriptorSchema = z.object({});

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    node: nodeProvider,
    errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
    typescript: typescriptProvider,
  },
  run({ node, errorHandlerServiceSetup, typescript }) {
    const [axiosImport, axiosFile] = makeImportAndFilePath(
      `src/services/axios.ts`,
    );

    node.addPackages({
      axios: CORE_PACKAGES.axios,
    });

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
}));

export const axiosGenerator = createGenerator({
  name: 'core/axios',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
