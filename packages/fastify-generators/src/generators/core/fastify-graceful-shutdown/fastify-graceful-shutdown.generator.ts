import {
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceImportsProvider } from '../error-handler-service/generated/ts-import-maps.js';
import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { loggerServiceImportsProvider } from '../logger-service/logger-service.generator.js';
import { CORE_FASTIFY_GRACEFUL_SHUTDOWN_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyGracefulShutdownGenerator = createGenerator({
  name: 'core/fastify-graceful-shutdown',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({
        fastifyServerConfig,
        errorHandlerServiceImports,
        loggerServiceImports,
        typescriptFile,
      }) {
        const pluginPath = '@/src/plugins/graceful-shutdown.ts';

        fastifyServerConfig.plugins.set('gracefulShutdownPlugin', {
          plugin: TsCodeUtils.importFragment(
            'gracefulShutdownPlugin',
            pluginPath,
          ),
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_FASTIFY_GRACEFUL_SHUTDOWN_TS_TEMPLATES.gracefulShutdown,
                destination: pluginPath,
                importMapProviders: {
                  loggerServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
