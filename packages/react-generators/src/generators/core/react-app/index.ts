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
import { z } from 'zod';
import { reactProvider } from '../react';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const APP_FILE_CONFIG = createTypescriptTemplateConfig({
  COMPONENT_CODE: { type: 'code-block' },
  RENDER_WRAPPERS: { type: 'code-wrapper' },
  RENDER_ROOT: { type: 'code-expression', default: '<div />' },
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
        await builder.apply(appFile.renderToAction('App.tsx', destination));
      },
    };
  },
});

export default ReactAppGenerator;
