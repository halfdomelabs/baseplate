import type { PrismaTransaction } from './types.js';
import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
} from './utility-types.js';

interface GenericPrismaDelegate<TModelName extends ModelPropName> {
  findUnique: (args: {
    where: WhereUniqueInput<TModelName>;
  }) => Promise<GetPayload<TModelName> | null>;
  findMany: (args: {
    where: WhereInput<TModelName>;
  }) => Promise<GetPayload<TModelName>[]>;
  create: (args: {
    data: CreateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  update: (args: {
    where: WhereUniqueInput<TModelName>;
    data: UpdateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  upsert: (args: {
    where: WhereUniqueInput<TModelName>;
    create: CreateInput<TModelName>;
    update: UpdateInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  delete: (args: {
    where: WhereUniqueInput<TModelName>;
  }) => Promise<GetPayload<TModelName>>;
  deleteMany: (args: {
    where: WhereInput<TModelName>;
  }) => Promise<{ count: number }>;
}

/**
 * Creates a generic Prisma delegate for a given model name.
 *
 * @param modelName - The name of the model to create a delegate for
 * @returns A generic Prisma delegate for the given model name
 */
export function makeGenericPrismaDelegate<TModelName extends ModelPropName>(
  tx: PrismaTransaction,
  modelName: TModelName,
): GenericPrismaDelegate<TModelName> {
  return tx[modelName] as unknown as GenericPrismaDelegate<TModelName>;
}
