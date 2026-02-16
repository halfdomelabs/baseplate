import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { cleanUnusedFiles } from './clean-unused-files.js';

// Mock logger to suppress output during tests
vi.mock('@src/services/logger.js', () => ({
  logger: createMockLogger(),
}));

// Mock storage adapters to prevent actual S3 calls
vi.mock('../config/adapters.config.js', () => ({
  STORAGE_ADAPTERS: {
    uploads: {
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      fileExists: vi.fn(),
      getFileMetadata: vi.fn(),
      deleteFiles: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
    },
    url: {
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      fileExists: vi.fn(),
      getFileMetadata: vi.fn(),
    },
  },
}));

// Helper to create file with specific age
async function createFileWithAge(
  daysOld: number,
  referencedAt: Date | null,
  adapter = 'uploads',
  category = 'TODO_LIST_COVER_PHOTO',
): Promise<string> {
  const file = await prisma.file.create({
    data: {
      filename: `test-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      encoding: null,
      size: 1024,
      category,
      adapter,
      storagePath: `/test/path-${Date.now()}.jpg`,
      referencedAt,
      createdAt: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000),
    },
  });
  return file.id;
}

// Helper to count files in database
async function countFiles(): Promise<number> {
  return prisma.file.count();
}

// Helper to create test user
async function createTestUser(): Promise<string> {
  const user = await prisma.user.create({
    data: {
      auth0Id: `test-auth0-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      userProfile: {
        create: {},
      },
    },
  });
  return user.id;
}

describe('cleanUnusedFiles integration tests', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const deleteFilesMock = vi.mocked(STORAGE_ADAPTERS.uploads.deleteFiles);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up all test data
    await prisma.todoList.deleteMany();
    await prisma.userImage.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('unreferenced file expiry', () => {
    it('should delete unreferenced files older than 1 day', async () => {
      await createFileWithAge(2, null);

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(1);
      expect(await countFiles()).toBe(0);
      // Verify adapter deleteFiles was called
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('/test/path')]),
      );
    });

    it('should NOT delete unreferenced files younger than 1 day', async () => {
      await createFileWithAge(0.5, null);

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(0);
      expect(await countFiles()).toBe(1);
    });

    it('should handle multiple unreferenced files with mixed ages', async () => {
      await createFileWithAge(2, null);
      await createFileWithAge(3, null);
      await createFileWithAge(0.5, null);
      await createFileWithAge(0.2, null);

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(2); // Only the 2 old files
      expect(await countFiles()).toBe(2); // 2 new files remain
      // Verify adapter deleteFiles was called with 2 paths
      expect(deleteFilesMock).toHaveBeenCalledTimes(1);
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('/test/path'),
          expect.stringContaining('/test/path'),
        ]),
      );
    });
  });

  describe('referenced files with no relations', () => {
    it('should delete file after owning entity is deleted', async () => {
      const userId = await createTestUser();
      const fileId = await createFileWithAge(0, new Date());

      // Create TodoList with cover photo
      const todoList = await prisma.todoList.create({
        data: {
          name: 'Test List',
          position: 0,
          ownerId: userId,
          coverPhotoId: fileId,
        },
      });

      // File should NOT be deleted while TodoList exists
      expect(await cleanUnusedFiles()).toBe(0);

      // Delete TodoList
      await prisma.todoList.delete({ where: { id: todoList.id } });

      // Now file should be deleted
      expect(await cleanUnusedFiles()).toBe(1);
      expect(await countFiles()).toBe(0);
    });
  });

  describe('referenced files with active relations', () => {
    it('should NOT delete file when entity with reference exists', async () => {
      const userId = await createTestUser();
      const fileId = await createFileWithAge(0, new Date());

      await prisma.todoList.create({
        data: {
          name: 'Test List',
          position: 0,
          ownerId: userId,
          coverPhotoId: fileId,
        },
      });

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(0);
      expect(await countFiles()).toBe(1);
    });
  });

  describe('batch limit', () => {
    it('should delete only 100 files in one run', async () => {
      // Create 150 unreferenced old files
      const filePromises = [];
      for (let i = 0; i < 150; i++) {
        filePromises.push(createFileWithAge(2, null));
      }
      await Promise.all(filePromises);

      expect(await countFiles()).toBe(150);

      // First run should delete 100
      expect(await cleanUnusedFiles()).toBe(100);
      expect(await countFiles()).toBe(50);

      // Second run should delete remaining 50
      expect(await cleanUnusedFiles()).toBe(50);
      expect(await countFiles()).toBe(0);
    });
  });

  describe('mixed scenarios', () => {
    it('should correctly identify and delete unused files in complex scenario', async () => {
      const userId = await createTestUser();

      // 1. Unreferenced old file (should be deleted)
      await createFileWithAge(2, null);
      // 2. Unreferenced new file (should NOT be deleted)
      await createFileWithAge(0.5, null);
      // 3. Referenced file with active relation (should NOT be deleted)
      const activeFileId = await createFileWithAge(0, new Date());
      await prisma.todoList.create({
        data: {
          name: 'Active List',
          position: 0,
          ownerId: userId,
          coverPhotoId: activeFileId,
        },
      });
      // 4. Referenced file without relation (should be deleted)
      await createFileWithAge(0, new Date());

      expect(await countFiles()).toBe(4);

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(2); // Files 1 and 4
      expect(await countFiles()).toBe(2); // Files 2 and 3 remain
    });

    it('should handle files from different adapters', async () => {
      await createFileWithAge(2, null, 'uploads');
      await createFileWithAge(2, null, 'url');
      await createFileWithAge(0.5, null, 'uploads');

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(2); // 2 old files
      expect(await countFiles()).toBe(1); // 1 new file remains
      // Verify adapter deleteFiles was called for uploads adapter only
      expect(deleteFilesMock).toHaveBeenCalledTimes(1);
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('/test/path')]),
      );
    });
  });
});
