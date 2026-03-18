import { hashPassword } from 'better-auth/crypto';

import type { User } from '../generated/prisma/client.js';
import type { AuthRole } from '../modules/accounts/auth/constants/auth-roles.constants.js';

import { prisma } from '../services/prisma.js';

const { INITIAL_USER_EMAIL, INITIAL_USER_PASSWORD } = process.env;
const INITIAL_USER_ROLES: AuthRole[] = /* TPL_INITIAL_USER_ROLES:START */ [
  'admin',
]; /* TPL_INITIAL_USER_ROLES:END */

/**
 * Seeds the initial user with email/password credentials and assigns roles.
 * Uses direct Prisma calls instead of the auth API to avoid triggering
 * verification emails during seeding.
 *
 * @returns The seeded user, or undefined if env vars are not set
 */
export async function seedInitialUser(): Promise<User | undefined> {
  if (!INITIAL_USER_EMAIL || !INITIAL_USER_PASSWORD) {
    console.warn(
      'INITIAL_USER_EMAIL and INITIAL_USER_PASSWORD must be set in .seed.env to seed the initial user',
    );
    return undefined;
  }

  let user = await prisma.user.findFirst({
    where: { email: INITIAL_USER_EMAIL },
  });

  if (!user) {
    const passwordHash = await hashPassword(INITIAL_USER_PASSWORD);

    user = await prisma.user.create({
      data: {
        name: INITIAL_USER_EMAIL.split('@')[0] ?? 'Admin',
        email: INITIAL_USER_EMAIL,
        emailVerified: true,
        accounts: {
          create: {
            accountId: INITIAL_USER_EMAIL,
            providerId: 'credential',
            password: passwordHash,
          },
        },
      },
    });

    console.info(
      `Seeded user "${INITIAL_USER_EMAIL}" with roles "${INITIAL_USER_ROLES.join(', ')}"`,
    );
  }

  await prisma.userRole.createMany({
    data: INITIAL_USER_ROLES.map((role) => ({
      userId: user.id,
      role,
    })),
    skipDuplicates: true,
  });

  return user;
}
