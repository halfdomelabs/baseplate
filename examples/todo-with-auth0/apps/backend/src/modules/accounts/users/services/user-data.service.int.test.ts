import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { createUser, deleteUser, updateUser } from './user.data-service.js';

// Mock storage adapters to return successful metadata
// The mock returns dynamic size based on the path
vi.mock('@src/modules/storage/config/adapters.config.js', () => ({
  STORAGE_ADAPTERS: {
    uploads: {
      getFileMetadata: vi.fn().mockImplementation((path: string) => {
        // Extract filename from path to determine size
        if (path.includes('avatar.png')) return Promise.resolve({ size: 1024 });
        if (path.includes('avatar1.png'))
          return Promise.resolve({ size: 1024 });
        if (path.includes('avatar2.png'))
          return Promise.resolve({ size: 2048 });
        if (path.includes('image1.png')) return Promise.resolve({ size: 2048 });
        if (path.includes('image2.png')) return Promise.resolve({ size: 3072 });
        if (path.includes('image3.png')) return Promise.resolve({ size: 4096 });
        return Promise.resolve({ size: 1024 });
      }),
    },
    url: {
      getFileMetadata: vi.fn().mockResolvedValue({ size: 1024 }),
    },
  },
}));

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

  it('should create a user with userProfile and avatar file', async () => {
    // Create a test user for file ownership
    const testUser = await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: 'test-uploader@example.com',
      },
    });

    // Create a file for the avatar
    const file = await prisma.file.create({
      data: {
        filename: 'avatar.png',
        storagePath: '/uploads/avatar.png',
        category: 'USER_PROFILE_AVATAR',
        adapter: 'uploads',
        uploaderId: testUser.id,
        mimeType: 'image/png',
        size: 1024,
      },
    });

    const createdUser = await createUser({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        userProfile: {
          bio: 'Software developer',
          avatar: { id: file.id },
        },
      },
      context,
    });

    const userCheck = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: {
        userProfile: {
          include: { avatar: true },
        },
      },
    });

    expect(userCheck).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      userProfile: {
        bio: 'Software developer',
        avatar: {
          id: file.id,
          filename: 'avatar.png',
          referencedAt: expect.any(Date),
          size: 1024,
        },
      },
    });
  });

  it('should create a user with nested images', async () => {
    // Create a test user for file ownership
    const testUser = await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: 'test-uploader@example.com',
      },
    });

    // Create files for the images
    const file1 = await prisma.file.create({
      data: {
        filename: 'image1.png',
        storagePath: '/uploads/image1.png',
        category: 'USER_IMAGE_FILE',
        adapter: 'uploads',
        uploaderId: testUser.id,
        mimeType: 'image/png',
        size: 2048,
      },
    });

    const file2 = await prisma.file.create({
      data: {
        filename: 'image2.png',
        storagePath: '/uploads/image2.png',
        category: 'USER_IMAGE_FILE',
        adapter: 'uploads',
        uploaderId: testUser.id,
        mimeType: 'image/png',
        size: 3072,
      },
    });

    const createdUser = await createUser({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        images: [
          {
            id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
            caption: 'First image',
            file: { id: file1.id },
          },
          {
            id: '77362d38-abb6-4778-95bd-f6f398bc5c55',
            caption: 'Second image',
            file: { id: file2.id },
          },
        ],
      },
      context,
    });

    const userCheck = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: {
        images: {
          include: { file: true },
          orderBy: { caption: 'asc' },
        },
      },
    });

    expect(userCheck?.images).toHaveLength(2);
    expect(userCheck).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      images: [
        {
          id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
          caption: 'First image',
          file: {
            id: file1.id,
            filename: 'image1.png',
            referencedAt: expect.any(Date),
            size: 2048,
          },
        },
        {
          id: '77362d38-abb6-4778-95bd-f6f398bc5c55',
          caption: 'Second image',
          file: {
            id: file2.id,
            filename: 'image2.png',
            referencedAt: expect.any(Date),
            size: 3072,
          },
        },
      ],
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
