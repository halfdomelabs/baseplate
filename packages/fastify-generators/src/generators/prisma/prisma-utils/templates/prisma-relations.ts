/**
 * Small helper function to make it easier to use optional relations in Prisma since the
 * only way to set a Prisma relation to null is to disconnect it.
 *
 * See https://github.com/prisma/prisma/issues/5044
 */
export function createPrismaDisconnectOrConnectData<UniqueWhere>(
  data?: { connect: UniqueWhere } | null
):
  | {
      disconnect?: boolean;
      connect?: UniqueWhere;
    }
  | undefined {
  if (data === undefined) {
    return undefined;
  }
  if (data === null) {
    return { disconnect: true };
  }
  return data;
}
