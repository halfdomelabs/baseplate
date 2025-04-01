import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createOutputProviderType,
  createProviderType,
} from '@halfdomelabs/sync';
import { kebabCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import type { ServiceOutputMethod } from '@src/types/service-output.js';

import { notEmpty } from '@src/utils/array.js';

import { appModuleProvider } from '../root-module/index.js';

const descriptorSchema = z.object({
  // unique identifier for the service file to allow it to be referenced by other generators
  id: z.string().optional(),
  name: z.string().min(1),
  methodOrder: z.array(z.string()).optional(),
  fileName: z.string().optional(),
});

export interface ServiceFileProvider {
  getServiceImport: () => string;
  getServicePath: () => string;
  registerMethod(
    key: string,
    block: TypescriptCodeBlock,
    outputMethod?: ServiceOutputMethod,
  ): void;
}

export const serviceFileProvider =
  createProviderType<ServiceFileProvider>('service-file');

export interface ServiceFileOutputProvider {
  getServiceMethod(key: string): ServiceOutputMethod;
}

export const serviceFileOutputProvider =
  createOutputProviderType<ServiceFileOutputProvider>('service-file-output');

export const serviceFileGenerator = createGenerator({
  name: 'core/service-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
        typescript: typescriptProvider,
      },
      exports: { serviceFile: serviceFileProvider.export() },
      outputs: {
        serviceFileOutput: descriptor.id
          ? serviceFileOutputProvider.export(projectScope, descriptor.id)
          : serviceFileOutputProvider.export(),
      },
      run({ appModule, typescript }) {
        const methodMap = createNonOverwriteableMap<
          Record<string, TypescriptCodeBlock>
        >({}, { name: 'prisma-crud-service-method-map' });
        const outputMap = createNonOverwriteableMap<
          Record<string, ServiceOutputMethod>
        >({}, { name: 'prisma-crud-service-output-map' });
        const servicesFolder = path.join(
          appModule.getModuleFolder(),
          'services',
        );
        const [servicesImport, servicesPath] = makeImportAndFilePath(
          path.join(
            servicesFolder,
            `${descriptor.fileName ?? kebabCase(descriptor.name)}.ts`,
          ),
        );

        return {
          providers: {
            serviceFile: {
              getServiceImport: () => servicesImport,
              getServicePath: () => servicesPath,
              registerMethod(key, block, outputMethod) {
                methodMap.set(key, block);
                if (outputMethod) {
                  outputMap.set(key, outputMethod);
                }
              },
            },
          },
          build: async (builder) => {
            const methods = methodMap.value();
            const methodOrder = descriptor.methodOrder ?? [];
            const orderedMethods = [
              ...methodOrder.map((key) => methods[key]).filter(notEmpty),
              ...Object.keys(methods)
                .filter((m) => !methodOrder.includes(m))
                .map((key) => methods[key]),
            ];

            const servicesFile = typescript.createTemplate({
              METHODS: TypescriptCodeUtils.mergeBlocks(orderedMethods, '\n\n'),
            });

            if (Object.keys(methodMap.value()).length > 0) {
              await builder.apply(
                servicesFile.renderToActionFromText('METHODS;', servicesPath),
              );
            }
            return {
              serviceFileOutput: {
                getServiceMethod(key) {
                  const output = outputMap.get(key);
                  if (!output) {
                    throw new Error(`No output method found for key ${key}`);
                  }
                  return output;
                },
              },
            };
          },
        };
      },
    }),
  ],
});
