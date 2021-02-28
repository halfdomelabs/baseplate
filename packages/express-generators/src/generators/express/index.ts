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
  PORT: { type: 'code-expression', default: 'process.env.PORT || 4000' },
  START_MESSAGE: {
    type: 'code-expression',
    default: '`Server listening and ready at http://localhost:${port}`',
  },
  POST_START: { type: 'code-block' },
});

const FEATURE_FILE_CONFIG = createTypescriptTemplateConfig({
  APP_FEATURES: { type: 'code-expression', multiple: { separator: ', ' } },
});

const TYPES_FILE_CONFIG = createTypescriptTemplateConfig({
  APP_FEATURE_TYPE: { type: 'code-block' },
  TYPES: { type: 'code-block' },
});

export interface ExpressProvider {
  getSrcFolder(): string;
  getFeaturesFolder(): string;
  getServerFile(): TypescriptSourceFile<typeof SERVER_FILE_CONFIG>;
  getFeatureFile(): TypescriptSourceFile<typeof FEATURE_FILE_CONFIG>;
  getTypesFile(): TypescriptSourceFile<typeof TYPES_FILE_CONFIG>;
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
    features: {
      provider: 'express-feature',
      multiple: true,
    },
    providers: {
      multiple: true,
    },
  },
  createGenerator(descriptor, { node }) {
    const serverFile = new TypescriptSourceFile(SERVER_FILE_CONFIG);
    const featuresFile = new TypescriptSourceFile(FEATURE_FILE_CONFIG);
    const typesFile = new TypescriptSourceFile(TYPES_FILE_CONFIG);

    node.addPackages({
      express: '^4.17.1',
      cors: '^2.8.5',
      helmet: '^4.3.1',
      ramda: '^0.27.1',
    });
    node.addDevPackages({
      'ts-node-dev': '^1.0.0',
      'tsconfig-paths': '^3.9.0',
      '@types/node': '^14.14.11',
      '@types/cors': '^2.8.8',
      '@types/express': '^4.17.11',
      '@types/ramda': '^0.27.32',
    });
    node.addScripts({
      build: 'tsc',
      start:
        'ts-node-dev --transpile-only --respawn -r tsconfig-paths/register src',
    });
    return {
      getProviders: () => ({
        express: {
          getSrcFolder: () => 'src',
          getFeaturesFolder: () => 'src/features',
          getServerFile: () => serverFile,
          getFeatureFile: () => featuresFile,
          getTypesFile: () => typesFile,
        },
      }),
      build: async (context) => {
        const indexTemplate = await readTemplate(__dirname, 'src/index.ts');
        context.addAction(
          serverFile.renderToAction(indexTemplate, 'src/index.ts')
        );

        const typesTemplate = await readTemplate(__dirname, 'src/types.ts');
        context.addAction(
          typesFile.renderToAction(typesTemplate, 'src/types.ts')
        );

        const featuresTemplate = await readTemplate(
          __dirname,
          'src/features/index.ts'
        );
        context.addAction(
          featuresFile.renderToAction(featuresTemplate, 'src/features/index.ts')
        );
      },
    };
  },
});

export default ExpressGenerator;
