import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { quot } from '@baseplate-dev/utils';

interface ModelAuthorizerLike {
  getRoleFragment(roleName: string): TsCodeFragment;
}

interface GenerateAuthorizeFragmentOptions {
  modelName: string;
  methodType: string;
  globalRoles?: string[];
  instanceRoles?: string[];
  modelAuthorizer: ModelAuthorizerLike | undefined;
}

/**
 * Builds a `TsCodeFragment` for the `authorize: [...]` property used in
 * `composeCreate`, `composeUpdate`, and `commitDelete` calls.
 *
 * Returns an empty string when no roles are configured.
 */
export function generateAuthorizeFragment({
  modelName,
  methodType,
  globalRoles,
  instanceRoles,
  modelAuthorizer,
}: GenerateAuthorizeFragmentOptions): string | TsCodeFragment {
  const hasGlobalRoles = globalRoles != null && globalRoles.length > 0;
  const hasInstanceRoles = instanceRoles != null && instanceRoles.length > 0;

  if (!hasGlobalRoles && !hasInstanceRoles) {
    return '';
  }

  const globalRoleItems = (globalRoles ?? []).map((r) => quot(r));
  const instanceRoleFragments = (instanceRoles ?? []).map((roleName) => {
    if (!modelAuthorizer) {
      throw new Error(
        `${methodType} method on model '${modelName}' references instance role '${roleName}' but no authorizer is configured for this model.`,
      );
    }
    return modelAuthorizer.getRoleFragment(roleName);
  });

  const allItems = [
    ...globalRoleItems,
    ...instanceRoleFragments.map((f) => f.contents),
  ];

  return TsCodeUtils.frag(
    `\n                  authorize: [${allItems.join(', ')}],`,
    instanceRoleFragments.flatMap((f) => f.imports ?? []),
  );
}
