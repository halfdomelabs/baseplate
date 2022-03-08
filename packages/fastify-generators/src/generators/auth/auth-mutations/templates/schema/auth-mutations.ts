// @ts-nocheck
import { objectType } from 'nexus';

export const authPayloadObjectType = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('refreshToken');
    t.nonNull.string('accessToken');
  },
});

export const refreshTokenMutation = STANDARD_MUTATION({
  name: 'refreshToken',
  inputDefinition: (t) => {
    t.nonNull.string('userId');
    t.nonNull.string('refreshToken');
  },
  payloadDefinition: (t) => {
    t.nonNull.field('authPayload', { type: 'AuthPayload' });
  },
  resolve: async (root, { input }) => {
    const payload = await AUTH_SERVICE.refreshToken(
      input.userId,
      input.refreshToken
    );
    return { authPayload: payload };
  },
});
