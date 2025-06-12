import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { errorHandlerServiceConfigProvider } from '../error-handler-service/index.js';
import { CORE_AXIOS_GENERATED } from './generated/index.js';
import { axiosImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export const axiosGenerator = createGenerator({
  name: 'core/axios',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_AXIOS_GENERATED.paths.task,
    imports: CORE_AXIOS_GENERATED.imports.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(CORE_PACKAGES, ['axios']),
    }),
    main: createGeneratorTask({
      dependencies: {
        errorHandlerServiceConfig: errorHandlerServiceConfigProvider,
        typescriptFile: typescriptFileProvider,
        axiosImports: axiosImportsProvider,
        paths: CORE_AXIOS_GENERATED.paths.provider,
      },
      run({ errorHandlerServiceConfig, typescriptFile, axiosImports, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_AXIOS_GENERATED.templates.axios,
                destination: paths.axios,
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
