import path from 'path';
import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { paramCase } from 'change-case';
import { z } from 'zod';
import { ServiceOutputMethod } from '@src/types/serviceOutput';
import { notEmpty } from '@src/utils/array';
import { lowerCaseFirst } from '@src/utils/case';
import { appModuleProvider } from '../root-module';

const descriptorSchema = z.object({
  name: z.string().min(1),
  methodOrder: z.array(z.string()).optional(),
});

export interface ServiceFileProvider {
  getServiceImport: () => string;
  getServiceExpression: () => TypescriptCodeExpression;
  getServiceName: () => string;
  registerMethod(
    key: string,
    expression: TypescriptCodeExpression,
    outputMethod?: ServiceOutputMethod
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
          Record<string, TypescriptCodeExpression>
        >({}, { name: 'prisma-crud-service-method-map' });
        const outputMap = createNonOverwriteableMap<
          Record<string, ServiceOutputMethod>
        >({}, { name: 'prisma-crud-service-output-map' });
        const servicesFolder = path.join(
          appModule.getModuleFolder(),
          'services'
        );
        const servicesImport = path.join(
          servicesFolder,
          `${paramCase(descriptor.name)}`
        );
        const servicesPath = `${servicesImport}.ts`;
        const servicesFile = typescript.createTemplate({
          METHODS: { type: 'code-expression' },
          SERVICE_NAME: { type: 'code-expression' },
        });
        const serviceName = lowerCaseFirst(descriptor.name);

        return {
          getProviders: () => ({
            serviceFile: {
              getServiceImport: () => `@/${servicesImport}`,
              getServiceExpression() {
                return new TypescriptCodeExpression(
                  serviceName,
                  `import { ${serviceName} } from '@/${servicesImport}';`
                );
              },
              getServiceName: () => serviceName,
              registerMethod(key, expression, outputMethod) {
                methodMap.set(key, expression);
                if (outputMethod) {
                  outputMap.set(key, outputMethod);
                }
              },
            },
          }),
          build: async (builder) => {
            const methods = methodMap.value();
            const methodOrder = descriptor.methodOrder || [];
            const orderedMethods = [
              ...methodOrder.map((key) => methods[key]).filter(notEmpty),
              ...Object.keys(methods)
                .filter((m) => !methodOrder.includes(m))
                .map((key) => methods[key]),
            ];

            servicesFile.addCodeEntries({
              SERVICE_NAME: serviceName,
              METHODS: TypescriptCodeUtils.mergeExpressions(
                orderedMethods,
                ',\n\n'
              ).wrap((c) => `{${c}}`),
            });
            if (Object.keys(methodMap.value()).length) {
              await builder.apply(
                servicesFile.renderToActionFromText(
                  'export const SERVICE_NAME = METHODS;',
                  servicesPath
                )
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
