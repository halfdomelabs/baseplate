// @ts-nocheck

import type { RequestServiceContext } from '%requestServiceContextImports';
import type { UserSessionPayload } from '%userSessionTypesImports';
import type { User } from '@prisma/client';

import { PASSWORD_MIN_LENGTH } from '$constantsPassword';
import {
  BadRequestError,
  handleZodRequestValidationError,
} from '%errorHandlerServiceImports';
import {
  createPasswordHash,
  verifyPasswordHash,
} from '%passwordHasherServiceImports';
import { prisma } from '%prismaImports';
import { userSessionService } from '%userSessionServiceImports';
import z from 'zod';

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
  context,
}: {
  input: {
    email: string;
    password: string;
  };
  context: RequestServiceContext;
}): Promise<{ session: UserSessionPayload; user: User }> {
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
