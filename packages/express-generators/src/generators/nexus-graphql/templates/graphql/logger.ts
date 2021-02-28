import type { ApolloServerPlugin } from 'apollo-server-plugin-base';

const GraphQLLogger: ApolloServerPlugin = {
  requestDidStart() {
    const startTime = Date.now();
    return {
      willSendResponse(context) {
        const duration = Date.now() - startTime;
        const operationType = context.operation?.operation || 'Unknown';
        const operationName = context.operationName || 'Unknown';
        const { variables } = context.request;
        console.log(
          `[${operationType}] ${operationName || 'Unknown'} ${JSON.stringify(
            variables
          )} - ${duration}ms`
        );
        context.errors?.forEach((err) => {
          console.error(err);
        });
      },
    };
  },
};

export default GraphQLLogger;
