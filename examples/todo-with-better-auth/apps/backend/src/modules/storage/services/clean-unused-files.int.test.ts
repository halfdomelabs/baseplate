import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { ServiceContextWith } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';
import { createFakeStorageService } from '@src/tests/helpers/storage.test-helper.js';

import type { StorageAdapter } from '../types/adapter.js';
import type { FileCategory } from '../types/file-category.js';

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

const deleteFilesMock = vi
  .fn()
  .mockResolvedValue({ succeeded: [], failed: [] });

const uploadsAdapter: StorageAdapter = {
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
  getFileMetadata: vi.fn(),
  deleteFiles: deleteFilesMock,
};

const urlAdapter: StorageAdapter = {
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
  getFileMetadata: vi.fn(),
};

let fileCategoriesOverride: FileCategory[] | undefined;

/** Builds a fake `ServiceContextWith<'storage'>` backed by test-controlled adapters/categories. */
function createTestContext(): ServiceContextWith<'storage'> {
  return createTestServiceContext({
    services: {
      storage: createFakeStorageService({
        categories: fileCategoriesOverride ?? defaultFileCategories,
        adapters: { uploads: uploadsAdapter, url: urlAdapter },
      }),
    },
  });
}

/**
 * Helper to create a file record with a specific age and upload state.
 *
 * Orphan cleanup keys off `updatedAt`, so both timestamps are backdated.
 * Prisma's `@updatedAt` overwrites the column on every write, so `updatedAt`
 * is set via raw SQL after the create rather than in the create itself.
 *
 * @param options - File creation options
 * @param options.daysOld - How many days old the file should be
 * @param options.pendingUpload - Whether the file is still pending upload
 * @param options.adapter - The storage adapter name (defaults to 'uploads')
 * @param options.category - The file category name (defaults to 'TODO_LIST_COVER_PHOTO')
 * @param options.updatedDaysOld - Age of `updatedAt` if it should differ from `daysOld`
 * @returns The created file's ID
 */
async function createFileWithAge({
  daysOld,
  pendingUpload,
  adapter = 'uploads',
  category = 'TODO_LIST_COVER_PHOTO',
  updatedDaysOld,
}: {
  daysOld: number;
  pendingUpload: boolean;
  adapter?: string;
  category?: string;
  updatedDaysOld?: number;
}): Promise<string> {
  const createdAt = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const updatedAt = new Date(
    Date.now() - (updatedDaysOld ?? daysOld) * 24 * 60 * 60 * 1000,
  );
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
      createdAt,
    },
  });
  await prisma.$executeRaw`UPDATE "file" SET "updated_at" = ${updatedAt} WHERE "id" = ${file.id}::uuid`;
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

// cleanUnusedFiles scans the whole File table, so exact-count assertions are
// only valid against an empty table. Reset in beforeEach too — afterEach alone
// can't protect the first test from rows leaked by an interrupted prior run.
async function resetTables(): Promise<void> {
  await prisma.todoList.deleteMany();
  await prisma.userImage.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();
}

describe('cleanUnusedFiles integration tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    fileCategoriesOverride = undefined;
    await resetTables();
  });

  afterEach(resetTables);

  describe('pending upload expiry', () => {
    it('should delete pending uploads older than 1 day', async () => {
      await createFileWithAge({ daysOld: 2, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles(createTestContext());

      expect(deletedCount).toBe(1);
      expect(await countFiles()).toBe(0);
      expect(deleteFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('/test/path')]),
      );
    });

    it('should NOT delete pending uploads younger than 1 day', async () => {
      await createFileWithAge({ daysOld: 0.5, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles(createTestContext());

      expect(deletedCount).toBe(0);
      expect(await countFiles()).toBe(1);
    });

    it('should handle multiple pending uploads with mixed ages', async () => {
      await createFileWithAge({ daysOld: 2, pendingUpload: true });
      await createFileWithAge({ daysOld: 3, pendingUpload: true });
      await createFileWithAge({ daysOld: 0.5, pendingUpload: true });
      await createFileWithAge({ daysOld: 0.2, pendingUpload: true });

      const deletedCount = await cleanUnusedFiles(createTestContext());

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
    it('should delete file after owning entity is deleted and grace period passes', async () => {
      const userId = await createTestUser();
      const fileId = await createFileWithAge({
        daysOld: 2,
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
      expect(await cleanUnusedFiles(createTestContext())).toBe(0);

      // Delete TodoList
      await prisma.todoList.delete({ where: { id: todoList.id } });

      // Now file should be deleted (orphaned and past the grace period)
      expect(await cleanUnusedFiles(createTestContext())).toBe(1);
      expect(await countFiles()).toBe(0);
    });

    it('should NOT delete a recently confirmed file that was never attached', async () => {
      // Reproduces the foot-gun: confirming an upload without assigning it in
      // the same transaction previously made the file immediately collectable.
      await createFileWithAge({ daysOld: 0, pendingUpload: false });

      expect(await cleanUnusedFiles(createTestContext())).toBe(0);
      expect(await countFiles()).toBe(1);
    });

    it('should delete a never-attached file once it is past the grace period', async () => {
      await createFileWithAge({ daysOld: 2, pendingUpload: false });

      expect(await cleanUnusedFiles(createTestContext())).toBe(1);
      expect(await countFiles()).toBe(0);
    });

    it('should base the grace period on updatedAt, not createdAt', async () => {
      // An old upload confirmed just now must still get a full grace period.
      await createFileWithAge({
        daysOld: 30,
        updatedDaysOld: 0,
        pendingUpload: false,
      });

      expect(await cleanUnusedFiles(createTestContext())).toBe(0);
      expect(await countFiles()).toBe(1);
    });
  });

  describe('confirmed files with active relations', () => {
    it('should NOT delete file when entity with reference exists', async () => {
      const userId = await createTestUser();
      // Past the grace period, so the relation check is what protects the file.
      const fileId = await createFileWithAge({
        daysOld: 2,
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

      const deletedCount = await cleanUnusedFiles(createTestContext());

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
      expect(await cleanUnusedFiles(createTestContext())).toBe(100);
      expect(await countFiles()).toBe(50);

      // Second run should delete remaining 50
      expect(await cleanUnusedFiles(createTestContext())).toBe(50);
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
      // 4. Confirmed file without relation, past grace period (should be deleted)
      await createFileWithAge({ daysOld: 2, pendingUpload: false });

      expect(await countFiles()).toBe(4);

      const deletedCount = await cleanUnusedFiles(createTestContext());

      expect(deletedCount).toBe(2); // Files 1 and 4
      expect(await countFiles()).toBe(2); // Files 2 and 3 remain
    });

    it('should NOT delete orphaned files in categories with disableAutoCleanup', async () => {
      // Include a cleanup-enabled category alongside the protected one, so the
      // orphan branch is actually built and the per-category filter is what
      // spares the protected file — not the "no categories to clean" shortcut.
      fileCategoriesOverride = [
        {
          name: 'NO_CLEANUP_CATEGORY',
          adapter: 'uploads',
          maxFileSize: 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          referencedByRelations: ['todoListCoverPhoto'],
          disableAutoCleanup: true,
        },
        {
          name: 'TODO_LIST_COVER_PHOTO',
          adapter: 'uploads',
          maxFileSize: 1024 * 1024,
          allowedMimeTypes: ['image/jpeg'],
          referencedByRelations: ['todoListCoverPhoto'],
        },
      ];

      // Both orphaned and past the grace period; only the category differs.
      await createFileWithAge({
        daysOld: 2,
        pendingUpload: false,
        category: 'NO_CLEANUP_CATEGORY',
      });
      await createFileWithAge({
        daysOld: 2,
        pendingUpload: false,
        category: 'TODO_LIST_COVER_PHOTO',
      });

      const deletedCount = await cleanUnusedFiles(createTestContext());

      // Only the cleanup-enabled file is removed
      expect(deletedCount).toBe(1);
      expect(await countFiles()).toBe(1);
      const [remaining] = await prisma.file.findMany();
      assert.isDefined(remaining);
      expect(remaining.category).toBe('NO_CLEANUP_CATEGORY');
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
        daysOld: 2,
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
      expect(await cleanUnusedFiles(createTestContext())).toBe(0);
      expect(await countFiles()).toBe(1);

      // Remove the TodoList relation
      await prisma.todoList.delete({ where: { id: todoList.id } });

      // Now all relations are empty — file should be deleted
      expect(await cleanUnusedFiles(createTestContext())).toBe(1);
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

      const deletedCount = await cleanUnusedFiles(createTestContext());

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
