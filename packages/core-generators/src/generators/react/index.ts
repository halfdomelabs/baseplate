import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  copyFileAction,
  writeTemplateAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nodeProvider } from '../node';
import { typescriptProvider } from '../typescript';
import { setupReactNode } from './node';
import { setupReactTypescript } from './typescript';

interface Descriptor extends GeneratorDescriptor {
  title: string;
}

const descriptorSchema = {
  title: yup.string().default('React App'),
};

export type ReactProvider = {};

const ReactGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: {
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  createGenerator(descriptor, { node, typescript }) {
    return {
      getProviders: () => {
        return { react: {} };
      },
      build: (context) => {
        setupReactNode(node);
        setupReactTypescript(typescript);

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

        context.addAction(
          writeTemplateAction({
            template: 'src/app/App.tsx.ejs',
            destination: 'src/app/App.tsx',
            data: { title: descriptor.title },
          })
        );
      },
    };
  },
});

export default ReactGenerator;
