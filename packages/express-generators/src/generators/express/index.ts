import {
  createTypescriptTemplateConfig,
  nodeProvider,
  typescriptProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
} from '@baseplate/sync';
import * as yup from 'yup';

interface ExpressDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

const SERVER_FILE_CONFIG = createTypescriptTemplateConfig({
  SERVER_MIDDLEWARE: { type: 'code-block' },
  PORT: { type: 'code-expression', default: 'process.env.PORT || 3000' },
});

export interface ExpressProvider {
  getServerFile(): TypescriptSourceFile<typeof SERVER_FILE_CONFIG>;
}

export const expressProvider = createProviderType<ExpressProvider>('express');

const ExpressGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ExpressDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  exports: {
    express: expressProvider,
  },
  childGenerators: {
    config: {
      provider: 'express-config',
      defaultDescriptor: {
        generator: '@baseplate/express/config',
        peerProvider: true,
      },
    },
  },
  createGenerator(descriptor, { node }) {
    const serverFile = new TypescriptSourceFile(SERVER_FILE_CONFIG);

    node.addPackages({
      express: '^4.17.1',
      cors: '^2.8.5',
      helmet: '^4.3.1',
    });
    node.addDevPackages({
      'ts-node-dev': '^1.0.0',
      'tsconfig-paths': '^3.9.0',
      '@types/node': '^14.14.11',
      '@types/cors': '^2.8.8',
      '@types/express': '^4.17.11',
    });
    node.addScripts({
      build: 'tsc',
      start:
        'ts-node-dev --transpile-only --respawn -r tsconfig-paths/register src',
    });
    return {
      getProviders: () => ({
        express: {
          getServerFile: () => serverFile,
        },
      }),
      build: async (context) => {
        const template = await readTemplate(__dirname, 'src/index.ts');
        context.addAction(serverFile.renderToAction(template, 'src/index.ts'));
      },
    };
  },
});

export default ExpressGenerator;
