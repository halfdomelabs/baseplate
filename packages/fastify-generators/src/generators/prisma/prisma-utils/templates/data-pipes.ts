// @ts-nocheck

import { PrismaPromise } from '@prisma/client';
import { prisma } from '%prisma-service';
import { notEmpty } from '%ts-utils/arrays';

interface DataPipeOperations {
  beforePrismaPromises?: PrismaPromise<unknown>[];
  afterPrismaPromises?: PrismaPromise<unknown>[];
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

// Borrowed from Prisma generated code
type UnwrapPromise<P extends any> = P extends Promise<infer R> ? R : P;
type UnwrapTuple<Tuple extends readonly unknown[]> = {
  [K in keyof Tuple]: K extends `${number}`
    ? Tuple[K] extends PrismaPromise<infer X>
      ? X
      : UnwrapPromise<Tuple[K]>
    : UnwrapPromise<Tuple[K]>;
};

export async function applyDataPipeOutputToOperations<
  Promises extends PrismaPromise<any>[]
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
  operation: PrismaPromise<DataType>
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
