import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';
import { serviceFileProvider } from '#src/generators/core/index.js';
import {
  contextKind,
  prismaQueryKind,
  prismaWhereUniqueInputKind,
} from '#src/types/service-dto-kinds.js';
import {
  createServiceOutputDtoInjectedArg,
  prismaToServiceOutputDto,
} from '#src/types/service-output.js';

import { authorizerUtilsImportsProvider } from '../../auth/_providers/authorizer-utils-imports.js';
import { serviceContextImportsProvider } from '../../core/service-context/generated/ts-import-providers.js';
import { buildTransformOperationParts } from '../_shared/build-data-helpers/build-transform-operation-parts.js';
import { generateAuthorizationStatements } from '../_shared/build-data-helpers/generate-authorization-statements.js';
import { generateWhereType } from '../_shared/build-data-helpers/generate-where-type.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import { prismaModelPolicyProvider } from '../prisma-model-authorizer/index.js';
import {
  prismaImportsProvider,
  prismaOutputProvider,
} from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  fields: z.array(z.string().min(1)),
  globalRoles: z.array(z.string().min(1)).optional(),
  instanceRoles: z.array(z.string().min(1)).optional(),
});

/**
 * Generator for prisma/prisma-data-update
 *
 * Generates an update function that:
 * - Loads existing item (always, for authorization and/or transform fields)
 * - Checks authorization (global and/or instance)
 * - For scalar-only models: calls prisma.model.update directly
 * - For models with transformers: uses prepareTransformers + executeTransformPlan
 */
export const prismaDataUpdateGenerator = createGenerator({
  name: 'prisma/prisma-data-update',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, fields, globalRoles, instanceRoles }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaImports: prismaImportsProvider,
        authorizerImports: authorizerUtilsImportsProvider,
        errorHandlerImports: errorHandlerServiceImportsProvider,
        serviceContextImports: serviceContextImportsProvider,
        modelPolicy: prismaModelPolicyProvider
          .dependency()
          .optionalReference(modelName),
      },
      run({
        serviceFile,
        prismaDataService,
        dataUtilsImports,
        prismaOutput,
        prismaImports,
        authorizerImports,
        errorHandlerImports,
        serviceContextImports,
        modelPolicy,
      }) {
        const serviceFields = prismaDataService.getFields();
        const usedFields = serviceFields.filter((field) =>
          fields.includes(field.name),
        );
        if (usedFields.length !== fields.length) {
          throw new Error(
            `Fields ${fields.filter((field) => !usedFields.some((f) => f.name === field)).join(', ')} not found in service fields`,
          );
        }

        prismaDataService.registerUpdateFieldNames(
          usedFields.map((f) => f.name),
        );

        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);
            const prismaModel = prismaOutput.getPrismaModel(modelName);
            const transformersVarName =
              prismaDataService.getTransformersVariableName() ?? '';

            // Use shared helper for field categorization, destructure, and data building
            const parts = buildTransformOperationParts({
              fields: usedFields,
              prismaModel,
              dataUtilsImports,
              operationType: 'update',
              transformersVarFragment: transformersVarName,
              existingItemVarName: 'existingItem',
            });
            const { hasTransformFields } = parts;

            // Generate authorization
            const { fragment: authFragment, hasInstanceAuth } =
              generateAuthorizationStatements({
                modelName,
                methodType: 'Update',
                globalRoles,
                instanceRoles,
                modelPolicy,
                authorizerImports,
              });

            const hasTransformNeedingExistingItem = usedFields.some(
              (f) => f.transformer?.needsExistingItem === true,
            );

            const hasPolicy = modelPolicy != null;
            const hasAnyGrant =
              hasInstanceAuth ||
              (globalRoles != null && globalRoles.length > 0);

            const hasGlobalGrant =
              globalRoles != null && globalRoles.length > 0;

            // A policy-backed update routes authorization through the policy:
            // - Scalar path (any grant): fold the grant into the `update` call via
            //   `policy.update.whereUnique` — one query both authorizes and mutates.
            //   Instance grants filter per row (→ 404 on miss); global-only grants
            //   pass admins untouched and throw 403 for others, before the query.
            // - Transform + INSTANCE grant: the row must be fetched anyway, so fold
            //   the grant into that `findUniqueOrThrow`.
            // - Transform + GLOBAL-ONLY grant: a row-less principal check —
            //   `policy.update.checkGlobalRoles` (zero-query; routing it through a
            //   fetch would add a query purely to check a principal).
            const usesAtomicAuth =
              hasAnyGrant && !hasTransformFields && hasPolicy;
            const usesAuthedFetch =
              hasInstanceAuth && hasTransformFields && hasPolicy;
            const usesTransformGate =
              hasGlobalGrant &&
              !hasInstanceAuth &&
              hasTransformFields &&
              hasPolicy;

            // Fetch the row when the transform needs it, or when the transform
            // path authorizes through a fetch. The auth-fetch variant composes
            // the grant into the selector and maps P2025 → 404.
            const needsFetch =
              usesAuthedFetch || hasTransformNeedingExistingItem;
            const fetchWhereEntry = usesAuthedFetch
              ? tsTemplate`where: ${modelPolicy.getActionWhereUniqueFragment('update')}(context, where)`
              : 'where';
            const fetchCatchFragment = usesAuthedFetch
              ? tsTemplate`.catch(${errorHandlerImports.throwIfPrismaNotFound.fragment()}(${quot(`${modelName} not found`)}))`
              : '';
            // Bind `existingItem` only when a transform reads it. When the fetch
            // exists purely to authorize (the transform loads its own state), emit
            // it as a bare assertion — no unused binding.
            const bindsExistingItem = hasTransformNeedingExistingItem;
            const fetchPrefix = bindsExistingItem
              ? tsTemplate`const existingItem = `
              : "// Authorize: throws 404 if the caller can't update this row.\n";
            const existingItemFragment = needsFetch
              ? tsTemplate`${fetchPrefix}await ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ ${fetchWhereEntry} })${fetchCatchFragment};`
              : '';

            // Auth statement for the transform path: `checkGlobalRoles` when a
            // policy exists for a global-only grant; otherwise the helper's
            // fragment (`checkGlobalAuthorization` for a policy-less model, or the
            // instance `checkInstanceAuthorization` — though instance transform
            // grants are carried by `usesAuthedFetch` and emit nothing here). The
            // scalar/authed-fetch atomic forms carry the grant themselves → empty.
            const authStatementFragment =
              usesAtomicAuth || usesAuthedFetch
                ? ''
                : usesTransformGate
                  ? tsTemplate`${modelPolicy.getActionCheckGlobalRolesFragment('update')}(context);`
                  : authFragment;

            const whereType = generateWhereType(prismaModel);

            // Extract transformer entries (guaranteed defined when hasTransformFields is true)
            const transformersObject =
              parts.transformersObjectFragment ?? tsTemplate`{}`;

            // Use property shorthand when data passes through unchanged
            const prismaDataEntry =
              parts.prismaDataFragment === 'data'
                ? 'data,'
                : tsTemplate`data: ${parts.prismaDataFragment},`;

            // Context is always needed for transforms; for scalar-only, when any
            // auth runs (a check statement, or the atomic whereUnique that reads
            // `context`).
            const needsContext =
              hasTransformFields || authFragment !== '' || usesAtomicAuth;
            const contextParam = needsContext ? 'context,' : '';
            const contextType = needsContext
              ? tsTemplate`context: ${serviceContextImports.ServiceContext.typeFragment()};`
              : '';

            // Scalar-path `where` entry and trailing `.catch`: atomic auth
            // composes the grant into the unique selector and maps P2025 → 404;
            // otherwise the caller's `where` passes through as shorthand.
            const scalarWhereEntry = usesAtomicAuth
              ? tsTemplate`where: ${modelPolicy.getActionWhereUniqueFragment('update')}(context, where),`
              : 'where,';
            const scalarCatchFragment = usesAtomicAuth
              ? tsTemplate`.catch(${errorHandlerImports.throwIfPrismaNotFound.fragment()}(${quot(`${modelName} not found`)}))`
              : '';

            // Transform-path inner `tx.update`: for an instance grant, compose the
            // grant into the mutating call too (not just the earlier auth fetch),
            // so authorization and the write are atomic — no TOCTOU window between
            // the fetch and the transaction. `whereUnique` builds the filter
            // in-memory (no extra probe); the nested relation filter is evaluated
            // inside the single `update`. `P2025` → 404, aborting the transaction.
            const txWhereEntry = usesAuthedFetch
              ? tsTemplate`where: ${modelPolicy.getActionWhereUniqueFragment('update')}(context, where),`
              : 'where,';
            const txCatchFragment = usesAuthedFetch
              ? tsTemplate`.catch(${errorHandlerImports.throwIfPrismaNotFound.fragment()}(${quot(`${modelName} not found`)}))`
              : '';

            const updateFunction = hasTransformFields
              ? // Transform path: prepareTransformers + executeTransformPlan
                tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data,
                  query,
                  ${contextParam}
                }: {
                  where: ${whereType};
                  data: z.infer<typeof ${prismaDataService.getUpdateSchemaVariableName()}>;
                  query?: TQuery;
                  ${contextType}
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authStatementFragment}
                  ${parts.inputDestructureFragment}

                  const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
                    transformers: ${transformersObject},
                    serviceContext: context,
                  });

                  const result = await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
                    execute: async ({ tx, transformed }) =>
                      tx.${modelVar}.update({
                        ${txWhereEntry}
                        ${prismaDataEntry}
                      })${txCatchFragment},
                    refetch: (item) =>
                      ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where: { id: item.id }, ...query }),
                  });

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `
              : // Scalar-only path: direct Prisma call
                tsTemplate`
                export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                  where,
                  data,
                  query,
                  ${contextParam}
                }: {
                  where: ${whereType};
                  data: z.infer<typeof ${prismaDataService.getUpdateSchemaVariableName()}>;
                  query?: TQuery;
                  ${contextType}
                }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                  ${existingItemFragment}
                  ${authStatementFragment}
                  ${parts.inputDestructureFragment}

                  const result = await ${prismaImports.prisma.fragment()}.${modelVar}.update({
                    ${scalarWhereEntry}
                    ${prismaDataEntry}
                    ...query,
                  })${scalarCatchFragment};

                  return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
                }
              `;

            const schemaName = `${modelVar}UpdateSchema`;
            const methodFragment = TsCodeUtils.importFragment(
              name,
              serviceFile.getServicePath(),
            );
            const schemaMethodFragment = TsCodeUtils.importFragment(
              schemaName,
              serviceFile.getServicePath(),
            );

            prismaDataService.registerMethod({
              name,
              type: 'update',
              fragment: updateFunction,
              outputMethod: {
                name,
                referenceFragment: methodFragment,
                arguments: [
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'where',
                    kind: prismaWhereUniqueInputKind,
                    metadata: {
                      idFields: prismaModel.idFields ?? [],
                    },
                  }),
                  {
                    name: 'data',
                    type: 'nested',
                    nestedType: {
                      name: `${uppercaseFirstChar(name)}Data`,
                      fields: usedFields.map((field) => ({
                        ...field.outputDtoField,
                        isOptional: true,
                      })),
                    },
                    zodSchemaFragment: schemaMethodFragment,
                  },
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'context',
                    kind: contextKind,
                  }),
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'query',
                    kind: prismaQueryKind,
                  }),
                ],
                returnType: prismaToServiceOutputDto(prismaModel, (enumName) =>
                  prismaOutput.getServiceEnum(enumName),
                ),
              },
            });
          },
        };
      },
    }),
  }),
});
