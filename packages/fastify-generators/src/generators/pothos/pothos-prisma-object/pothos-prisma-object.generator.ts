import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { prismaModelAuthorizerProvider } from '#src/generators/prisma/prisma-model-authorizer/index.js';
import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  createPothosTypeReference,
  writePothosExposeFieldFromDtoScalarField,
} from '#src/writers/pothos/index.js';

import {
  pothosFieldScope,
  pothosTypeOutputProvider,
} from '../_providers/index.js';
import { pothosAuthProvider } from '../pothos-auth/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/index.js';

const exposedFieldSchema = z.object({
  name: z.string().min(1),
  globalRoles: z.array(z.string().min(1)).default([]),
  instanceRoles: z.array(z.string().min(1)).default([]),
});

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The fields to expose, with optional per-field auth config.
   */
  exposedFields: z.array(exposedFieldSchema),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
});

export interface PothosPrismaObjectProvider {
  addCustomField: (name: string, expression: TsCodeFragment) => void;
}

export const pothosPrismaObjectProvider =
  createProviderType<PothosPrismaObjectProvider>('pothos-prisma-object');

export function createPothosPrismaObjectTypeOutputName(
  modelName: string,
): string {
  return `prisma-object-type:${modelName}`;
}

export const pothosPrismaObjectGenerator = createGenerator({
  name: 'pothos/pothos-prisma-object',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, exposedFields, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
        pothosAuth: pothosAuthProvider.dependency().optional(),
        modelAuthorizer: prismaModelAuthorizerProvider
          .dependency()
          .optionalReference(modelName),
      },
      exports: {
        pothosPrismaObject: pothosPrismaObjectProvider.export(pothosFieldScope),
        pothosTypeOutput: pothosTypeOutputProvider.export(
          packageScope,
          createPothosPrismaObjectTypeOutputName(modelName),
        ),
      },
      run({
        prismaOutput,
        pothosTypeFile,
        pothosSchemaBaseTypes,
        pothosAuth,
        modelAuthorizer,
      }) {
        const model = prismaOutput.getPrismaModel(modelName);

        const variableName = `${lowerCaseFirst(model.name)}ObjectType`;

        const customFields = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({});

        // Build lookup: fieldName → auth config
        const fieldAuthMap = new Map(
          exposedFields
            .filter(
              (f) => f.globalRoles.length > 0 || f.instanceRoles.length > 0,
            )
            .map((f) => [
              f.name,
              { globalRoles: f.globalRoles, instanceRoles: f.instanceRoles },
            ]),
        );

        /**
         * Build an authorize TsCodeFragment for a field, if it has auth config.
         */
        function buildAuthorizeFragment(
          fieldName: string,
        ): TsCodeFragment | undefined {
          const fieldAuth = fieldAuthMap.get(fieldName);
          if (!fieldAuth || !pothosAuth) {
            return undefined;
          }

          const instanceRoleFragments = fieldAuth.instanceRoles.map(
            (roleName) => {
              if (!modelAuthorizer) {
                throw new Error(
                  `Field '${fieldName}' on model '${modelName}' references instance role '${roleName}' but no authorizer is configured for this model.`,
                );
              }
              return modelAuthorizer.getRoleFragment(roleName);
            },
          );

          if (
            fieldAuth.globalRoles.length === 0 &&
            instanceRoleFragments.length === 0
          ) {
            return undefined;
          }

          return pothosAuth.formatMixedAuthorizeConfig({
            globalRoles: fieldAuth.globalRoles,
            instanceRoleFragments,
          });
        }

        return {
          providers: {
            pothosPrismaObject: {
              addCustomField: (name, expression) => {
                customFields.set(name, expression);
              },
            },
            pothosTypeOutput: {
              getTypeReference: () =>
                createPothosTypeReference({
                  name: model.name,
                  exportName: variableName,
                  moduleSpecifier: pothosTypeFile.getModuleSpecifier(),
                }),
            },
          },
          build: () => {
            const outputDto = prismaToServiceOutputDto(model, (enumName) =>
              prismaOutput.getServiceEnum(enumName),
            );

            const exposedFieldNames = exposedFields.map((f) => f.name);

            const missingField = exposedFieldNames.find(
              (exposedFieldName) =>
                !outputDto.fields.some(
                  (field) => field.name === exposedFieldName,
                ),
            );

            if (missingField) {
              throw new Error(
                `Field ${missingField} not found in model ${model.name}`,
              );
            }

            const fieldDefinitions = outputDto.fields
              .filter((field) => exposedFieldNames.includes(field.name))
              .map((field) => {
                const authorize = buildAuthorizeFragment(field.name);

                let fragment: string | TsCodeFragment;
                if (field.type === 'scalar') {
                  fragment = writePothosExposeFieldFromDtoScalarField(field, {
                    schemaBuilder: pothosTypeFile.getBuilderFragment(),
                    fieldBuilder: 't',
                    pothosSchemaBaseTypes,
                    typeReferences: [],
                    authorize,
                  });
                } else if (authorize || field.isNullable) {
                  // Relation with options (nullable and/or authorize)
                  const options: Record<string, string | TsCodeFragment> = {};
                  if (field.isNullable) {
                    options.nullable = 'true';
                  }
                  if (authorize) {
                    options.authorize = authorize;
                  }
                  fragment = tsTemplate`t.relation(${quot(field.name)}, ${TsCodeUtils.mergeFragmentsAsObject(options)})`;
                } else {
                  // Simple relation with no options
                  fragment = `t.relation('${field.name}')`;
                }

                return { name: field.name, fragment };
              });

            const objectTypeBlock = TsCodeUtils.formatFragment(
              `export const VARIABLE_NAME = BUILDER.prismaObject(MODEL_NAME, {
              fields: (t) => (FIELDS)
            });`,
              {
                VARIABLE_NAME: variableName,
                BUILDER: pothosTypeFile.getBuilderFragment(),
                MODEL_NAME: quot(model.name),
                FIELDS: TsCodeUtils.mergeFragmentsAsObject(
                  {
                    ...Object.fromEntries(
                      fieldDefinitions.map((fieldDefinition) => [
                        fieldDefinition.name,
                        fieldDefinition.fragment,
                      ]),
                    ),
                    ...customFields.value(),
                  },
                  { disableSort: true },
                ),
              },
            );

            pothosTypeFile.typeDefinitions.add({
              name: model.name,
              fragment: objectTypeBlock,
              order,
            });
          },
        };
      },
    }),
  }),
});
