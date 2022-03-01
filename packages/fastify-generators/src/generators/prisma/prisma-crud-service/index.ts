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
import { appModuleProvider } from '@src/generators/core/root-module';
import { ServiceOutputMethod } from '@src/types/serviceOutput';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
});

export interface PrismaCrudServiceProvider {
  getServiceExpression: () => TypescriptCodeExpression;
  registerMethod(
    key: string,
    expression: TypescriptCodeExpression,
    outputMethod: ServiceOutputMethod
  ): void;
}

export const prismaCrudServiceProvider =
  createProviderType<PrismaCrudServiceProvider>('prisma-crud-service');

export interface PrismaCrudServiceOutputProvider {
  getServiceMethod(key: string): ServiceOutputMethod;
}

export const prismaCrudServiceOutputProvider =
  createProviderType<PrismaCrudServiceOutputProvider>(
    'prisma-crud-service-utput'
  );

const PrismaCrudServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: ({ modelName }) => ({
    create: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'create',
        type: 'create',
        modelName,
      },
    },
    update: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'update',
        type: 'update',
        modelName,
      },
    },
    remove: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/prisma/prisma-crud-method',
        name: 'remove',
        type: 'remove',
        modelName,
      },
    },
  }),
  dependencies: {
    appModule: appModuleProvider,
    typescript: typescriptProvider,
  },
  exports: {
    prismaCrudService: prismaCrudServiceProvider,
    prismaCrudServiceOutput: prismaCrudServiceOutputProvider
      .export()
      .dependsOn(prismaCrudServiceProvider),
  },
  createGenerator(descriptor, { appModule, typescript }) {
    const methodMap = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({}, { name: 'prisma-crud-service-method-map' });
    const outputMap = createNonOverwriteableMap<
      Record<string, ServiceOutputMethod>
    >({}, { name: 'prisma-crud-service-output-map' });
    const servicesFolder = path.join(appModule.getModuleFolder(), 'services');
    const servicesPath = path.join(
      servicesFolder,
      `${paramCase(descriptor.name)}.ts`
    );
    const servicesFile = typescript.createTemplate({
      METHODS: { type: 'code-expression' },
    });
    const serviceName = descriptor.name;

    return {
      getProviders: () => ({
        prismaCrudService: {
          getServiceExpression() {
            return new TypescriptCodeExpression(
              serviceName,
              `import { ${serviceName} } from '${servicesPath}';`
            );
          },
          registerMethod(key, expression, outputMethod) {
            methodMap.set(key, expression);
            outputMap.set(key, outputMethod);
          },
        },
        prismaCrudServiceOutput: {
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
          servicesFile.renderToAction('service.ts', servicesPath, {
            SERVICE_NAME: serviceName,
          })
        );
      },
    };
  },
});

export default PrismaCrudServiceGenerator;
