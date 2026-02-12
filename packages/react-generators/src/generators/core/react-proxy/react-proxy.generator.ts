import { packageScope, tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactConfigProvider } from '../react-config/index.js';
import { reactBaseConfigProvider } from '../react/index.js';

const descriptorSchema = z.object({
  devBackendHost: z.string().min(1),
});

export interface ReactProxyProvider {
  enableWebSocket(): void;
}

export const reactProxyProvider =
  createProviderType<ReactProxyProvider>('react-proxy');

export const reactProxyGenerator = createGenerator({
  name: 'core/react-proxy',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ devBackendHost }) => ({
    main: createGeneratorTask({
      dependencies: {
        reactConfig: reactConfigProvider,
        reactBaseConfig: reactBaseConfigProvider,
      },
      exports: {
        reactProxy: reactProxyProvider.export(packageScope),
      },
      run({ reactBaseConfig, reactConfig }) {
        reactConfig.additionalDevEnvVars.set(
          'DEV_BACKEND_HOST',
          devBackendHost,
        );
        let enableWebsocket = false;
        return {
          providers: {
            reactProxy: {
              enableWebSocket: () => {
                enableWebsocket = true;
              },
            },
          },
          build: () => {
            reactBaseConfig.viteServerOptions.set(
              'proxy',
              tsCodeFragment(
                String.raw`envVars.DEV_BACKEND_HOST
          ? {
              '/api': {
                target: envVars.DEV_BACKEND_HOST,
                rewrite: (path) => path.replace(/^\/api/, ''),
                ${enableWebsocket ? 'ws: true,' : ''}
              },
            }
          : undefined`,
              ),
            );
          },
        };
      },
    }),
  }),
});
