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
  /**
   * Forward upstream (backend) connection closes to the browser for streaming
   * responses. Vite's dev proxy does not do this by default, so server-sent
   * event streams (e.g. GraphQL subscriptions over SSE) hang on a backend
   * restart instead of reconnecting. See https://github.com/vitejs/vite/issues/20712
   */
  enableStreamingReconnect(): void;
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
        let enableStreamingReconnect = false;
        return {
          providers: {
            reactProxy: {
              enableStreamingReconnect: () => {
                enableStreamingReconnect = true;
              },
            },
          },
          build: () => {
            const streamingReconnectConfigure = String.raw`configure: (proxy) => {
                  // Vite's dev proxy does not forward an upstream connection
                  // close to the browser for streaming responses (SSE), so a
                  // backend restart leaves the client hanging instead of
                  // reconnecting. Destroy the client response when the upstream
                  // response ends. See https://github.com/vitejs/vite/issues/20712
                  proxy.on('proxyRes', (proxyRes, _req, res) => {
                    proxyRes.on('close', () => {
                      if (!res.writableEnded) {
                        res.destroy();
                      }
                    });
                  });
                },`;
            reactBaseConfig.viteServerOptions.set(
              'proxy',
              tsCodeFragment(
                String.raw`envVars.DEV_BACKEND_HOST
          ? {
              '/api': {
                target: envVars.DEV_BACKEND_HOST,
                rewrite: (path) => path.replace(/^\/api/, ''),
                ${enableStreamingReconnect ? streamingReconnectConfigure : ''}
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
