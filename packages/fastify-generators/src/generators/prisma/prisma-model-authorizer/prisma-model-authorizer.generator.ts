import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { lowercaseFirstChar } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { kebabCase } from 'change-case';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/app-module/index.js';

import { prismaAuthorizerUtilsImportsProvider } from '../prisma-authorizer-utils/index.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const roleSchema = z.object({
  /** camelCase role name (e.g., 'owner'). */
  name: z.string().min(1),
  /** The role-tree builder call body (e.g., `r.via(blogPolicy, 'owner', {...})`). */
  roleTreeCode: z.string().min(1),
  /** Foreign policy model names this role delegates to (for imports). */
  foreignPolicyModelNames: z.array(z.string()).default([]),
});

const actionGrantSchema = z.object({
  /** Instance role names (reference this policy's own roles). */
  roles: z.array(z.string()).default([]),
  /** Global/principal role names. */
  globalRoles: z.array(z.string()).default([]),
});

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  idFieldName: z.string().min(1),
  roles: z.array(roleSchema).min(1),
  /** `read` is required; create/update/delete + custom verbs alongside. */
  actions: z.record(z.string(), actionGrantSchema),
  /** Model names of foreign policies referenced by delegation. */
  foreignPolicyModelNames: z.array(z.string().min(1)).default([]),
});

/**
 * Provider for a model policy — lets other generators (GraphQL field gates,
 * data services) reference the policy and its members.
 */
export interface PrismaModelPolicyProvider {
  /** The policy variable name (e.g., 'blogPolicy'). */
  getPolicyName(): string;
  /** A fragment importing the policy from its module path. */
  getPolicyFragment(): TsCodeFragment;
  /** A fragment referencing a role's instance-check member (`policy.roles.owner.check`). */
  getRoleCheckFragment(roleName: string): TsCodeFragment;
  /**
   * A fragment referencing an action's `.where` member (`policy.read.where`),
   * consumed by list/count read surfaces: `policy.read.where(ctx, callerWhere?)`.
   */
  getActionWhereFragment(action: string): TsCodeFragment;
  /**
   * A fragment referencing an action's `.whereUnique` member
   * (`policy.read.whereUnique`), for get-by-id: `policy.read.whereUnique(ctx, { id })`.
   */
  getActionWhereUniqueFragment(action: string): TsCodeFragment;
  /**
   * A fragment referencing an action's `.checkGlobalRoles` member
   * (`policy.create.checkGlobalRoles`), a throwing principal-only global-role
   * check for row-less mutations: `policy.create.checkGlobalRoles(context)`.
   */
  getActionCheckGlobalRolesFragment(action: string): TsCodeFragment;
}

export const prismaModelPolicyProvider =
  createReadOnlyProviderType<PrismaModelPolicyProvider>('prisma-model-policy');

/**
 * Generates `{moduleFolder}/authorizers/{kebab-model}.policy.ts` — a
 * `createModelPolicy(...)` declaration whose roles derive both `check` and
 * `where`, with a consolidated `actions` grant map.
 */
export const prismaModelPolicyGenerator = createGenerator({
  name: 'prisma/prisma-model-policy',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => `${descriptor.modelName}Policy`,
  buildTasks: (descriptor) => {
    const { foreignPolicyModelNames } = descriptor;

    // Dynamic deps for foreign policies referenced by delegation (r.via).
    const foreignPolicyDeps = Object.fromEntries(
      foreignPolicyModelNames.map((name) => [
        `foreignPolicy_${name}`,
        prismaModelPolicyProvider.dependency().reference(name),
      ]),
    );

    return {
      main: createGeneratorTask({
        dependencies: {
          appModule: appModuleProvider,
          typescriptFile: typescriptFileProvider,
          prismaOutput: prismaOutputProvider,
          prismaAuthorizerUtilsImports: prismaAuthorizerUtilsImportsProvider,
          ...(foreignPolicyDeps as Record<string, never>),
        },
        outputs: {
          prismaModelPolicy: prismaModelPolicyProvider.export(
            packageScope,
            descriptor.modelName,
          ),
        },
        run({
          appModule,
          typescriptFile,
          prismaOutput,
          prismaAuthorizerUtilsImports,
          ...dynamicDeps
        }) {
          const { modelName, idFieldName, roles, actions } = descriptor;
          const modelVarName = lowercaseFirstChar(modelName);
          const policyName = `${modelVarName}Policy`;

          // Resolve foreign policy providers by model name.
          const foreignPolicyProviders = new Map<
            string,
            PrismaModelPolicyProvider
          >();
          for (const name of foreignPolicyModelNames) {
            foreignPolicyProviders.set(
              name,
              (dynamicDeps as Record<string, unknown>)[
                `foreignPolicy_${name}`
              ] as PrismaModelPolicyProvider,
            );
          }

          const policyFolder = posixJoin(
            appModule.getModuleFolder(),
            'authorizers',
          );
          const policyPath = posixJoin(
            policyFolder,
            `${kebabCase(modelName)}.policy.ts`,
          );

          return {
            build: async (builder) => {
              // Roles object — each value is the role-tree code, carrying the
              // import fragments of any foreign policies it delegates to.
              const rolesObject: Record<string, string | TsCodeFragment> = {};
              for (const role of roles) {
                const imports = role.foreignPolicyModelNames
                  .map((name) => foreignPolicyProviders.get(name))
                  .filter((p): p is PrismaModelPolicyProvider => p != null)
                  .flatMap((p) => p.getPolicyFragment().imports ?? []);
                rolesObject[role.name] =
                  imports.length > 0
                    ? { contents: role.roleTreeCode, imports }
                    : role.roleTreeCode;
              }
              const rolesFragment = TsCodeUtils.mergeFragmentsAsObject(
                rolesObject,
                { disableSort: true },
              );

              // Actions map.
              const actionsObject: Record<string, string> = {};
              for (const [action, grant] of Object.entries(actions)) {
                const parts: string[] = [];
                if (grant.roles.length > 0) {
                  parts.push(
                    `roles: [${grant.roles.map((r) => `'${r}'`).join(', ')}]`,
                  );
                }
                if (grant.globalRoles.length > 0) {
                  parts.push(
                    `globalRoles: [${grant.globalRoles.map((r) => `'${r}'`).join(', ')}]`,
                  );
                }
                actionsObject[action] = `{ ${parts.join(', ')} }`;
              }
              const actionsFragment = TsCodeUtils.mergeFragmentsAsObject(
                actionsObject,
                { disableSort: true },
              );

              const prismaModelFragment =
                prismaOutput.getPrismaModelFragment(modelName);

              const fileFragment = tsTemplate`
                export const ${policyName} = ${prismaAuthorizerUtilsImports.createModelPolicy.fragment()}({
                  model: '${modelVarName}',
                  idField: '${idFieldName}',
                  delegate: ${prismaModelFragment},
                  roles: (r) => (${rolesFragment}),
                  actions: ${actionsFragment},
                });
              `;

              await builder.apply(
                typescriptFile.renderTemplateFragment({
                  id: `prisma-model-policy:${modelName}`,
                  destination: policyPath,
                  fragment: fileFragment,
                }),
              );

              return {
                prismaModelPolicy: {
                  getPolicyName() {
                    return policyName;
                  },
                  getPolicyFragment() {
                    return TsCodeUtils.importFragment(policyName, policyPath);
                  },
                  getRoleCheckFragment(roleName: string) {
                    const validRoles = roles.map((r) => r.name);
                    if (!validRoles.includes(roleName)) {
                      throw new Error(
                        `Role '${roleName}' not found on ${modelName} policy. Available: ${validRoles.join(', ')}`,
                      );
                    }
                    return tsTemplate`${TsCodeUtils.importFragment(policyName, policyPath)}.roles.${roleName}.check`;
                  },
                  getActionWhereFragment(action: string) {
                    if (!(action in actions)) {
                      throw new Error(
                        `Action '${action}' not found on ${modelName} policy. Available: ${Object.keys(actions).join(', ')}`,
                      );
                    }
                    return tsTemplate`${TsCodeUtils.importFragment(policyName, policyPath)}.${action}.where`;
                  },
                  getActionWhereUniqueFragment(action: string) {
                    if (!(action in actions)) {
                      throw new Error(
                        `Action '${action}' not found on ${modelName} policy. Available: ${Object.keys(actions).join(', ')}`,
                      );
                    }
                    return tsTemplate`${TsCodeUtils.importFragment(policyName, policyPath)}.${action}.whereUnique`;
                  },
                  getActionCheckGlobalRolesFragment(action: string) {
                    if (!(action in actions)) {
                      throw new Error(
                        `Action '${action}' not found on ${modelName} policy. Available: ${Object.keys(actions).join(', ')}`,
                      );
                    }
                    return tsTemplate`${TsCodeUtils.importFragment(policyName, policyPath)}.${action}.checkGlobalRoles`;
                  },
                },
              };
            },
          };
        },
      }),
    };
  },
});
