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
  outputs: (DataPipeOutput | undefined | null)[]
): DataPipeOperations {
  const operations = outputs.map((o) => o?.operations).filter(notEmpty);

  return {
    beforePrismaPromises: operations.flatMap(
      (op) => op.beforePrismaPromises || []
    ),
    afterPrismaPromises: operations.flatMap(
      (op) => op.afterPrismaPromises || []
    ),
  };
}

export async function applyDataPipeOutput<DataType>(
  outputs: (DataPipeOutput | undefined | null)[],
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
