// @ts-nocheck

import { notEmpty } from '%ts-utils/arrays';
import { ServiceContext } from '%service-context';
import { UpsertPayload } from './embedded-types';
import { DataPipeOutput, mergePipeOperations } from '../data-pipes';

// Create Helpers

interface OneToManyCreatePipeInput<DataInput> {
  input: DataInput[] | undefined;
  transform?: undefined;
  context?: undefined;
}

interface OneToManyCreatePipeInputWithTransform<
  DataInput,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
> {
  input: DataInput[] | undefined;
  transform: (
    input: DataInput,
    context: ServiceContext,
  ) => Promise<DataPipeOutput<UpsertData>> | DataPipeOutput<UpsertData>;
  context: ServiceContext;
}

export async function createOneToManyCreateData<
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
  | OneToManyCreatePipeInput<DataInput>
  | OneToManyCreatePipeInputWithTransform<DataInput, UpsertData>): Promise<
  DataPipeOutput<{ create: UpsertData['create'][] } | undefined>
> {
  if (!input) {
    return { data: undefined, operations: {} };
  }

  async function transformCreateInput(
    item: DataInput,
  ): Promise<DataPipeOutput<UpsertData>> {
    return transform
      ? transform(item, context)
      : ({
          data: { create: item, update: item },
        } as DataPipeOutput<UpsertData>);
  }

  const createOutputs = await Promise.all(
    input.map(async (item) => {
      const output = await transformCreateInput(item);
      return {
        data: output.data.create,
        operations: output.operations,
      };
    }),
  );

  return {
    data: { create: createOutputs.map((output) => output.data) },
    operations: mergePipeOperations(createOutputs),
  };
}

// Upsert Helpers

interface UpsertManyPayload<
  UpsertData extends UpsertPayload<unknown, unknown>,
  WhereUniqueInput,
  IdField extends string | number | symbol,
  IdType = string,
> {
  deleteMany?: { [key in IdField]: { notIn: IdType[] } };
  upsert?: {
    where: WhereUniqueInput;
    create: UpsertData['create'];
    update: UpsertData['update'];
  }[];
  create: UpsertData['create'][];
}

interface OneToManyUpsertPipeInput<
  DataInput,
  WhereUniqueInput,
  IdField extends keyof DataInput,
> {
  input: DataInput[] | undefined;
  idField: IdField;
  getWhereUnique: (input: DataInput) => WhereUniqueInput | undefined;
  transform?: undefined;
  context?: undefined;
  parentId?: undefined;
}

interface OneToManyUpsertPipeInputWithTransform<
  DataInput,
  WhereUniqueInput,
  IdField extends keyof DataInput,
  ParentId = unknown,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
> {
  input: DataInput[] | undefined;
  context: ServiceContext;
  idField: IdField;
  getWhereUnique: (input: DataInput) => WhereUniqueInput | undefined;
  transform: (
    input: DataInput,
    context: ServiceContext,
    updateKey?: WhereUniqueInput,
    parentId?: ParentId,
  ) => Promise<DataPipeOutput<UpsertData>> | DataPipeOutput<UpsertData>;
  parentId?: ParentId;
}

export async function createOneToManyUpsertData<
  DataInput,
  WhereUniqueInput,
  IdField extends keyof DataInput,
  ParentId = unknown,
  UpsertData extends UpsertPayload<unknown, unknown> = {
    create: DataInput;
    update: DataInput;
  },
>({
  input,
  idField,
  context,
  getWhereUnique,
  transform,
  parentId,
}:
  | OneToManyUpsertPipeInput<DataInput, WhereUniqueInput, IdField>
  | OneToManyUpsertPipeInputWithTransform<
      DataInput,
      WhereUniqueInput,
      IdField,
      ParentId,
      UpsertData
    >): Promise<
  DataPipeOutput<
    | UpsertManyPayload<
        UpsertData,
        WhereUniqueInput,
        IdField,
        Exclude<DataInput[IdField], undefined>
      >
    | undefined
  >
> {
  if (!input) {
    return { data: undefined, operations: {} };
  }

  async function transformCreateInput(
    item: DataInput,
  ): Promise<DataPipeOutput<UpsertData>> {
    return transform
      ? transform(item, context, undefined, parentId)
      : ({
          data: { create: item, update: item },
        } as DataPipeOutput<UpsertData>);
  }

  const createOutputPromise = Promise.all(
    input
      .filter(
        (item) =>
          item[idField] === undefined || getWhereUnique(item) === undefined,
      )
      .map(async (item) => {
        const output = await transformCreateInput(item);
        return {
          data: output.data.create,
          operations: output.operations,
        };
      }),
  );

  async function transformUpsertInput(
    item: DataInput,
  ): Promise<DataPipeOutput<UpsertData>> {
    return transform
      ? transform(item, context, getWhereUnique(item), parentId)
      : ({
          data: { create: item, update: item },
        } as DataPipeOutput<UpsertData>);
  }

  const upsertOutputPromise = Promise.all(
    input
      .filter((item) => item[idField] !== undefined && getWhereUnique(item))
      .map(async (item) => {
        const output = await transformUpsertInput(item);
        return {
          data: {
            where: getWhereUnique(item) as WhereUniqueInput,
            create: output.data.create,
            update: output.data.update,
          },
          operations: output.operations,
        };
      }),
  );

  const [upsertOutput, createOutput] = await Promise.all([
    upsertOutputPromise,
    createOutputPromise,
  ]);

  return {
    data: {
      deleteMany:
        idField &&
        ({
          [idField]: {
            notIn: input.map((data) => data[idField]).filter(notEmpty),
          },
        } as {
          [key in IdField]: {
            notIn: Exclude<DataInput[IdField], undefined>[];
          };
        }),
      upsert: upsertOutput.map((output) => output.data),
      create: createOutput.map((output) => output.data),
    },
    operations: mergePipeOperations([...upsertOutput, ...createOutput]),
  };
}
