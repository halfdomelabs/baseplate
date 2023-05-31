import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactAppProvider } from '../react-app';

const descriptorSchema = z.object({
  headerName: z.string().optional(),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type ReactErrorBoundaryProvider = unknown;

export const reactErrorBoundaryProvider =
  createProviderType<ReactErrorBoundaryProvider>('react-error-boundary');

const createMainTask = createTaskConfigBuilder(
  ({ headerName }: Descriptor) => ({
    name: 'main',
    dependencies: {
      reactApp: reactAppProvider,
      typescript: typescriptProvider,
    },
    exports: {
      reactErrorBoundary: reactErrorBoundaryProvider,
    },
    run({ reactApp, typescript }) {
      const [errorBoundaryImport, errorBoundaryPath] = makeImportAndFilePath(
        'src/components/ErrorBoundary.tsx'
      );

      return {
        getProviders: () => ({
          reactErrorBoundary: {},
        }),
        build: async (builder) => {
          const errorBoundaryFile = typescript.createTemplate({
            HEADING_NAME: new TypescriptStringReplacement(
              headerName || "Error :(, we're sorry"
            ),
          });

          reactApp.setErrorBoundary(
            TypescriptCodeUtils.createWrapper(
              (contents) => `
            <ErrorBoundary>${contents}</ErrorBoundary>`,
              `import {ErrorBoundary} from '${errorBoundaryImport}';`
            )
          );

          await builder.apply(
            errorBoundaryFile.renderToAction(
              'error-boundary.tsx',
              errorBoundaryPath
            )
          );
        },
      };
    },
  })
);

const ReactErrorBoundaryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default ReactErrorBoundaryGenerator;
