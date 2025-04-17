import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';

const descriptorSchema = z.object({});

export type AdminComponentsProvider = ImportMapper;

export const adminComponentsProvider =
  createProviderType<AdminComponentsProvider>('admin-components');

export const adminComponentsGenerator = createGenerator({
  name: 'admin/admin-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['nanoid']),
    }),
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        adminComponents: adminComponentsProvider.export(projectScope),
      },
      run({ reactComponents, typescript }) {
        const [embeddedListImport, embeddedListPath] = makeImportAndFilePath(
          `${reactComponents.getComponentsFolder()}/EmbeddedListInput/index.tsx`,
        );
        reactComponents.registerComponent({ name: 'EmbeddedListInput' });

        const [embeddedObjectImport, embeddedObjectPath] =
          makeImportAndFilePath(
            `${reactComponents.getComponentsFolder()}/EmbeddedObjectInput/index.tsx`,
          );
        reactComponents.registerComponent({ name: 'EmbeddedObjectInput' });

        const [, descriptionListPath] = makeImportAndFilePath(
          `${reactComponents.getComponentsFolder()}/DescriptionList/index.tsx`,
        );
        reactComponents.registerComponent({ name: 'DescriptionList' });

        return {
          providers: {
            adminComponents: {
              getImportMap: () => ({
                '%admin-components': {
                  path: reactComponents.getComponentsImport(),
                  allowedImports: ['EmbeddedListInput', 'EmbeddedObjectInput'],
                },
                '%admin-components/EmbeddedObjectInput': {
                  path: embeddedObjectImport,
                  allowedImports: ['EmbeddedObjectFormProps'],
                },
                '%admin-components/EmbeddedListInput': {
                  path: embeddedListImport,
                  allowedImports: [
                    'EmbeddedListTableProps',
                    'EmbeddedListFormProps',
                  ],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'DescriptionList/index.tsx',
                destination: descriptionListPath,
              }),
            );
            await builder.apply(
              typescript.createCopyAction({
                source: 'EmbeddedListInput/index.tsx',
                destination: embeddedListPath,
              }),
            );
            await builder.apply(
              typescript.createCopyAction({
                source: 'EmbeddedObjectInput/index.tsx',
                destination: embeddedObjectPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
