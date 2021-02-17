import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  copyFileAction,
  writeTemplateAction,
  createProviderType,
  readTemplate,
} from '@baseplate/sync';
import * as yup from 'yup';
import {
  createTypescriptTemplateConfig,
  nodeGitIgnoreProvider,
  nodeProvider,
  typescriptProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';

import { setupReactNode } from './node';
import { setupReactTypescript } from './typescript';

interface Descriptor extends GeneratorDescriptor {
  title: string;
}

const descriptorSchema = {
  title: yup.string().default('React App'),
};

const INDEX_FILE_CONFIG = createTypescriptTemplateConfig({
  HEADER: { type: 'code-block' },
});

export type ReactProvider = {
  getSrcFolder(): string;
  getIndexFile(): TypescriptSourceFile<typeof INDEX_FILE_CONFIG>;
};

export const reactProvider = createProviderType<ReactProvider>('react');

const ReactGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: {
    node: nodeProvider,
    typescript: typescriptProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
  },
  exports: {
    react: reactProvider,
  },
  childGenerators: {
    app: {
      provider: 'react-app',
      defaultDescriptor: {
        generator: '@baseplate/react/react-app',
        peerProvider: true,
      },
    },
    router: {
      provider: 'react-router',
      defaultDescriptor: {
        generator: '@baseplate/react/react-router',
        peerProvider: true,
      },
    },
    components: {
      provider: 'react-components',
      defaultDescriptor: {
        generator: '@baseplate/react/react-components',
        peerProvider: true,
      },
    },
  },
  createGenerator(descriptor, { node, typescript, nodeGitIgnore }) {
    const indexFile = new TypescriptSourceFile(INDEX_FILE_CONFIG);
    setupReactNode(node);
    setupReactTypescript(typescript);

    nodeGitIgnore.addExclusions([
      '# production',
      '/build',
      '',
      '# misc',
      '.DS_Store',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '.env',
    ]);

    return {
      getProviders: () => {
        return {
          react: {
            getSrcFolder() {
              return 'src';
            },
            getIndexFile() {
              return indexFile;
            },
          },
        };
      },
      build: async (context) => {
        const staticFiles = [
          'public/favicon.ico',
          'public/logo192.png',
          'public/logo512.png',
          'public/manifest.json',
          'public/robots.txt',
          'src/react-app-env.d.ts',
          'src/reportWebVitals.ts',
          'src/setupTests.ts',
          'README.md',
        ];

        staticFiles.forEach((file) =>
          context.addAction(
            copyFileAction({
              source: file,
              destination: file,
            })
          )
        );

        const template = await readTemplate(__dirname, 'src/index.tsx');
        context.addAction(indexFile.renderToAction(template, 'src/index.tsx'));

        context.addAction(
          writeTemplateAction({
            template: 'public/index.html.ejs',
            destination: 'public/index.html',
            data: { title: descriptor.title },
          })
        );
      },
    };
  },
});

export default ReactGenerator;
