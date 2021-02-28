import { ApolloServerExpressConfig } from 'apollo-server-express';

export interface Context {
  CONTEXT_INTERFACE;
}

export const serverContext: ApolloServerExpressConfig['context'] = async ({
  req,
  res,
}): Promise<Context> => {
  CONTEXT_SETUP;

  return CONTEXT_OBJECT;
};
