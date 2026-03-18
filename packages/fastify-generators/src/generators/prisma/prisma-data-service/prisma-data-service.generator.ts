import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTaskWithInfo,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import {
  compareStrings,
  lowercaseFirstChar,
  NamedArrayFieldContainer,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import type { PrismaOutputScalarField } from '#src/types/prisma-output.js';
import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { serviceFileProvider } from '#src/generators/core/index.js';

import type { InputFieldDefinitionOutput } from '../_shared/field-definition-generators/types.js';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import { generateScalarInputField } from '../_shared/field-definition-generators/generate-scalar-input-field.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  modelFieldNames: z.array(z.string()),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const [
  createPrismaDataServiceTask,
  prismaDataServiceSetupProvider,
  prismaDataServiceValuesProvider,
] = createConfigProviderTaskWithInfo(
  (t) => ({
    /** Additional model field names to add to the data service */
    additionalModelFieldNames: t.array<string>([]),
    /** Transform field definitions to add to the data service (file, nested) */
    transformFields: t.namedArray<InputFieldDefinitionOutput>([]),
  }),
  {
    prefix: 'prisma-data-service',
    configScope: (provider, descriptor) =>
      provider.export().andExport(packageScope, descriptor.modelName),
    infoFromDescriptor: (descriptor: Descriptor) => ({
      modelName: descriptor.modelName,
    }),
  },
);

export { prismaDataServiceSetupProvider };

interface PrismaDataServiceMethod {
  name: string;
  type: 'create' | 'update' | 'delete';
  fragment: TsCodeFragment;
  outputMethod: ServiceOutputMethod;
}

/**
 * Provider interface for the prisma data service.
 * Other generators (create, update, delete, nested) use this to access
 * field information and register their methods.
 */
export interface PrismaDataServiceProvider {
  /** All input fields (scalar + transform) */
  getFields(): InputFieldDefinitionOutput[];
  /** Only scalar fields (for Zod schema entries) */
  getScalarFields(): InputFieldDefinitionOutput[];
  /** Only transform fields (for the transformers object) */
  getTransformFields(): InputFieldDefinitionOutput[];
  /** Whether the model has any transform fields */
  hasTransformFields(): boolean;
  /** Variable name for field schemas, e.g. "todoListFieldSchemas" */
  getFieldSchemasVariableName(): string;
  /** Variable name for transformers object, e.g. "todoListTransformers" (undefined if no transforms) */
  getTransformersVariableName(): string | undefined;
  /** Register a create/update/delete method to be added to the service file */
  registerMethod(method: PrismaDataServiceMethod): void;
}

export const prismaDataServiceProvider =
  createProviderType<PrismaDataServiceProvider>('prisma-data-service');

const TYPE_TO_ORDER: Record<PrismaDataServiceMethod['type'], number> = {
  create: 1,
  update: 2,
  delete: 3,
};

/**
 * Generator for prisma/prisma-data-service
 *
 * Emits the data service file with:
 * - Field schemas object (Zod entries for all fields)
 * - Create/update Zod schemas
 * - Transformers object (only if model has transform fields)
 * - Create/update/delete methods (registered by other generators)
 */
export const prismaDataServiceGenerator = createGenerator({
  name: 'prisma/prisma-data-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    config: createPrismaDataServiceTask(descriptor),
    main: createGeneratorTask({
      dependencies: {
        configValues: prismaDataServiceValuesProvider,
        prismaOutput: prismaOutputProvider,
        serviceFile: serviceFileProvider,

        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      exports: {
        prismaDataService: prismaDataServiceProvider
          .export()
          .andExport(packageScope, descriptor.modelName),
      },
      run({ configValues, prismaOutput, serviceFile, prismaGeneratedImports }) {
        const { modelName, modelFieldNames } = descriptor;
        const model = prismaOutput.getPrismaModel(modelName);
        const {
          transformFields: configTransformFields,
          additionalModelFieldNames,
        } = configValues;
        const modelScalarFields = model.fields.filter(
          (f): f is PrismaOutputScalarField => f.type === 'scalar',
        );

        const modelScalarFieldNames = new Set([
          ...modelFieldNames,
          ...additionalModelFieldNames,
        ]);

        const invalidModelFieldNames = modelFieldNames.filter(
          (fieldName) => !modelScalarFieldNames.has(fieldName),
        );
        if (invalidModelFieldNames.length > 0) {
          throw new Error(
            `Fields ${invalidModelFieldNames.join(', ')} are not scalar fields in model ${modelName}`,
          );
        }

        // Check if modelFields and transform fields overlap
        const overlappingFields = configTransformFields.filter((field) =>
          modelScalarFieldNames.has(field.name),
        );
        if (overlappingFields.length > 0) {
          throw new Error(
            `Fields ${overlappingFields.map((field) => field.name).join(', ')} overlap with model fields`,
          );
        }

        const methods = new NamedArrayFieldContainer<PrismaDataServiceMethod>();

        // Build all input fields (scalar + transform)
        const allFields: InputFieldDefinitionOutput[] = [
          // Scalar fields — preserve order of model fields
          ...modelScalarFields
            .filter((f) => modelScalarFieldNames.has(f.name))
            .map((field) =>
              generateScalarInputField({
                fieldName: field.name,
                scalarField: field,
                prismaGeneratedImports,
                lookupEnum: (name) => prismaOutput.getServiceEnum(name),
              }),
            ),
          // Transform fields — sorted alphabetically
          ...configTransformFields.toSorted((a, b) =>
            compareStrings(a.name, b.name),
          ),
        ];

        const scalarFields = allFields.filter((f) => !f.isTransformField);
        const transformFields = allFields.filter((f) => f.isTransformField);

        // Build the field schemas object: { field: z.string(), ... }
        const fieldSchemasObject = TsCodeUtils.mergeFragmentsAsObject(
          Object.fromEntries(
            allFields.map((field) => [field.name, field.schemaFragment]),
          ),
          { disableSort: true },
        );

        const fieldSchemasVarName = `${lowercaseFirstChar(modelName)}FieldSchemas`;
        const createSchemaVarName = `${lowercaseFirstChar(modelName)}CreateSchema`;
        const updateSchemaVarName = `${lowercaseFirstChar(modelName)}UpdateSchema`;
        const transformersVarName =
          transformFields.length > 0
            ? `${lowercaseFirstChar(modelName)}Transformers`
            : undefined;

        const zFrag = TsCodeUtils.importFragment('z', 'zod');

        return {
          providers: {
            prismaDataService: {
              getFields: () => allFields,
              getScalarFields: () => scalarFields,
              getTransformFields: () => transformFields,
              hasTransformFields: () => transformFields.length > 0,
              getFieldSchemasVariableName: () => fieldSchemasVarName,
              getTransformersVariableName: () => transformersVarName,
              registerMethod(method) {
                methods.add(method);
              },
            },
          },
          build: () => {
            // Register field schemas (names are sorted alphabetically by serviceFile)
            serviceFile.registerHeader({
              name: 'schemas-1-fields',
              fragment: tsTemplate`const ${fieldSchemasVarName} = ${fieldSchemasObject};`,
            });

            serviceFile.registerHeader({
              name: 'schemas-2-create',
              fragment: tsTemplate`export const ${createSchemaVarName} = ${zFrag}.object(${fieldSchemasVarName});`,
            });
            serviceFile.registerHeader({
              name: 'schemas-3-update',
              fragment: tsTemplate`export const ${updateSchemaVarName} = ${zFrag}.object(${fieldSchemasVarName}).partial();`,
            });

            // Register transformers object (only if there are transform fields)
            if (transformersVarName && transformFields.length > 0) {
              const transformerEntries = transformFields
                .filter(
                  (
                    field,
                  ): field is InputFieldDefinitionOutput & {
                    transformer: NonNullable<
                      InputFieldDefinitionOutput['transformer']
                    >;
                  } => field.transformer != null,
                )
                .map((field) => [field.name, field.transformer.fragment]);
              const transformersObject = TsCodeUtils.mergeFragmentsAsObject(
                Object.fromEntries(transformerEntries),
              );
              serviceFile.registerHeader({
                name: 'transformers',
                fragment: tsTemplate`const ${transformersVarName} = ${transformersObject};`,
              });
            }

            for (const method of methods.getValue()) {
              serviceFile.registerMethod({
                name: method.name,
                order: TYPE_TO_ORDER[method.type],
                fragment: method.fragment,
                outputMethod: method.outputMethod,
              });
            }
          },
        };
      },
    }),
  }),
});
