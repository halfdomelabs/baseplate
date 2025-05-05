import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  tsCodeFileTemplate,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { notEmpty } from '@halfdomelabs/utils';
import { kebabCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import type { ServiceOutputMethod } from '@src/types/service-output.js';

import { appModuleProvider } from '../app-module/app-module.generator.js';

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
  getMethodImport: (methodName: string) => TsImportDeclaration;
  registerMethod(
    key: string,
    block: TsCodeFragment,
    outputMethod?: ServiceOutputMethod,
  ): void;
}

export const serviceFileProvider =
  createProviderType<ServiceFileProvider>('service-file');

export interface ServiceFileOutputProvider {
  getServiceMethod(key: string): ServiceOutputMethod;
}

export const serviceFileOutputProvider =
  createReadOnlyProviderType<ServiceFileOutputProvider>('service-file-output');

export const serviceFileGenerator = createGenerator({
  name: 'core/service-file',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: { serviceFile: serviceFileProvider.export() },
      outputs: {
        serviceFileOutput: descriptor.id
          ? serviceFileOutputProvider.export(projectScope, descriptor.id)
          : serviceFileOutputProvider.export(),
      },
      run({ appModule, typescriptFile }) {
        const methodMap = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
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
              getMethodImport: (methodName) =>
                tsImportBuilder([methodName]).from(servicesImport),
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

            const template = tsCodeFileTemplate({
              name: 'service-file',
              source: { contents: 'TPL_METHODS' },
              variables: {
                TPL_METHODS: {},
              },
            });

            if (Object.keys(methodMap.value()).length > 0) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  id:
                    descriptor.id ??
                    kebabCase(descriptor.name.replace(/\.ts$/, '')),
                  template,
                  destination: servicesPath,
                  variables: {
                    TPL_METHODS: TsCodeUtils.mergeFragmentsPresorted(
                      orderedMethods,
                      '\n\n',
                    ),
                  },
                }),
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
  }),
});
