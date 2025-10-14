// @ts-nocheck

import type { AuthRole } from '%authRolesImports';
import type { User } from '%prismaGeneratedImports';

import { createUserWithEmailAndPassword } from '%authEmailPasswordImports';
import { prisma } from '%prismaImports';

const { INITIAL_USER_EMAIL, INITIAL_USER_PASSWORD } = process.env;
const INITIAL_USER_ROLES: AuthRole[] = TPL_INITIAL_USER_ROLES;

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
