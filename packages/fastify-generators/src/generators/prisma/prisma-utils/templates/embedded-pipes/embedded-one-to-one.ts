// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { Prisma } from '@prisma/client';

import type { DataPipeOutput } from '../data-pipes.js';
import type { UpsertPayload } from './embedded-types.js';

// Create Helpers

interface OneToOneCreatePipeInput<DataInput> {
  input: DataInput | undefined;
  transform?: undefined;
  context?: undefined;
}

interface OneToOneCreatePipeInputWithTransform<
  DataInput,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
> {
  input: DataInput | undefined;
  transform: (
    input: DataInput,
    context: ServiceContext,
  ) => Promise<DataPipeOutput<UpsertData>> | DataPipeOutput<UpsertData>;
  context: ServiceContext;
}

export async function createOneToOneCreateData<
  DataInput,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
>({
  input,
  context,
  transform,
}:
  | OneToOneCreatePipeInput<DataInput>
  | OneToOneCreatePipeInputWithTransform<DataInput, UpsertData>): Promise<
  DataPipeOutput<{ create: UpsertData['create'] } | undefined>
> {
  if (!input) {
    return { data: undefined, operations: {} };
  }
  if (transform) {
    const transformedData = await Promise.resolve(transform(input, context));
    return {
      data: { create: transformedData.data.create },
      operations: transformedData.operations,
    };
  }

  return {
    data: { create: input },
  };
}

// Upsert helpers

interface OneToOneUpsertPipeInput<DataInput> {
  input: DataInput | null | undefined;
  transform?: undefined;
  context?: undefined;
  getWhereUnique?: undefined;
  parentId?: undefined;
  deleteRelation: () => Prisma.PrismaPromise<unknown>;
}

interface OneToOneUpsertPipeInputWithTransform<
  DataInput,
  WhereUniqueInput extends object,
  ParentId = unknown,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
> {
  input: DataInput | null | undefined;
  transform: (
    input: DataInput,
    context: ServiceContext,
    updateKey?: WhereUniqueInput,
    parentId?: ParentId,
  ) => Promise<DataPipeOutput<UpsertData>> | DataPipeOutput<UpsertData>;
  context: ServiceContext;
  getWhereUnique: (input: DataInput) => WhereUniqueInput | undefined;
  parentId?: ParentId;
  deleteRelation: () => Prisma.PrismaPromise<unknown>;
}

export async function createOneToOneUpsertData<
  DataInput,
  WhereUniqueInput extends object,
  ParentId,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
>({
  input,
  context,
  transform,
  getWhereUnique,
  parentId,
  deleteRelation,
}:
  | OneToOneUpsertPipeInput<DataInput>
  | OneToOneUpsertPipeInputWithTransform<
      DataInput,
      WhereUniqueInput,
      ParentId,
      UpsertData
    >): Promise<
  DataPipeOutput<{ upsert: UpsertData } | { delete: true } | undefined>
> {
  if (input === null) {
    return {
      data: undefined,
      operations: { beforePrismaPromises: [deleteRelation()] },
    };
  }
  if (input === undefined) {
    return { data: undefined, operations: {} };
  }
  if (transform) {
    const transformedData = await Promise.resolve(
      transform(input, context, getWhereUnique(input), parentId),
    );
    return {
      data: { upsert: transformedData.data },
      operations: transformedData.operations,
    };
  }

  return {
    data: {
      upsert: {
        create: input,
        update: input,
      } as UpsertData,
    },
  };
}
