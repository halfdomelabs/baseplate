import type { User } from '../generated/prisma/client.js';
import type { AuthRole } from '../modules/accounts/constants/auth-roles.constants.js';

import { createUserWithEmailAndPassword } from '../modules/accounts/password/services/user-password.service.js';
import { prisma } from '../services/prisma.js';

const { INITIAL_USER_EMAIL, INITIAL_USER_PASSWORD } = process.env;
const INITIAL_USER_ROLES: AuthRole[] = /* TPL_INITIAL_USER_ROLES:START */ [
  'admin',
]; /* TPL_INITIAL_USER_ROLES:END */

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
    user = await createUserWithEmailAndPassword({
      input: {
        email: INITIAL_USER_EMAIL,
        password: INITIAL_USER_PASSWORD,
      },
    });
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
