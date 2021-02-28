import { ApolloServer } from 'apollo-server-express';
import { serverContext } from './context';
import GraphQLLogger from './logger';
import { buildSchema } from './schema';

export function createApolloServer(): ApolloServer {
  const schema = buildSchema();
  return new ApolloServer({
    schema,
    plugins: [GraphQLLogger],
    context: serverContext,
  });
}
