import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { lowercaseFirstChar, quot } from '@baseplate-dev/utils';
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
  globalRoles: z.array(z.string().min(1)).optional(),
  instanceRoles: z.array(z.string().min(1)).optional(),
});

/**
 * Generator for prisma/prisma-data-delete
 *
 * Generates a delete function that:
 * - Checks authorization (global and/or instance)
 * - Calls prisma.model.delete directly (no transaction wrapper)
 * - Returns the deleted record
 */
export const prismaDataDeleteGenerator = createGenerator({
  name: 'prisma/prisma-data-delete',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, globalRoles, instanceRoles }) => ({
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
        return {
          build: () => {
            const modelVar = lowercaseFirstChar(modelName);
            const prismaModel = prismaOutput.getPrismaModel(modelName);

            // Generate authorization statements
            const { fragment: authFragment, hasInstanceAuth } =
              generateAuthorizationStatements({
                modelName,
                methodType: 'Delete',
                globalRoles,
                instanceRoles,
                modelPolicy,
                authorizerImports,
              });

            const whereType = generateWhereType(prismaModel);

            // A policy-backed delete is atomic: compose the grant into the unique
            // selector via `policy.delete.whereUnique`, whether the grant is
            // instance-level (per-row filter → P2025 → 404 hides existence) or
            // global-only (admin passes untouched; non-admin throws 403 before
            // the query). One query, no separate fetch + check. Applies whenever a
            // policy exists and the action has any grant; global-only models with
            // no policy keep the plain `checkGlobalAuthorization` fallback.
            const hasAnyGrant =
              hasInstanceAuth ||
              (globalRoles != null && globalRoles.length > 0);
            const usesAtomicAuth = hasAnyGrant && modelPolicy != null;

            // Context is needed whenever any auth runs (atomic whereUnique reads
            // `context`, and the non-atomic path calls checkGlobalAuthorization).
            const hasAuth = authFragment !== '' || usesAtomicAuth;
            const contextParam = hasAuth ? 'context,' : '';
            const contextType = hasAuth
              ? tsTemplate`context: ${serviceContextImports.ServiceContext.typeFragment()};`
              : '';

            const bodyFragment = usesAtomicAuth
              ? tsTemplate`
                const result = await ${prismaImports.prisma.fragment()}.${modelVar}.delete({
                  where: ${modelPolicy.getActionWhereUniqueFragment('delete')}(context, where),
                  ...query,
                }).catch(${errorHandlerImports.throwIfPrismaNotFound.fragment()}(${quot(`${modelName} not found`)}));
              `
              : tsTemplate`
                ${authFragment}

                const result = await ${prismaImports.prisma.fragment()}.${modelVar}.delete({
                  where,
                  ...query,
                });
              `;

            // Generate the delete function
            const deleteFunction = tsTemplate`
              export async function ${name}<TQuery extends ${dataUtilsImports.DataQuery.typeFragment()}<${quot(modelVar)}>>({
                where,
                query,
                ${contextParam}
              }: {
                where: ${whereType};
                query?: TQuery;
                ${contextType}
              }): Promise<${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>> {
                ${bodyFragment}

                return result as ${dataUtilsImports.GetResult.typeFragment()}<${quot(modelVar)}, TQuery>;
              }
            `;

            prismaDataService.registerMethod({
              name,
              type: 'delete',
              fragment: deleteFunction,
              outputMethod: {
                name,
                referenceFragment: TsCodeUtils.importFragment(
                  name,
                  serviceFile.getServicePath(),
                ),
                arguments: [
                  createServiceOutputDtoInjectedArg({
                    name: 'where',
                    type: 'injected',
                    kind: prismaWhereUniqueInputKind,
                    metadata: {
                      idFields: prismaModel.idFields ?? [],
                    },
                  }),
                  ...(hasAuth
                    ? [
                        createServiceOutputDtoInjectedArg({
                          name: 'context',
                          type: 'injected' as const,
                          kind: contextKind,
                        }),
                      ]
                    : []),
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
