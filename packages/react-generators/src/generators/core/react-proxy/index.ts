import {
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactConfigProvider } from '../react-config/index.js';
import { reactProvider } from '../react/index.js';

const descriptorSchema = z.object({
  devBackendHost: z.string().min(1),
});

export interface ReactProxyProvider {
  enableWebSocket(): void;
}

export const reactProxyProvider =
  createProviderType<ReactProxyProvider>('react-proxy');

const ReactProxyGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { devBackendHost }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        reactConfig: reactConfigProvider,
        react: reactProvider,
      },
      exports: {
        reactProxy: reactProxyProvider.export(projectScope),
      },
      run({ react, reactConfig }) {
        reactConfig.addEnvVar('DEV_BACKEND_HOST', devBackendHost);
        let enableWebsocket = false;
        return {
          getProviders: () => ({
            reactProxy: {
              enableWebSocket: () => {
                enableWebsocket = true;
              },
            },
          }),
          build: () => {
            react.addServerOption(
              'proxy',
              TypescriptCodeUtils.createExpression(
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
    });
  },
});

export default ReactProxyGenerator;
