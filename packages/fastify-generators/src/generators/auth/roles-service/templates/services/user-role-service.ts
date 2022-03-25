// @ts-nocheck
export type UserWithRoles = USER & { userRoles: USER_ROLE[] };

export type AuthRole = AVAILABLE_ROLES;

interface RoleConfig {
  comment: string;
  inherits?: AuthRole[];
}

export const AUTH_ROLE_CONFIG: Record<AuthRole, RoleConfig> = ROLE_MAP;

function getInheritedRoles(role: AuthRole): AuthRole[] {
  const roleConfig = AUTH_ROLE_CONFIG[role];
  if (!roleConfig.inherits) {
    return [];
  }
  return roleConfig.inherits.flatMap((inheritedRole) => [
    inheritedRole,
    ...getInheritedRoles(inheritedRole),
  ]);
}

export const authRoleService = {
  getRolesForUser(user?: UserWithRoles | null): AuthRole[] {
    if (!user) {
      return ['anonymous'];
    }
    const availableRoles = user.userRoles
      .map((role) => role.role as AuthRole)
      .filter((role) => AUTH_ROLE_CONFIG[role])
      .flatMap((role) => [role, ...getInheritedRoles(role)]);

    return availableRoles;
  },
};
