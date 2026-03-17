import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

export async function deleteUserImage<TQuery extends DataQuery<'userImage'>>({
  where,
  query,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'userImage', TQuery>> {
  const result = await prisma.userImage.delete({
    where,
    ...query,
  });

  return result as GetResult<'userImage', TQuery>;
}
