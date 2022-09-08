// @ts-nocheck
import { BadRequestError, NotFoundError } from '%http-errors';
import { hasherService } from '%password-hasher-service';
import { AuthPayload, loginUser } from '%auth-service';

export const passwordAuthService = {
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<AuthPayload> {
    const user = await USER_MODEL.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'user-not-found');
    }

    if (!user.passwordHash) {
      throw new BadRequestError('User has no password', 'user-has-no-password');
    }

    if (!(await hasherService.compare(password, user.passwordHash))) {
      throw new BadRequestError('Invalid password', 'invalid-password');
    }

    return loginUser(user.id);
  },
};
