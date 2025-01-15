import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';

const descriptorSchema = z.object({});

export type AdminComponentsProvider = ImportMapper;

export const adminComponentsProvider =
  createProviderType<AdminComponentsProvider>('admin-components');

export const adminComponentsGenerator = createGenerator({
  name: 'admin/admin-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
        node: nodeProvider,
      },
      exports: {
        adminComponents: adminComponentsProvider.export(projectScope),
      },
      run({ reactComponents, typescript, node }) {
        node.addPackages({
          nanoid: '3.3.8',
        });

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
    });
  },
});
