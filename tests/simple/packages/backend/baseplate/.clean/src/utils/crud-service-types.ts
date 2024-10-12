import { ServiceContext } from './service-context.js';

export interface CreateServiceInput<
  CreateData,
  Query,
  Context extends ServiceContext = ServiceContext,
> {
  data: CreateData;
  context: Context;
  query?: Query;
}

export interface UpdateServiceInput<
  PrimaryKey,
  UpdateData,
  Query,
  Context extends ServiceContext = ServiceContext,
> {
  id: PrimaryKey;
  data: UpdateData;
  context: Context;
  query?: Query;
}

export interface DeleteServiceInput<
  PrimaryKey,
  Query,
  Context extends ServiceContext = ServiceContext,
> {
  id: PrimaryKey;
  context: Context;
  query?: Query;
}
