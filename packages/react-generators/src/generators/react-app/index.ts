import {
  typescriptProvider,
  TypescriptSourceFile,
  createTypescriptTemplateConfig,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
  writeFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

interface ReactAppDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

const APP_FILE_CONFIG = createTypescriptTemplateConfig({
  COMPONENT_CODE: { type: 'code-block' },
  RENDER_WRAPPERS: { type: 'code-wrapper' },
  RENDER_ROOT: { type: 'code-block', single: true, default: 'null' },
});

export type ReactAppProvider = {
  getSourceFile(): TypescriptSourceFile<typeof APP_FILE_CONFIG>;
};

export const reactAppProvider = createProviderType<ReactAppProvider>(
  'react-app'
);

const ReactAppGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ReactAppDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    typescript: typescriptProvider,
    react: reactProvider,
  },
  exports: {
    reactApp: reactAppProvider,
  },
  createGenerator(descriptor, { typescript, react }) {
    const appFile = new TypescriptSourceFile(APP_FILE_CONFIG);
    return {
      getProviders: () => {
        return {
          reactApp: {
            getSourceFile: () => appFile,
          },
        };
      },
      build: async (context) => {
        const srcFolder = react.getSrcFolder();
        const appFolder = `${srcFolder}/app`;
        const destination = `${appFolder}/App.tsx`;

        const template = await readTemplate(__dirname, 'app.tsx');

        context.addAction(
          writeFileAction({
            destination,
            contents: appFile.render(template, appFolder),
          })
        );
      },
    };
  },
});

export default ReactAppGenerator;
