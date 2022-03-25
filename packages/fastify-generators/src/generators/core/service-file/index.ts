import path from 'path';
import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import * as yup from 'yup';
import { ServiceOutputMethod } from '@src/types/serviceOutput';
import { appModuleProvider } from '../root-module';

const descriptorSchema = yup.object({
  name: yup.string().required(),
});

export interface ServiceFileProvider {
  getServiceExpression: () => TypescriptCodeExpression;
  registerMethod(
    key: string,
    expression: TypescriptCodeExpression,
    outputMethod: ServiceOutputMethod
  ): void;
}

export const serviceFileProvider =
  createProviderType<ServiceFileProvider>('service-file');

export interface ServiceFileOutputProvider {
  getServiceMethod(key: string): ServiceOutputMethod;
}

export const serviceFileOutputProvider =
  createProviderType<ServiceFileOutputProvider>('service-file-output');

const ServiceFileGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    typescript: typescriptProvider,
  },
  exports: {
    serviceFile: serviceFileProvider,
    serviceFileOutput: serviceFileOutputProvider,
  },
  createGenerator(descriptor, { appModule, typescript }) {
    const methodMap = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({}, { name: 'prisma-crud-service-method-map' });
    const outputMap = createNonOverwriteableMap<
      Record<string, ServiceOutputMethod>
    >({}, { name: 'prisma-crud-service-output-map' });
    const servicesFolder = path.join(appModule.getModuleFolder(), 'services');
    const servicesImport = path.join(
      servicesFolder,
      `${paramCase(descriptor.name)}`
    );
    const servicesPath = `${servicesImport}.ts`;
    const servicesFile = typescript.createTemplate({
      METHODS: { type: 'code-expression' },
    });
    const serviceName = descriptor.name;

    return {
      getProviders: () => ({
        serviceFile: {
          getServiceExpression() {
            return new TypescriptCodeExpression(
              serviceName,
              `import { ${serviceName} } from '@/${servicesImport}';`
            );
          },
          registerMethod(key, expression, outputMethod) {
            methodMap.set(key, expression);
            outputMap.set(key, outputMethod);
          },
        },
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
      build: async (builder) => {
        servicesFile.addCodeExpression(
          'METHODS',
          TypescriptCodeUtils.mergeExpressions(
            Object.values(methodMap.value()),
            ',\n'
          ).wrap((c) => `{${c}}`)
        );
        await builder.apply(
          servicesFile.renderToActionFromText(
            'export const SERVICE_NAME = METHODS;',
            servicesPath,
            {
              SERVICE_NAME: serviceName,
            }
          )
        );
      },
    };
  },
});

export default ServiceFileGenerator;
