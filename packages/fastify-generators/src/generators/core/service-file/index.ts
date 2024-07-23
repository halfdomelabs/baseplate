import {
  makeImportAndFilePath,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { paramCase } from 'change-case';
import path from 'path';
import { z } from 'zod';

import { appModuleProvider } from '../root-module/index.js';
import { ServiceOutputMethod } from '@src/types/serviceOutput.js';
import { notEmpty } from '@src/utils/array.js';

const descriptorSchema = z.object({
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
  createProviderType<ServiceFileOutputProvider>('service-file-output');

export const ServiceFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    const mainTask = taskBuilder.addTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
        typescript: typescriptProvider,
      },
      exports: { serviceFile: serviceFileProvider },
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
            `${descriptor.fileName ?? paramCase(descriptor.name)}.ts`,
          ),
        );

        return {
          getProviders: () => ({
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
          }),
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

            if (Object.keys(methodMap.value()).length) {
              await builder.apply(
                servicesFile.renderToActionFromText('METHODS;', servicesPath),
              );
            }
            return { outputMap };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'output',
      exports: { serviceFileOutput: serviceFileOutputProvider },
      taskDependencies: { mainTask },
      run(deps, { mainTask: { outputMap } }) {
        return {
          getProviders: () => ({
            serviceFileOutput: {
              getServiceMethod(key) {
                const output = outputMap.get(key);
                if (!output) {
                  throw new Error(`No output method found for key ${key}`);
                }
                return output;
              },
            },
          }),
        };
      },
    });
  },
});

export default ServiceFileGenerator;
