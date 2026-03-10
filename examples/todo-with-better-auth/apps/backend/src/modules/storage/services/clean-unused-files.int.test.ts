import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';

import type { FileCategory } from '../types/file-category.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { cleanUnusedFiles } from './clean-unused-files.js';

// Mock logger to suppress output during tests
vi.mock('@src/services/logger.js', () => ({
  logger: createMockLogger(),
}));

// Default categories matching the real config — tests can override via fileCategoriesOverride
const defaultFileCategories: FileCategory[] = [
  {
    name: 'TODO_LIST_COVER_PHOTO',
    adapter: 'uploads',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    referencedByRelations: ['todoListCoverPhoto'],
  },
  {
    name: 'USER_IMAGE_FILE',
    adapter: 'uploads',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    referencedByRelations: ['userImages'],
  },
  {
    name: 'USER_PROFILE_AVATAR',
    adapter: 'uploads',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    referencedByRelations: ['userProfileAvatar'],
  },
];

// Mock categories config to allow overriding FILE_CATEGORIES in specific tests
let fileCategoriesOverride: FileCategory[] | undefined;
vi.mock('../config/categories.config.js', () => ({
  get FILE_CATEGORIES() {
    return fileCategoriesOverride ?? defaultFileCategories;
  },
  getCategoryByName: (name: string) =>
    (fileCategoriesOverride ?? defaultFileCategories).find(
      (c) => c.name === name,
    ),
  getCategoryByNameOrThrow: (name: string) => {
    const category = (fileCategoriesOverride ?? defaultFileCategories).find(
      (c) => c.name === name,
    );
    if (!category) {
      throw new Error(`File category ${name} not found.`);
    }
    return category;
  },
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

/**
 * Helper to create a file record with a specific age and upload state.
 *
 * @param options - File creation options
 * @param options.daysOld - How many days old the file should be
 * @param options.pendingUpload - Whether the file is still pending upload
 * @param options.adapter - The storage adapter name (defaults to 'uploads')
 * @param options.category - The file category name (defaults to 'TODO_LIST_COVER_PHOTO')
 * @returns The created file's ID
 */
async function createFileWithAge({
  daysOld,
  pendingUpload,
  adapter = 'uploads',
  category = 'TODO_LIST_COVER_PHOTO',
}: {
  daysOld: number;
  pendingUpload: boolean;
  adapter?: string;
  category?: string;
}): Promise<string> {
  const file = await prisma.file.create({
    data: {
      filename: `test-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      encoding: null,
      size: 1024,
      category,
      adapter,
      storagePath: `/test/path-${Date.now()}.jpg`,
      pendingUpload,
      createdAt: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000),
    },
  });
  return file.id;
}

/**
 * Helper to count files in database.
 *
 * @returns The total number of file records
 */
async function countFiles(): Promise<number> {
  return prisma.file.count();
}

/**
 * Helper to create a test user with a profile.
 *
 * @returns The created user's ID
 */
async function createTestUser(): Promise<string> {
  const user = await prisma.user.create({
    data: {
      name: `Test User`,
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
    fileCategoriesOverride = undefined;
  });

  afterEach(async () => {
    // Clean up all test data
    await prisma.todoList.deleteMany();
    await prisma.userImage.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('pending upload expiry', () => {
    it('should delete pending uploads older than 1 day', async () => {
      await createFileWithAge({ daysOld: 2, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(1);
      expect(await countFiles()).toBe(0);
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('/test/path')]),
      );
    });

    it('should NOT delete pending uploads younger than 1 day', async () => {
      await createFileWithAge({ daysOld: 0.5, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(0);
      expect(await countFiles()).toBe(1);
    });

    it('should handle multiple pending uploads with mixed ages', async () => {
      await createFileWithAge({ daysOld: 2, pendingUpload: true });
      await createFileWithAge({ daysOld: 3, pendingUpload: true });
      await createFileWithAge({ daysOld: 0.5, pendingUpload: true });
      await createFileWithAge({ daysOld: 0.2, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(2); // Only the 2 old files
      expect(await countFiles()).toBe(2); // 2 new files remain
      expect(deleteFilesMock).toHaveBeenCalledTimes(1);
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('/test/path'),
          expect.stringContaining('/test/path'),
        ]),
      );
    });
  });

  describe('confirmed files with no relations (orphaned)', () => {
    it('should delete file after owning entity is deleted', async () => {
      const userId = await createTestUser();
      const fileId = await createFileWithAge({
        daysOld: 0,
        pendingUpload: false,
      });

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

      // Now file should be deleted (orphaned)
      expect(await cleanUnusedFiles()).toBe(1);
      expect(await countFiles()).toBe(0);
    });
  });

  describe('confirmed files with active relations', () => {
    it('should NOT delete file when entity with reference exists', async () => {
      const userId = await createTestUser();
      const fileId = await createFileWithAge({
        daysOld: 0,
        pendingUpload: false,
      });

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
      // Create 150 pending old files
      const filePromises = [];
      for (let i = 0; i < 150; i++) {
        filePromises.push(
          createFileWithAge({ daysOld: 2, pendingUpload: true }),
        );
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

      // 1. Pending old file (should be deleted)
      await createFileWithAge({ daysOld: 2, pendingUpload: true });
      // 2. Pending new file (should NOT be deleted)
      await createFileWithAge({ daysOld: 0.5, pendingUpload: true });
      // 3. Confirmed file with active relation (should NOT be deleted)
      const activeFileId = await createFileWithAge({
        daysOld: 0,
        pendingUpload: false,
      });
      await prisma.todoList.create({
        data: {
          name: 'Active List',
          position: 0,
          ownerId: userId,
          coverPhotoId: activeFileId,
        },
      });
      // 4. Confirmed file without relation (orphaned, should be deleted)
      await createFileWithAge({ daysOld: 0, pendingUpload: false });

      expect(await countFiles()).toBe(4);

      const deletedCount = await cleanUnusedFiles();

      expect(deletedCount).toBe(2); // Files 1 and 4
      expect(await countFiles()).toBe(2); // Files 2 and 3 remain
    });

    it('should NOT delete orphaned files in categories with disableAutoCleanup', async () => {
      fileCategoriesOverride = [
        {
          name: 'NO_CLEANUP_CATEGORY',
          adapter: 'uploads',
          maxFileSize: 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          referencedByRelations: ['todoListCoverPhoto'],
          disableAutoCleanup: true,
        },
      ];

      // Create an orphaned confirmed file in the no-cleanup category
      await createFileWithAge({
        daysOld: 0,
        pendingUpload: false,
        category: 'NO_CLEANUP_CATEGORY',
      });

      const deletedCount = await cleanUnusedFiles();

      // File should NOT be deleted because the category has disableAutoCleanup
      expect(deletedCount).toBe(0);
      expect(await countFiles()).toBe(1);
    });

    it('should only delete file when ALL relations are empty (multi-relation)', async () => {
      const userId = await createTestUser();

      // Override categories with a multi-relation category
      fileCategoriesOverride = [
        {
          name: 'MULTI_RELATION',
          adapter: 'uploads',
          maxFileSize: 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          referencedByRelations: ['todoListCoverPhoto', 'userProfileAvatar'],
        },
      ];

      const fileId = await createFileWithAge({
        daysOld: 0,
        pendingUpload: false,
        category: 'MULTI_RELATION',
      });

      // Attach file to a TodoList (one relation populated)
      const todoList = await prisma.todoList.create({
        data: {
          name: 'Test List',
          position: 0,
          ownerId: userId,
          coverPhotoId: fileId,
        },
      });

      // File should NOT be deleted — todoListCoverPhoto relation is populated
      expect(await cleanUnusedFiles()).toBe(0);
      expect(await countFiles()).toBe(1);

      // Remove the TodoList relation
      await prisma.todoList.delete({ where: { id: todoList.id } });

      // Now all relations are empty — file should be deleted
      expect(await cleanUnusedFiles()).toBe(1);
      expect(await countFiles()).toBe(0);
    });

    it('should handle files from different adapters', async () => {
      await createFileWithAge({
        daysOld: 2,
        pendingUpload: true,
        adapter: 'uploads',
      });
      await createFileWithAge({
        daysOld: 2,
        pendingUpload: true,
        adapter: 'url',
      });
      await createFileWithAge({
        daysOld: 0.5,
        pendingUpload: true,
        adapter: 'uploads',
      });

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
