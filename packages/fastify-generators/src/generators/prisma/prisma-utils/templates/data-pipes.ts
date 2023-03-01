// @ts-nocheck

import { Prisma } from '@prisma/client';
import { prisma } from '%prisma-service';
import { notEmpty } from '%ts-utils/arrays';

interface DataPipeOperations {
  beforePrismaPromises?: Prisma.PrismaPromise<unknown>[];
  afterPrismaPromises?: Prisma.PrismaPromise<unknown>[];
}

export interface DataPipeOutput<Output = unknown> {
  data: Output;
  operations?: DataPipeOperations;
}

export function mergePipeOperations(
  outputs: (DataPipeOutput | DataPipeOperations | undefined | null)[]
): DataPipeOperations {
  const operations = outputs
    .map((o) => (o && 'data' in o ? o.operations : o))
    .filter(notEmpty);

  return {
    beforePrismaPromises: operations.flatMap(
      (op) => op.beforePrismaPromises || []
    ),
    afterPrismaPromises: operations.flatMap(
      (op) => op.afterPrismaPromises || []
    ),
  };
}

// Taken from Prisma generated code
type UnwrapPromise<P> = P extends Promise<infer R> ? R : P;
type UnwrapTuple<Tuple extends readonly unknown[]> = {
  [K in keyof Tuple]: K extends `${number}`
    ? Tuple[K] extends Prisma.PrismaPromise<infer X>
      ? X
      : UnwrapPromise<Tuple[K]>
    : UnwrapPromise<Tuple[K]>;
};

export async function applyDataPipeOutputToOperations<
  Promises extends Prisma.PrismaPromise<unknown>[]
>(
  outputs: (DataPipeOutput | DataPipeOperations | undefined | null)[],
  operations: [...Promises]
): Promise<UnwrapTuple<Promises>> {
  const { beforePrismaPromises = [], afterPrismaPromises = [] } =
    mergePipeOperations(outputs);
  const results = await prisma.$transaction([
    ...beforePrismaPromises,
    ...operations,
    ...afterPrismaPromises,
  ]);

  return results.slice(
    beforePrismaPromises.length,
    beforePrismaPromises.length + operations.length
  ) as UnwrapTuple<Promises>;
}

export async function applyDataPipeOutput<DataType>(
  outputs: (DataPipeOutput | DataPipeOperations | undefined | null)[],
  operation: Prisma.PrismaPromise<DataType>
): Promise<DataType> {
  const { beforePrismaPromises = [], afterPrismaPromises = [] } =
    mergePipeOperations(outputs);
  const results = await prisma.$transaction([
    ...beforePrismaPromises,
    operation,
    ...afterPrismaPromises,
  ]);

  return results[beforePrismaPromises.length] as DataType;
}

export async function applyDataPipeOutputWithoutOperation(
  outputs: (DataPipeOutput | DataPipeOperations | undefined | null)[]
): Promise<void> {
  const { beforePrismaPromises = [], afterPrismaPromises = [] } =
    mergePipeOperations(outputs);
  await prisma.$transaction([...beforePrismaPromises, ...afterPrismaPromises]);
}
