import {
  ImportMapper,
  makeImportAndFilePath,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';

const descriptorSchema = z.object({});

export type AdminComponentsProvider = ImportMapper;

export const adminComponentsProvider =
  createProviderType<AdminComponentsProvider>('admin-components');

const AdminComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  exports: {
    adminComponents: adminComponentsProvider,
  },
  createGenerator(descriptor, { reactComponents, typescript }) {
    const [, embeddedListPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/EmbeddedListInput/index.tsx`
    );
    reactComponents.registerComponent({ name: 'EmbeddedListInput' });

    const [, embeddedObjectPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/EmbeddedObjectInput/index.tsx`
    );
    reactComponents.registerComponent({ name: 'EmbeddedObjectInput' });

    return {
      getProviders: () => ({
        adminComponents: {
          getImportMap: () => ({
            '%admin-components': {
              path: reactComponents.getComponentsImport(),
              allowedImports: ['EmbeddedListInput', 'EmbeddedObjectInput'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'EmbeddedListInput/index.tsx',
            destination: embeddedListPath,
          })
        );
        await builder.apply(
          typescript.createCopyAction({
            source: 'EmbeddedObjectInput/index.tsx',
            destination: embeddedObjectPath,
          })
        );
      },
    };
  },
});

export default AdminComponentsGenerator;
