import {
  TypescriptSourceFile,
  createTypescriptTemplateConfig,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const APP_FILE_CONFIG = createTypescriptTemplateConfig({
  COMPONENT_CODE: { type: 'code-block' },
  RENDER_WRAPPERS: { type: 'code-wrapper' },
  RENDER_ROOT: { type: 'code-expression', default: 'null' },
});

export type ReactAppProvider = {
  getAppFile(): TypescriptSourceFile<typeof APP_FILE_CONFIG>;
};

export const reactAppProvider =
  createProviderType<ReactAppProvider>('react-app');

const ReactAppGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    react: reactProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactApp: reactAppProvider,
  },
  createGenerator(descriptor, { react, typescript }) {
    const appFile = typescript.createTemplate(APP_FILE_CONFIG);
    const srcFolder = react.getSrcFolder();

    react
      .getIndexFile()
      .addCodeExpression(
        'APP',
        TypescriptCodeUtils.createExpression(
          '<App />',
          `import App from '@/${srcFolder}/app/App';`
        )
      );
    return {
      getProviders: () => ({
        reactApp: {
          getAppFile: () => appFile,
        },
      }),
      build: async (builder) => {
        const destination = `${srcFolder}/app/App.tsx`;

        if (appFile.getCodeBlocks('COMPONENT_CODE').length === 0) {
          await builder.apply(
            appFile.renderToAction('App.NoComponentCode.tsx', destination)
          );
        } else {
          await builder.apply(appFile.renderToAction('App.tsx', destination));
        }
      },
    };
  },
});

export default ReactAppGenerator;
