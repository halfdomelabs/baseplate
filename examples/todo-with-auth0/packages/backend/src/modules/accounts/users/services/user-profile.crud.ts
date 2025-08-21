import type { Prisma, UserProfile } from '@prisma/client';

import type { DeleteServiceInput } from '@src/utils/crud-service-types.js';

import { prisma } from '@src/services/prisma.js';

export async function deleteUserProfile({
  id,
  query,
}: DeleteServiceInput<
  string,
  Prisma.UserProfileDefaultArgs
>): Promise<UserProfile> {
  return prisma.userProfile.delete({ where: { id }, ...query });
}
