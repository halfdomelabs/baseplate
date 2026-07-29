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

import { getModelIdFieldName } from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaModelPolicyProvider } from '#src/generators/prisma/prisma-model-authorizer/index.js';
import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  createPothosTypeReference,
  writePothosExposeFieldFromDtoScalarField,
} from '#src/writers/pothos/index.js';

import type { PothosTypeOutputProvider } from '../_providers/index.js';

import {
  pothosFieldScope,
  pothosTypeOutputProvider,
} from '../_providers/index.js';
import { pothosAuthProvider } from '../pothos-auth/index.js';
import { pothosSortOrderProvider } from '../pothos-sort-order/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/index.js';

const exposedFieldSchema = z.object({
  name: z.string().min(1),
  globalRoles: z.array(z.string().min(1)).default([]),
  instanceRoles: z.array(z.string().min(1)).default([]),
  paginated: z.boolean().default(false),
  orderByInputRef: z.string().min(1).optional(),
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
  buildTasks: ({ modelName, exposedFields, order }) => {
    const orderByInputDependencies = Object.fromEntries(
      [
        ...new Set(
          exposedFields.flatMap((field) => field.orderByInputRef ?? []),
        ),
      ].map((ref) => [
        `orderByInput_${ref}`,
        pothosTypeOutputProvider.dependency().reference(ref),
      ]),
    );

    return {
      main: createGeneratorTask({
        dependencies: {
          prismaOutput: prismaOutputProvider,
          pothosTypeFile: pothosTypesFileProvider,
          pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
          pothosAuth: pothosAuthProvider.dependency().optional(),
          sortOrder: pothosSortOrderProvider.dependency().optional(),
          modelPolicy: prismaModelPolicyProvider
            .dependency()
            .optionalReference(modelName),
          ...(orderByInputDependencies as Record<string, never>),
        },
        exports: {
          pothosPrismaObject:
            pothosPrismaObjectProvider.export(pothosFieldScope),
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
          modelPolicy,
          sortOrder,
          ...dynamicDependencies
        }) {
          const orderByInputDependencies = dynamicDependencies as Record<
            string,
            PothosTypeOutputProvider
          >;
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

          // Build lookup: fieldName → paginated flag
          const fieldPaginatedMap = new Map(
            exposedFields
              .filter((f) => f.paginated)
              .map((f) => [f.name, f.paginated]),
          );

          const fieldOrderByInputMap = new Map(
            exposedFields.flatMap((field) => {
              if (!field.orderByInputRef) {
                return [];
              }
              return [
                [
                  field.name,
                  orderByInputDependencies[
                    `orderByInput_${field.orderByInputRef}`
                  ],
                ] as const,
              ];
            }),
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
                if (!modelPolicy) {
                  throw new Error(
                    `Field '${fieldName}' on model '${modelName}' references instance role '${roleName}' but no policy is configured for this model.`,
                  );
                }
                return modelPolicy.getRoleCheckFragment(roleName);
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

              const zFragment = TsCodeUtils.importFragment('z', 'zod');

              const fieldDefinitions = outputDto.fields
                .filter((field) => exposedFieldNames.includes(field.name))
                .map((field) => {
                  const authorize = buildAuthorizeFragment(field.name);
                  const paginated = fieldPaginatedMap.get(field.name) ?? false;
                  const orderByInput = fieldOrderByInputMap.get(field.name);

                  if (paginated && !field.isList) {
                    throw new Error(
                      `Field '${field.name}' on model '${modelName}' is marked paginated but is not a list relation.`,
                    );
                  }

                  if (orderByInput && !field.isList) {
                    throw new Error(
                      `Field '${field.name}' on model '${modelName}' is marked orderable but is not a list relation.`,
                    );
                  }

                  let fragment: string | TsCodeFragment;
                  if (field.type === 'scalar') {
                    fragment = writePothosExposeFieldFromDtoScalarField(field, {
                      schemaBuilder: pothosTypeFile.getBuilderFragment(),
                      fieldBuilder: 't',
                      pothosSchemaBaseTypes,
                      typeReferences: [],
                      authorize,
                    });
                  } else if (
                    authorize ||
                    field.isNullable ||
                    paginated ||
                    orderByInput
                  ) {
                    // Relation with options (nullable, authorize, pagination, and/or ordering)
                    const options: Record<string, string | TsCodeFragment> = {};
                    if (field.isNullable) {
                      options.nullable = 'true';
                    }
                    if (authorize) {
                      options.authorize = authorize;
                    }
                    // Exposing an orderBy arg without the shared helper would
                    // accept the argument and silently ignore it.
                    if (orderByInput && !sortOrder) {
                      throw new Error(
                        `Field '${field.name}' on model '${modelName}' is marked orderable but the sort order generator is not configured.`,
                      );
                    }

                    if (paginated || orderByInput) {
                      const relatedModel = prismaOutput.getPrismaModel(
                        field.nestedType.name,
                      );
                      const idFieldNames = relatedModel.idFields ?? [
                        getModelIdFieldName(relatedModel),
                      ];
                      // Ordering falls back to the ID field(s) so paginated
                      // results stay stable when no sort is requested.
                      const orderByFragment =
                        orderByInput && sortOrder
                          ? tsTemplate`${sortOrder.getApplyStableOrderByFragment()}(args.orderBy, ${JSON.stringify(idFieldNames)}) ?? undefined`
                          : TsCodeUtils.mergeFragmentsAsObject(
                              Object.fromEntries(
                                idFieldNames.map((name) => [name, quot('asc')]),
                              ),
                            );
                      const orderByArg = orderByInput
                        ? tsTemplate`orderBy: t.arg({ type: [${orderByInput.getTypeReference().fragment}] }),`
                        : '';

                      options.args = paginated
                        ? tsTemplate`{
                      skip: t.arg.int({ validate: ${zFragment}.int().min(0) }),
                      take: t.arg.int({ validate: ${zFragment}.int().min(0) }),
                      ${orderByArg}
                    }`
                        : tsTemplate`{
                      ${orderByArg}
                    }`;
                      options.query = paginated
                        ? tsTemplate`(args) => ({ skip: args.skip ?? undefined, take: args.take ?? undefined, orderBy: ${orderByFragment} })`
                        : tsTemplate`(args) => ({ orderBy: ${orderByFragment} })`;
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
    };
  },
});
