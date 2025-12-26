/* eslint-disable @typescript-eslint/unbound-method -- see https://github.com/vitest-dev/eslint-plugin-vitest/issues/591 */
import { gql } from '@apollo/client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { logError } from '../error-logger';
import { logger } from '../logger';
import { userSessionClient } from '../user-session-client';
import { createApolloClient } from './index';

// Mock dependencies - must be hoisted before imports
vi.mock('../error-logger', () => ({
  logError: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../user-session-client', () => ({
  userSessionClient: {
    signOut: vi.fn(),
    signIn: vi.fn(),
    getUserId: vi.fn(),
  },
}));

vi.mock('./apollo-sentry-link', () => ({
  apolloSentryLink: {
    // Pass-through link that does nothing
    request: (operation: unknown, forward: (op: unknown) => unknown) =>
      forward(operation),
  },
}));

vi.mock('../config', () => ({
  config: {
    VITE_GRAPH_API_ENDPOINT: 'http://localhost:4000/graphql',
  },
}));

const TEST_QUERY = gql`
  query TestQuery {
    test {
      id
    }
  }
`;

const TEST_MUTATION = gql`
  mutation TestMutation {
    doSomething {
      success
    }
  }
`;

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

describe('Apollo Client Error Handling', () => {
  const server = setupServer();

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  describe('errorLink', () => {
    it('should log GraphQL errors for query operations', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () =>
          HttpResponse.json({
            errors: [
              {
                message: 'Test GraphQL error',
                path: ['test', 'field'],
                extensions: { code: 'TEST_ERROR' },
              },
            ],
          }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify logger.error was called with the error message
      expect(vi.mocked(logger).error).toHaveBeenCalledWith(
        expect.stringContaining('[GraphQL Error]'),
      );
      expect(vi.mocked(logger).error).toHaveBeenCalledWith(
        expect.stringContaining('Test GraphQL error'),
      );

      // Verify logError was called with a GraphQLError that includes extensions
      expect(vi.mocked(logError)).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test GraphQL error',
          extensions: expect.objectContaining({ code: 'TEST_ERROR' }) as unknown,
        }),
      );
    });

    it('should NOT log errors for mutation operations', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () =>
          HttpResponse.json({
            errors: [
              {
                message: 'Mutation error',
                path: ['doSomething'],
              },
            ],
          }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.mutate({ mutation: TEST_MUTATION });
      } catch {
        // Expected to throw
      }

      // Verify logger.error was NOT called (mutations are handled by caller)
      expect(vi.mocked(logger).error).not.toHaveBeenCalled();
      expect(vi.mocked(logError)).not.toHaveBeenCalled();
    });

    it('should log and report network errors with status codes', async () => {
      server.use(
        http.post(
          GRAPHQL_ENDPOINT,
          () =>
            new HttpResponse(
              JSON.stringify({ message: 'Internal Server Error' }),
              { status: 500 },
            ),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify logError was called to report the server error
      expect(vi.mocked(logError)).toHaveBeenCalled();
    });
  });

  describe('sessionErrorLink', () => {
    it('should sign out on 401 with invalid-session code', async () => {
      server.use(
        http.post(
          GRAPHQL_ENDPOINT,
          () =>
            new HttpResponse(JSON.stringify({ code: 'invalid-session' }), {
              status: 401,
            }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify userSessionClient.signOut was called
      expect(vi.mocked(userSessionClient).signOut).toHaveBeenCalled();
    });

    it('should NOT sign out on 401 without invalid-session code', async () => {
      server.use(
        http.post(
          GRAPHQL_ENDPOINT,
          () =>
            new HttpResponse(JSON.stringify({ code: 'different-error' }), {
              status: 401,
            }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify userSessionClient.signOut was NOT called
      expect(vi.mocked(userSessionClient).signOut).not.toHaveBeenCalled();
    });

    it('should NOT sign out on non-401 errors', async () => {
      server.use(
        http.post(
          GRAPHQL_ENDPOINT,
          () =>
            new HttpResponse(JSON.stringify({ code: 'invalid-session' }), {
              status: 403,
            }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify userSessionClient.signOut was NOT called (wrong status code)
      expect(vi.mocked(userSessionClient).signOut).not.toHaveBeenCalled();
    });

    it('should handle non-JSON response bodies gracefully', async () => {
      server.use(
        http.post(
          GRAPHQL_ENDPOINT,
          () => new HttpResponse('Unauthorized', { status: 401 }),
        ),
      );

      const client = createApolloClient();

      try {
        await client.query({ query: TEST_QUERY });
      } catch {
        // Expected to throw
      }

      // Verify userSessionClient.signOut was NOT called (body is not JSON)
      expect(vi.mocked(userSessionClient).signOut).not.toHaveBeenCalled();
    });
  });
});
