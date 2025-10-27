import type { Args, Result } from '@prisma/client/runtime/client';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { prisma } from '@src/services/prisma.js';

export type ModelPropName = Prisma.TypeMap['meta']['modelProps'];

/** Get the payload type for a given model */
export type GetPayload<
  TModelName extends ModelPropName,
  TQueryArgs = undefined,
> = Result<(typeof prisma)[TModelName], TQueryArgs, 'findUniqueOrThrow'>;

export type ModelQuery<TModelName extends ModelPropName> = Pick<
  Args<(typeof prisma)[TModelName], 'findUnique'>,
  'select' | 'include'
>;

export type WhereInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'findMany'
>['where'];

export type WhereUniqueInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'findUnique'
>['where'];

export type CreateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'create'
>['data'];

export type UpdateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'update'
>['data'];
