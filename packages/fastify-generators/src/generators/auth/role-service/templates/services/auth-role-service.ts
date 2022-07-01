// @ts-nocheck

// HEADER:START
HEADER;

AVAILABLE_ROLES_EXPORT;

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
// HEADER:END

export const authRoleService = {
  // BODY:START
  populateAuthRoles(roles?: string[] | null): AuthRole[] {
    if (!roles) {
      return ['anonymous'];
    }
    const availableRoles = (roles as AuthRole[])
      .filter((role) => AUTH_ROLE_CONFIG[role])
      .flatMap((role) => [role, ...getInheritedRoles(role)]);

    return availableRoles;
  },
  // BODY:END
};
