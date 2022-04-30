import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { reactErrorProvider } from '../../core/react-error';
import { reactLoggerProvider } from '../../core/react-logger';
import { reactApolloSetupProvider } from '../react-apollo';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const ApolloErrorLinkGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactApolloSetup: reactApolloSetupProvider,
    reactError: reactErrorProvider,
    reactLogger: reactLoggerProvider,
  },
  createGenerator(descriptor, { reactApolloSetup, reactError, reactLogger }) {
    reactApolloSetup.addLink({
      name: 'errorLink',
      bodyExpression: TypescriptCodeUtils.createBlock(
        `const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error) => {
      const { message, path, extensions } = error;
      const errorExtensions: ErrorExtensions | undefined = extensions;
      if (
        errorExtensions?.code &&
        (!errorExtensions?.statusCode || errorExtensions?.statusCode >= 500)
      ) {
        // TODO: Figure out better condition e.g. need to record 401 unauthorized
        reportError(error);
      }
      logger.error(
        \`[GraphQL error]: Message: \${message}, Path: \${path?.join(",") || ""}\`
      );
    });
  }

  if (networkError) {
    logger.error(networkError);
  }
});`,
        [
          'import { reportError } from "%react-error/logger"',
          'import { logger } from "%react-logger"',
          'import { onError } from "@apollo/client/link/error"',
        ],
        {
          importMappers: [reactError, reactLogger],
          headerBlocks: [
            TypescriptCodeUtils.createBlock(
              `interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}`,
              undefined,
              { headerKey: 'ErrorExtensions' }
            ),
          ],
        }
      ),
    });
    return {
      build: async () => {},
    };
  },
});

export default ApolloErrorLinkGenerator;
