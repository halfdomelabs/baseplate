import {
  createTypescriptTemplateConfig,
  eslintProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  typescriptProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  copyFileAction,
  writeTemplateAction,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';

import { setupReactNode } from './node';

const descriptorSchema = yup.object({
  title: yup.string().default('React App'),
  description: yup.string().default('A React app'),
});

const INDEX_FILE_CONFIG = createTypescriptTemplateConfig({
  APP: { type: 'code-expression', default: '<div />' },
  HEADER: { type: 'code-block' },
});

export type ReactProvider = {
  getSrcFolder(): string;
  getIndexFile(): TypescriptSourceFile<typeof INDEX_FILE_CONFIG>;
};

export const reactProvider = createProviderType<ReactProvider>('react');

const ReactGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
    eslint: eslintProvider.dependency().optional(),
  },
  exports: {
    react: reactProvider,
  },
  getDefaultChildGenerators: () => ({
    typescript: {
      defaultDescriptor: {
        generator: '@baseplate/react/core/react-typescript',
      },
    },
    app: {
      provider: 'react-app',
      defaultDescriptor: {
        generator: '@baseplate/react/core/react-app',
        peerProvider: true,
      },
    },
    router: {
      provider: 'react-router',
      defaultDescriptor: {
        generator: '@baseplate/react/core/react-router',
        peerProvider: true,
      },
    },
    // components: {
    //   provider: 'react-components',
    //   defaultDescriptor: {
    //     generator: '@baseplate/react/core/react-components',
    //     peerProvider: true,
    //   },
    // },
  }),
  createGenerator(descriptor, { node, typescript, nodeGitIgnore, eslint }) {
    const indexFile = typescript.createTemplate(INDEX_FILE_CONFIG);
    setupReactNode(node);

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
    ]);

    eslint?.getConfig().set('react', true);

    return {
      getProviders: () => ({
        react: {
          getSrcFolder() {
            return 'src';
          },
          getIndexFile() {
            return indexFile;
          },
        },
      }),
      build: async (builder) => {
        const initialFiles = ['public/favicon.ico', 'README.md'];

        await Promise.all(
          initialFiles.map((file) =>
            copyFileAction({
              source: file,
              destination: file,
              neverOverwrite: true,
            })
          )
        );

        const staticFiles = ['src/react-app-env.d.ts', 'src/setupTests.ts'];

        await Promise.all(
          staticFiles.map((file) =>
            builder.apply(
              copyFileAction({
                source: file,
                destination: file,
                shouldFormat: true,
              })
            )
          )
        );

        await builder.apply(
          indexFile.renderToAction('src/index.tsx', 'src/index.tsx')
        );

        await builder.apply(
          writeTemplateAction({
            template: 'public/index.html.ejs',
            destination: 'public/index.html',
            data: {
              title: descriptor.title,
              description: descriptor.description,
            },
          })
        );
      },
    };
  },
});

export default ReactGenerator;
