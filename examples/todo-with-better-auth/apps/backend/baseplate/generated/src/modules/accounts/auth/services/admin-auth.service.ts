import { hashPassword } from 'better-auth/crypto';

import type { User } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

import type { AuthRole } from '../constants/auth-roles.constants.js';

import { AUTH_ROLE_CONFIG } from '../constants/auth-roles.constants.js';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 255;

/**
 * Resets a user's password without requiring the current password.
 * This is used by administrators to reset any user's password.
 *
 * @param params - The parameters for resetting password
 * @param params.userId - The ID of the user whose password is being reset
 * @param params.newPassword - The new password to set
 * @returns The updated user
 */
export async function resetUserPassword({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}): Promise<User> {
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw new Error(
      `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`,
    );
  }
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    throw new Error('Password is too long');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user === null) {
    throw new Error('User not found');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.account.updateMany({
    where: {
      userId,
      providerId: 'credential',
    },
    data: {
      password: passwordHash,
    },
  });

  return user;
}

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
  // Filter out auto-assigned roles (public, user, system) that cannot be manually assigned
  const validRoles = roles.filter((role) => {
    if (!(role in AUTH_ROLE_CONFIG)) {
      return false;
    }
    const roleConfig = AUTH_ROLE_CONFIG[role as AuthRole];
    return !roleConfig.autoAssigned;
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
