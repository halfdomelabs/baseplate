import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { userImageFileFileCategory } from '../constants/file-categories.js';
import { createUser, deleteUser, updateUser } from './user-data.service.js';

// Create a test user ID for file uploads
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

const context = createTestServiceContext();

describe('createUser', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  it('should create a user with basic fields', async () => {
    const createdUser = await createUser({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      context,
    });

    expect(createdUser).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should create a user with nested customer', async () => {
    const createdUser = await createUser({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        customer: {
          stripeCustomerId: 'cus_123456789',
        },
      },
      context,
    });

    const userCheck = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { customer: true },
    });

    expect(userCheck).toMatchObject({
      customer: {
        stripeCustomerId: 'cus_123456789',
      },
    });
  });
});

describe('updateUser', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  it('should update basic user fields', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    const updatedUser = await updateUser({
      where: { id: user.id },
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      context,
    });

    expect(updatedUser).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
  });
});

describe('deleteUser', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  it('should delete a user', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    await deleteUser({
      where: { id: user.id },
      context,
    });

    const userCheck = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(userCheck).toBeNull();
  });
});
