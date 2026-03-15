import type { User } from '../generated/prisma/client.js';
import type { AuthRole } from '../modules/accounts/auth/constants/auth-roles.constants.js';

import { auth } from '../modules/accounts/auth/services/auth.js';
import { prisma } from '../services/prisma.js';

const { INITIAL_USER_EMAIL, INITIAL_USER_PASSWORD } = process.env;
const INITIAL_USER_ROLES: AuthRole[] =
  /* TPL_INITIAL_USER_ROLES:START */ []; /* TPL_INITIAL_USER_ROLES:END */

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
    const result = await auth.api.signUpEmail({
      body: {
        name: INITIAL_USER_EMAIL.split('@')[0] ?? 'Admin',
        email: INITIAL_USER_EMAIL,
        password: INITIAL_USER_PASSWORD,
      },
    });

    if (!result.user) {
      console.error('Failed to create initial user');
      return undefined;
    }

    user = await prisma.user.findUnique({
      where: { id: result.user.id },
    });

    if (!user) {
      console.error('Failed to find created user');
      return undefined;
    }

    console.info(`Created initial user with email ${INITIAL_USER_EMAIL}!`);
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
