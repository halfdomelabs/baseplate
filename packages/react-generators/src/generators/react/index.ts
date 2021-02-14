import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  copyFileAction,
  writeTemplateAction,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nodeProvider, typescriptProvider } from '@baseplate/core-generators';

import { setupReactNode } from './node';
import { setupReactTypescript } from './typescript';

interface Descriptor extends GeneratorDescriptor {
  title: string;
}

const descriptorSchema = {
  title: yup.string().default('React App'),
};

export type ReactProvider = {
  getSrcFolder(): string;
};

export const reactProvider = createProviderType<ReactProvider>('react');

const ReactGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: {
    node: nodeProvider,
    typescript: typescriptProvider,
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
  },
  createGenerator(descriptor, { node, typescript }) {
    setupReactNode(node);
    setupReactTypescript(typescript);

    return {
      getProviders: () => {
        return {
          react: {
            getSrcFolder() {
              return 'src';
            },
          },
        };
      },
      build: (context) => {
        const staticFiles = [
          'public/favicon.ico',
          'public/logo192.png',
          'public/logo512.png',
          'public/manifest.json',
          'public/robots.txt',
          'src/index.css',
          'src/index.tsx',
          'src/react-app-env.d.ts',
          'src/reportWebVitals.ts',
          'src/setupTests.ts',
        ];

        staticFiles.forEach((file) =>
          context.addAction(
            copyFileAction({
              source: file,
              destination: file,
            })
          )
        );

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
