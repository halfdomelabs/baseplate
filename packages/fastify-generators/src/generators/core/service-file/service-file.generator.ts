import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '@baseplate-dev/core-generators';

import {
  mergeFragmentsWithHoistedFragmentsPresorted,
  packageScope,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { NamedArrayFieldContainer } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { kebabCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { appModuleProvider } from '../app-module/index.js';

const descriptorSchema = z.object({
  /**
   * The unique identifier for the service file.
   */
  id: z.string(),
  /**
   * The name of the service file.
   */
  name: z.string().min(1),
  /**
   * The file name of the service file.
   */
  fileName: z.string().optional(),
});

/**
 * A method that is registered with the service file.
 */
interface ServiceMethod {
  /**
   * The order of the method in the service file.
   */
  order: number;
  /**
   * The name of the method.
   */
  name: string;
  /**
   * The fragment of code that implements the method.
   */
  fragment: TsCodeFragment;
  /**
   * The service output data that can be consumed by other generators.
   */
  outputMethod?: ServiceOutputMethod;
}

export interface ServiceFileProvider {
  /**
   * Get the canonical path to the service file.
   */
  getServicePath: () => string;
  /**
   * Get the import declaration for a method.
   */
  getMethodImport: (methodName: string) => TsImportDeclaration;
  /**
   * Register a method with the service file.
   */
  registerMethod(method: ServiceMethod): void;
  /**
   * Register a header typescript code fragment.
   */
  registerHeader(header: { name: string; fragment: TsCodeFragment }): void;
}

export const serviceFileProvider =
  createProviderType<ServiceFileProvider>('service-file');

export interface ServiceFileOutputProvider {
  getServiceMethod(name: string): ServiceOutputMethod;
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
          ? serviceFileOutputProvider.export(packageScope, descriptor.id)
          : serviceFileOutputProvider.export(),
      },
      run({ appModule, typescriptFile }) {
        const methodsContainer = new NamedArrayFieldContainer<ServiceMethod>();
        const headersContainer = new NamedArrayFieldContainer<{
          name: string;
          fragment: TsCodeFragment;
        }>();
        const servicesFolder = path.join(
          appModule.getModuleFolder(),
          'services',
        );
        const servicesPath = posixJoin(
          servicesFolder,
          `${descriptor.fileName ?? kebabCase(descriptor.name)}.ts`,
        );

        return {
          providers: {
            serviceFile: {
              getServicePath: () => servicesPath,
              getMethodImport: (methodName) =>
                tsImportBuilder([methodName]).from(servicesPath),
              registerMethod(method) {
                methodsContainer.add(method);
              },
              registerHeader(header) {
                headersContainer.add(header);
              },
            },
          },
          build: async (builder) => {
            const orderedHeaders = headersContainer
              .getValue()
              .sort((a, b) => a.name.localeCompare(b.name));
            const orderedMethods = methodsContainer
              .getValue()
              .sort((a, b) => a.order - b.order);

            if (orderedMethods.length > 0) {
              const mergedMethods = mergeFragmentsWithHoistedFragmentsPresorted(
                [
                  ...orderedHeaders.map((h) => h.fragment),
                  ...orderedMethods.map((m) => m.fragment),
                ],
              );
              await builder.apply(
                typescriptFile.renderTemplateFragment({
                  id: descriptor.id,
                  fragment: mergedMethods,
                  destination: servicesPath,
                }),
              );
            }
            return {
              serviceFileOutput: {
                getServiceMethod(name) {
                  const output = orderedMethods.find((m) => m.name === name);
                  if (!output?.outputMethod) {
                    throw new Error(`No output method found with name ${name}`);
                  }
                  return output.outputMethod;
                },
              },
            };
          },
        };
      },
    }),
  }),
});
