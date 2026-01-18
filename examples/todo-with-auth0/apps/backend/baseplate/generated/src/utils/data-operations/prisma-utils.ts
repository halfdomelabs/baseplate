import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  ModelQuery,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
} from './prisma-types.js';
import type { PrismaTransaction } from './types.js';

/**
 * Generic interface for Prisma model delegates.
 *
 * Provides a type-safe way to interact with any Prisma model through
 * a common set of operations. Used internally by the data operations
 * system to perform database operations on models determined at runtime.
 *
 * @template TModelName - The Prisma model name
 *
 * @internal This interface is used internally by the data operations system
 */
interface GenericPrismaDelegate<TModelName extends ModelPropName> {
  findUnique: <TQueryArgs extends ModelQuery<TModelName> = object>(args: {
    where: WhereUniqueInput<TModelName>;
    include?: NonNullable<ModelQuery<TModelName>['include']>;
  }) => Promise<GetPayload<TModelName, TQueryArgs> | null>;
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
 * Creates a type-safe generic delegate for a Prisma model.
 *
 * This function allows accessing Prisma model operations (findUnique, create, update, etc.)
 * in a type-safe way when the model name is only known at runtime. It's used internally
 * by nested field handlers and other generic operations.
 *
 * @template TModelName - The Prisma model name
 * @param tx - Prisma transaction client
 * @param modelName - The name of the model to create a delegate for (e.g., 'user', 'post')
 * @returns A generic delegate providing type-safe access to model operations
 *
 * @example
 * ```typescript
 * const delegate = makeGenericPrismaDelegate(tx, 'user');
 *
 * // Type-safe operations
 * const user = await delegate.findUnique({ where: { id: userId } });
 * const users = await delegate.findMany({ where: { isActive: true } });
 * const newUser = await delegate.create({ data: { name: 'John', email: 'john@example.com' } });
 * ```
 *
 * @internal This function is used internally by nested field handlers
 */
export function makeGenericPrismaDelegate<TModelName extends ModelPropName>(
  tx: PrismaTransaction,
  modelName: TModelName,
): GenericPrismaDelegate<TModelName> {
  return tx[modelName] as unknown as GenericPrismaDelegate<TModelName>;
}
