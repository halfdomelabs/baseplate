import { describe, expect, it } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { createUser, updateUser } from './user.crud.js';

const context = createTestServiceContext();

describe('create', () => {
  it('should create nested todo item', async () => {
    await prisma.user.deleteMany({});

    const createdItem = await createUser({
      data: {
        email: 'foo@example.com',
        roles: [{ role: 'admin' }, { role: 'user' }],
        customer: {
          stripeCustomerId: '123',
        },
        userProfile: {
          bio: 'Hi',
        },
      },
      context,
    });

    const itemCheck = await prisma.user.findUnique({
      where: { id: createdItem.id },
      include: {
        userProfile: true,
        customer: true,
        roles: true,
      },
    });

    expect(itemCheck).toMatchObject({
      id: createdItem.id,
      email: 'foo@example.com',
      roles: [{ role: 'admin' }, { role: 'user' }],
      customer: {
        stripeCustomerId: '123',
      },
      userProfile: {
        bio: 'Hi',
      },
    });

    await updateUser({
      id: createdItem.id,
      data: {
        roles: [{ role: 'kiosk' }],
        customer: {
          stripeCustomerId: '321',
        },
        userProfile: {
          bio: 'Bye',
        },
      },
      context,
    });

    const updatedItemWithAttachments = await prisma.user.findUnique({
      where: { id: createdItem.id },
      include: {
        userProfile: true,
        customer: true,
        roles: true,
      },
    });

    expect(updatedItemWithAttachments).toMatchObject({
      id: createdItem.id,
      roles: [{ role: 'kiosk' }],
      customer: {
        stripeCustomerId: '321',
      },
      userProfile: {
        bio: 'Bye',
      },
    });
  });
});
