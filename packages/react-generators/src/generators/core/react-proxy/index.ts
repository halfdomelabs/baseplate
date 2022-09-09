import { eslintProvider, nodeProvider } from '@baseplate/core-generators';
import {
  copyFileAction,
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactConfigProvider } from '../react-config';

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
    node: nodeProvider,
    reactConfig: reactConfigProvider,
    eslint: eslintProvider,
  },
  exports: {
    reactProxy: reactProxyProvider,
  },
  createGenerator({ devBackendHost }, { node, eslint, reactConfig }) {
    node.addPackages({ 'http-proxy-middleware': '^2.0.4' });
    reactConfig.addEnvVar('DEV_BACKEND_HOST', devBackendHost);
    eslint.getConfig().appendUnique('eslintIgnore', ['src/setupProxy.js']);
    let enableWebsocket = false;
    return {
      getProviders: () => ({
        reactProxy: {
          enableWebSocket: () => {
            enableWebsocket = true;
          },
        },
      }),
      build: async (builder) => {
        await builder.apply(
          copyFileAction({
            source: 'setupProxy.js',
            destination: 'src/setupProxy.js',
            shouldFormat: true,
            replacements: {
              'WS_OPTION,': enableWebsocket ? 'ws:true' : '',
            },
          })
        );
      },
    };
  },
});

export default ReactProxyGenerator;
