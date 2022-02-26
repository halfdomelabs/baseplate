import path from 'path';
import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
});

export interface PrismaCrudServiceProvider {
  getMethodMap(): NonOverwriteableMap<Record<string, TypescriptCodeExpression>>;
}

export const prismaCrudServiceProvider =
  createProviderType<PrismaCrudServiceProvider>('prisma-crud-service');

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
    // update: {
    //   defaultDescriptor: {
    //     generator: '@baseplate/fastify/prisma/prisma-crud-method',
    //     name: 'update',
    //     type: 'update',
    //     modelName,
    //   },
    // },
    // remove: {
    //   defaultDescriptor: {
    //     generator: '@baseplate/fastify/prisma/prisma-crud-method',
    //     name: 'remove',
    //     type: 'remove',
    //     modelName,
    //   },
    // },
  }),
  dependencies: {
    appModule: appModuleProvider,
  },
  exports: {
    prismaCrudService: prismaCrudServiceProvider,
  },
  createGenerator(descriptor, { appModule }) {
    const methodMap = createNonOverwriteableMap(
      {},
      { name: 'prisma-crud-service-method-map' }
    );
    const servicesFolder = path.join(appModule.getModuleFolder(), 'services');
    const servicesPath = path.join(
      servicesFolder,
      `${paramCase(descriptor.name)}.ts`
    );
    const servicesFile = new TypescriptSourceFile({
      METHODS: { type: 'code-expression' },
    });

    return {
      getProviders: () => ({
        prismaCrudService: {
          getMethodMap: () => methodMap,
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
            SERVICE_NAME: descriptor.name,
          })
        );
      },
    };
  },
});

export default PrismaCrudServiceGenerator;
