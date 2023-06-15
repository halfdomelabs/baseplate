// @ts-nocheck

import { ServiceContext } from '%service-context';

export interface CreateServiceInput<
  CreateData,
  Query,
  Context extends ServiceContext = ServiceContext
> {
  data: CreateData;
  context: Context;
  query?: Query;
}

export interface UpdateServiceInput<
  PrimaryKey,
  UpdateData,
  Query,
  Context extends ServiceContext = ServiceContext
> {
  id: PrimaryKey;
  data: UpdateData;
  context: Context;
  query?: Query;
}
