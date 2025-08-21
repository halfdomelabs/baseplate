import type { User } from '@prisma/client';

import z from 'zod';

import type { RequestServiceContext } from '@src/utils/request-service-context.js';

import { prisma } from '@src/services/prisma.js';
import { BadRequestError, NotFoundError } from '@src/utils/http-errors.js';
import { handleZodRequestValidationError } from '@src/utils/zod.js';

import type { UserSessionPayload } from '../../types/user-session.types.js';

import { userSessionService } from '../../services/user-session.service.js';
import { PASSWORD_MIN_LENGTH } from '../constants/password.constants.js';
import {
  createPasswordHash,
  verifyPasswordHash,
} from './password-hasher.service.js';

const PROVIDER_ID = 'email-password';

const MAX_VALUE_LENGTH = 255;

const emailPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .max(MAX_VALUE_LENGTH)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(MAX_VALUE_LENGTH),
});

export async function createUserWithEmailAndPassword({
  input,
}: {
  input: {
    email: string;
    password: string;
  };
}): Promise<User> {
  const { email, password } = await emailPasswordSchema
    .parseAsync(input)
    .catch(handleZodRequestValidationError);
  // check if user with that email already exists
  const existingUser = await prisma.userAccount.findUnique({
    where: {
      accountId_providerId: {
        accountId: email,
        providerId: PROVIDER_ID,
      },
    },
  });

  if (existingUser !== null) {
    throw new BadRequestError('Email already taken', 'email-taken');
  }

  // create user
  const user = await prisma.user.create({
    data: {
      email,
      accounts: {
        create: {
          accountId: email,
          providerId: PROVIDER_ID,
          password: await createPasswordHash(password),
        },
      },
    },
  });

  return user;
}

export async function registerUserWithEmailAndPassword({
  input,
  context,
}: {
  input: {
    email: string;
    password: string;
  };
  context: RequestServiceContext;
}): Promise<{ session: UserSessionPayload; user: User }> {
  const user = await createUserWithEmailAndPassword({ input });
  const session = await userSessionService.createSession(user.id, context);

  return { session, user };
}

export async function authenticateUserWithEmailAndPassword({
  input,
  context,
}: {
  input: {
    email: string;
    password: string;
  };
  context: RequestServiceContext;
}): Promise<{ session: UserSessionPayload }> {
  const { email, password } = await emailPasswordSchema
    .parseAsync(input)
    .catch(handleZodRequestValidationError);

  // check if user with that email exists
  const userAccount = await prisma.userAccount.findUnique({
    where: {
      accountId_providerId: {
        accountId: email,
        providerId: PROVIDER_ID,
      },
    },
  });

  if (userAccount === null) {
    throw new BadRequestError('Invalid email', 'invalid-email');
  }

  // check for password match
  const isValid = await verifyPasswordHash(
    userAccount.password ?? '',
    password,
  );
  if (!isValid) {
    throw new BadRequestError('Invalid password', 'invalid-password');
  }

  const session = await userSessionService.createSession(
    userAccount.userId,
    context,
  );

  return { session };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(MAX_VALUE_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(MAX_VALUE_LENGTH),
});

/**
 * Change a user's password after validating their current password.
 * This is used when a user wants to change their own password.
 *
 * @param params - The parameters for changing password
 * @param params.userId - The ID of the user changing their password
 * @param params.input - The current and new password
 * @returns The updated user
 */
export async function changeUserPassword({
  userId,
  input,
}: {
  userId: string;
  input: {
    currentPassword: string;
    newPassword: string;
  };
}): Promise<User> {
  const { currentPassword, newPassword } = await changePasswordSchema
    .parseAsync(input)
    .catch(handleZodRequestValidationError);

  // Get the user's account
  const userAccount = await prisma.userAccount.findFirst({
    where: {
      userId,
      providerId: PROVIDER_ID,
    },
  });

  // Verify current password
  const isValid = await verifyPasswordHash(
    userAccount?.password ?? '',
    currentPassword,
  );
  if (!isValid || !userAccount) {
    throw new BadRequestError(
      'Current password is incorrect',
      'invalid-current-password',
    );
  }

  // Update to new password
  await prisma.userAccount.update({
    where: {
      accountId_providerId: {
        accountId: userAccount.accountId,
        providerId: PROVIDER_ID,
      },
    },
    data: {
      password: await createPasswordHash(newPassword),
    },
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(MAX_VALUE_LENGTH),
});

/**
 * Reset a user's password without requiring the current password.
 * This is used by administrators to reset any user's password.
 *
 * @param params - The parameters for resetting password
 * @param params.userId - The ID of the user whose password is being reset
 * @param params.input - The new password
 * @returns The updated user
 */
export async function resetUserPassword({
  userId,
  input,
}: {
  userId: string;
  input: {
    newPassword: string;
  };
}): Promise<User> {
  const { newPassword } = await resetPasswordSchema
    .parseAsync(input)
    .catch(handleZodRequestValidationError);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user === null) {
    throw new NotFoundError('User not found', 'user-not-found');
  }

  if (!user.email) {
    throw new BadRequestError('User has no email', 'user-has-no-email');
  }

  // Get or create the user's password account
  const passwordHash = await createPasswordHash(newPassword);
  await prisma.userAccount.upsert({
    where: {
      accountId_providerId: {
        accountId: user.email,
        providerId: PROVIDER_ID,
      },
    },
    create: {
      user: {
        connect: {
          id: userId,
        },
      },
      accountId: user.email,
      providerId: PROVIDER_ID,
      password: passwordHash,
    },
    update: {
      password: passwordHash,
    },
  });

  return user;
}
