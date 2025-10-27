import type { User } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

import type { AuthRole } from '../constants/auth-roles.constants.js';

import { AUTH_ROLE_CONFIG } from '../constants/auth-roles.constants.js';

/**
 * Updates the roles assigned to a user.
 * Filters out built-in roles (public, user, system) as these are automatically assigned.
 *
 * @param params - The parameters for updating user roles
 * @param params.userId - The ID of the user to update
 * @param params.roles - Array of role names to assign to the user
 * @returns The updated user with their roles
 */
export async function updateUserRoles({
  userId,
  roles,
}: {
  userId: string;
  roles: string[];
}): Promise<User> {
  // Filter out built-in roles (public, user, system)
  const validRoles = roles.filter((role) => {
    if (!(role in AUTH_ROLE_CONFIG)) {
      return false;
    }
    const roleConfig = AUTH_ROLE_CONFIG[role as AuthRole];
    return !roleConfig.builtIn;
  });

  await prisma.$transaction([
    prisma.userRole.deleteMany({
      where: { userId, role: { notIn: validRoles } },
    }),
    prisma.userRole.createMany({
      data: validRoles.map((role) => ({ userId, role })),
      skipDuplicates: true,
    }),
  ]);

  return prisma.user.findUnique({
    where: { id: userId },
  }) as Promise<User>;
}
