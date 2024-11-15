import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext({
  req,
  res,
}: CreateFastifyContextOptions): Pick<
  CreateFastifyContextOptions,
  'req' | 'res'
> {
  return { req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
