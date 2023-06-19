import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactProvider } from '../react/index.js';
import { reactConfigProvider } from '../react-config/index.js';

const descriptorSchema = z.object({
  devBackendHost: z.string().min(1),
});

export interface ReactProxyProvider {
  enableWebSocket(): void;
}

export const reactProxyProvider =
  createProviderType<ReactProxyProvider>('react-proxy');

const ReactProxyGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactConfig: reactConfigProvider,
    react: reactProvider,
  },
  exports: {
    reactProxy: reactProxyProvider,
  },
  createGenerator({ devBackendHost }, { react, reactConfig }) {
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
          : undefined`
          )
        );
      },
    };
  },
});

export default ReactProxyGenerator;
