import { eslintProvider, nodeProvider } from '@baseplate/core-generators';
import { copyFileAction, createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { reactConfigProvider } from '../react-config';

const descriptorSchema = z.object({
  devBackendHost: z.string().min(1),
});

const ReactProxyGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    reactConfig: reactConfigProvider,
    eslint: eslintProvider,
  },
  createGenerator({ devBackendHost }, { node, eslint, reactConfig }) {
    node.addPackages({
      'http-proxy-middleware': '^2.0.4',
    });
    reactConfig.addEnvVar('DEV_BACKEND_HOST', devBackendHost);
    eslint.getConfig().appendUnique('eslintIgnore', ['src/setupProxy.js']);
    return {
      build: async (builder) => {
        await builder.apply(
          copyFileAction({
            source: 'setupProxy.js',
            destination: 'src/setupProxy.js',
            shouldFormat: true,
          })
        );
      },
    };
  },
});

export default ReactProxyGenerator;
