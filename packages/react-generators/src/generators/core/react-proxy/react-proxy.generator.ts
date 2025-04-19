import { projectScope, tsCodeFragment } from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactConfigProvider } from '../react-config/react-config.generator.js';
import { reactBaseConfigProvider } from '../react/react.generator.js';

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
        reactProxy: reactProxyProvider.export(projectScope),
      },
      run({ reactBaseConfig, reactConfig }) {
        reactConfig.addEnvVar('DEV_BACKEND_HOST', devBackendHost);
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
                `envVars.DEV_BACKEND_HOST
          ? {
              '/api': {
                target: envVars.DEV_BACKEND_HOST,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\\/api/, ''),
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
