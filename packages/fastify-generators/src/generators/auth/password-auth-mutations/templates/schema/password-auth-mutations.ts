// @ts-nocheck
import { createStandardMutation } from '%nexus/utils';
import { passwordAuthService } from '%password-auth-service';
import { formatRefreshTokens } from '%auth-mutations/refresh-token';

export const loginWithEmailAndPasswordMutation = createStandardMutation({
  name: 'loginWithEmailAndPassword',
  inputDefinition: (t) => {
    t.nonNull.string('email');
    t.nonNull.string('password');
  },
  payloadDefinition: (t) => {
    t.nonNull.field('user', { type: 'User' });
    t.nonNull.field('authPayload', { type: 'AuthPayload' });
  },
  authorize: 'anonymous',
  resolve: async (root, { input }, context) => {
    const payload = await passwordAuthService.loginWithPassword(
      input.email,
      input.password,
    );
    const user = await USER_MODEL.findUniqueOrThrow({
      where: { id: payload.userId },
    });
    return { user, authPayload: formatRefreshTokens(context, payload) };
  },
});
