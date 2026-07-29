import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type {
  PrismaModelPolicyProvider,
  PrismaOutputProvider,
} from '@baseplate-dev/fastify-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { compareStrings, quot } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * The field-level permissions on a relation as exposed in GraphQL. Absent
 * (rather than empty) when the relation isn't exposed at all — the two cases
 * must stay distinguishable, since an unexposed relation has no gate to mirror
 * and so yields no read rule rather than an ungated one.
 */
const fieldRolesSchema = z.object({
  globalRoles: z.array(z.string()).default([]),
  instanceRoles: z.array(z.string()).default([]),
});

/**
 * A model relation pointing at a category's files. `relationName` is the
 * File-side name (drives orphan cleanup); `modelName`/`foreignKeyFieldName`
 * identify the owning side, whose policy and field permissions gate reads.
 */
export const referencedBySchema = z.object({
  relationName: z.string(),
  modelName: z.string(),
  fieldName: z.string(),
  /** The owning model's FK column, e.g. `avatarId`. */
  foreignKeyFieldName: z.string(),
  fieldRoles: fieldRolesSchema.optional(),
});

export type ReferencedBy = z.infer<typeof referencedBySchema>;

export interface PresignedReadBuilderContext {
  prismaOutput: PrismaOutputProvider;
  /** Resolves a model's policy, absent for models without authorizer roles. */
  getModelPolicy: (modelName: string) => PrismaModelPolicyProvider | undefined;
  forbiddenErrorFragment: () => TsCodeFragment;
}

/**
 * A read rule for one referencing relation: load the owning row under that
 * model's `read` grant, then apply the relation's own field permissions.
 *
 * Returns undefined when no rule is derivable — the model has no policy, or the
 * relation isn't exposed in GraphQL so there is no field gate to mirror.
 */
export function buildReferenceReadFragment(
  ref: ReferencedBy,
  { prismaOutput, getModelPolicy }: PresignedReadBuilderContext,
): TsCodeFragment | undefined {
  const modelPolicy = getModelPolicy(ref.modelName);
  if (!modelPolicy || !ref.fieldRoles) return undefined;

  const { globalRoles, instanceRoles } = ref.fieldRoles;
  const isGated = globalRoles.length > 0 || instanceRoles.length > 0;

  // Without a field gate only existence matters, so narrow the row to its
  // id(s). A gate's instance checks receive the row, so it must be loaded whole.
  const { idFields } = prismaOutput.getPrismaModel(ref.modelName);
  const selectFragment =
    !isGated && idFields?.length
      ? tsTemplate`
            select: ${TsCodeUtils.mergeFragmentsAsObject(
              Object.fromEntries(
                idFields.toSorted(compareStrings).map((f) => [f, 'true']),
              ),
            )},`
      : '';

  const rowFragment = tsTemplate`await ${prismaOutput.getPrismaModelFragment(
    ref.modelName,
  )}.findFirst({
            where: ${modelPolicy.getActionWhereFragment('read')}(context, {
              ${ref.foreignKeyFieldName}: file.id,
            }),${selectFragment}
          })`;

  if (!isGated) {
    return tsTemplate`((${rowFragment}) !== null)`;
  }

  // Mirrors the GraphQL field gate: global roles and instance checks are OR-ed
  // against each other, then AND-ed with reading the row.
  const gateFragments: TsCodeFragment[] = [
    ...(globalRoles.length > 0
      ? [
          tsTemplate`context.auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
            globalRoles.map(quot).toSorted(),
          )})`,
        ]
      : []),
    ...instanceRoles
      .toSorted(compareStrings)
      .map(
        (roleName) =>
          tsTemplate`await ${modelPolicy.getRoleCheckFragment(roleName)}(context, row)`,
      ),
  ];

  return tsTemplate`(await (async () => {
            const row = ${rowFragment};
            if (!row) return false;
            return ${TsCodeUtils.mergeFragments(
              new Map(gateFragments.map((f, i) => [String(i), f])),
              ' || ',
            )};
          })())`;
}

/**
 * `presignedRead` for a category: readable if ANY referencing relation grants
 * it. Omitted entirely when nothing is derivable, which the runtime treats as
 * deny.
 */
export function buildPresignedReadFragment(
  referencedBy: ReferencedBy[],
  context: PresignedReadBuilderContext,
): TsCodeFragment | undefined {
  const refFragments = referencedBy
    .toSorted((a, b) =>
      compareStrings(
        `${a.modelName}.${a.fieldName}`,
        `${b.modelName}.${b.fieldName}`,
      ),
    )
    .map((ref) => buildReferenceReadFragment(ref, context))
    .filter((fragment): fragment is TsCodeFragment => fragment !== undefined);

  if (refFragments.length === 0) return undefined;

  const onlyFragment = refFragments[0];
  if (refFragments.length === 1 && onlyFragment) {
    return tsTemplate`async (file, context) =>
              ${onlyFragment}`;
  }

  // With several referencing models, a model that grants nothing throws
  // ForbiddenError from `.where`. Swallow only that — it means "this model
  // grants no access", not "the request fails" — so another model's grant still
  // applies.
  const guarded = refFragments.map(
    (fragment) => tsTemplate`(await (async () => {
              try {
                return ${fragment};
              } catch (error) {
                if (error instanceof ${context.forbiddenErrorFragment()}) {
                  return false;
                }
                throw error;
              }
            })())`,
  );

  return tsTemplate`async (file, context) =>
            ${TsCodeUtils.mergeFragments(
              new Map(guarded.map((f, i) => [String(i), f])),
              ' || ',
            )}`;
}

/** The category's `authorize` object, omitted when it would be empty. */
export function buildAuthorizeFragment(
  category: {
    authorize: { uploadRoles: string[] };
    referencedBy: ReferencedBy[];
  },
  context: PresignedReadBuilderContext,
): TsCodeFragment | undefined {
  const members: Record<string, TsCodeFragment | undefined> = {
    upload:
      category.authorize.uploadRoles.length > 0
        ? tsTemplate`({ auth }) => auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
            category.authorize.uploadRoles.map(quot).toSorted(),
          )})`
        : undefined,
    presignedRead: buildPresignedReadFragment(category.referencedBy, context),
  };
  if (Object.values(members).every((m) => m === undefined)) {
    return undefined;
  }
  return TsCodeUtils.mergeFragmentsAsObject(members);
}
