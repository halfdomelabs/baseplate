import type { Prisma, UserImage } from '@src/generated/prisma/client.js';
import type { DeleteServiceInput } from '@src/utils/crud-service-types.js';

import { prisma } from '@src/services/prisma.js';

export async function deleteUserImage({
  id,
  query,
}: DeleteServiceInput<
  string,
  Prisma.UserImageDefaultArgs
>): Promise<UserImage> {
  return prisma.userImage.delete({ where: { id }, ...query });
}
