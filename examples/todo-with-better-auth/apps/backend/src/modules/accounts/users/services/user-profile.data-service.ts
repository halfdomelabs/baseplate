import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

export async function deleteUserProfile<
  TQuery extends DataQuery<'userProfile'>,
>({
  where,
  query,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'userProfile', TQuery>> {
  const result = await prisma.userProfile.delete({
    where,
    ...query,
  });

  return result as GetResult<'userProfile', TQuery>;
}
