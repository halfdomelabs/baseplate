import type { StringMergeAlgorithmInput } from '@baseplate-dev/sync';

import { describe, expect, it } from 'vitest';

import {
  normalizePrismaWhitespace,
  prismaMergeAlgorithm,
} from './prisma-merge-algorithm.js';

const FILE_PATH = 'prisma/schema.prisma';

function makeInput(
  previousGeneratedText: string,
  previousWorkingText: string,
  currentGeneratedText: string,
): StringMergeAlgorithmInput {
  return {
    previousGeneratedText,
    previousWorkingText,
    currentGeneratedText,
    filePath: FILE_PATH,
  };
}

// Base schema with two models and aligned fields (as Prisma formatter would produce)
const BASE_SCHEMA = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

describe('prismaMergeAlgorithm', () => {
  it('merges cross-block changes without conflict (main regression case)', async () => {
    // User adds a field to Post model
    const userModified = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String   @id @default(cuid())
  title       String
  content     String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    // Baseplate adds a field to User model (which causes column-realignment across the block)
    const newGenerated = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  name                 String?
  organizationMemberId String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
`;

    const result = await prismaMergeAlgorithm(
      makeInput(BASE_SCHEMA, userModified, newGenerated),
    );

    expect(result).not.toBeNull();
    expect(result?.hasConflict).toBe(false);
    // The merged result should include the user's new Post field
    expect(result?.mergedText).toContain('publishedAt');
    // And baseplate's new User field
    expect(result?.mergedText).toContain('organizationMemberId');
  });

  it('returns null (falling back to plain diff3) when both sides add a field to the same location in the same block', async () => {
    // User adds a field after "name" in User
    const userModified = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    // Baseplate also adds a different field at the same position after "name"
    const newGenerated = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    const result = await prismaMergeAlgorithm(
      makeInput(BASE_SCHEMA, userModified, newGenerated),
    );

    // Returns null so the composite chain falls back to plain diff3 on formatted inputs,
    // ensuring conflict markers appear against properly-formatted Prisma text.
    expect(result).toBeNull();
  });

  it('returns the user version unchanged when only whitespace alignment changed in generated output', async () => {
    // User modified a comment
    const userModified = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  /// Display name for the user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    // New generated is identical to base except alignment spacing changed (simulating a rename elsewhere)
    const newGenerated = `\
generator client {
  provider   = "prisma-client-js"
  engineType = "client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    const result = await prismaMergeAlgorithm(
      makeInput(BASE_SCHEMA, userModified, newGenerated),
    );

    expect(result).not.toBeNull();
    expect(result?.hasConflict).toBe(false);
    // The user's doc comment should be in the result
    expect(result?.mergedText).toContain('/// Display name for the user');
    // The generator change should also be in the result
    expect(result?.mergedText).toContain('engineType');
  });

  it('returns a formatted result when user and generated both make identical independent changes', async () => {
    // When there are no actual conflicts (user and baseplate made the same change), merge should succeed
    const bothAdded = `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    const result = await prismaMergeAlgorithm(
      makeInput(BASE_SCHEMA, bothAdded, bothAdded),
    );

    expect(result).not.toBeNull();
    expect(result?.hasConflict).toBe(false);
    expect(result?.mergedText).toContain('role');
  });
});

describe('normalizePrismaWhitespace', () => {
  it('collapses alignment spaces between tokens', () => {
    expect(normalizePrismaWhitespace('  id        String   @id')).toBe(
      ' id String @id',
    );
  });

  it('collapses tabs', () => {
    expect(normalizePrismaWhitespace('id\t\tString\t@id')).toBe(
      'id String @id',
    );
  });

  it('preserves spaces inside double-quoted string literals', () => {
    expect(normalizePrismaWhitespace('  @@map("user   table")')).toBe(
      ' @@map("user   table")',
    );
  });

  it('preserves escape sequences inside string literals', () => {
    expect(
      normalizePrismaWhitespace(
        String.raw`  name  String  @default("hello\"  world")`,
      ),
    ).toBe(String.raw` name String @default("hello\"  world")`);
  });

  it('preserves doc comments (///) verbatim including internal spaces', () => {
    expect(
      normalizePrismaWhitespace('  ///   This   is  a  doc  comment'),
    ).toBe(' ///   This   is  a  doc  comment');
  });

  it('preserves regular comments (//) verbatim including internal spaces', () => {
    expect(
      normalizePrismaWhitespace('  id  String  // some   spaced   comment'),
    ).toBe(' id String // some   spaced   comment');
  });

  it('preserves multi-line block comments verbatim', () => {
    const input = '/* first   line\n   second   line */';
    expect(normalizePrismaWhitespace(input)).toBe(input);
  });

  it('collapses alignment spaces outside a block comment but not inside', () => {
    expect(normalizePrismaWhitespace('model   User  /* the   user */ {')).toBe(
      'model User /* the   user */ {',
    );
  });

  it('trims trailing whitespace from each line', () => {
    expect(
      normalizePrismaWhitespace('  id  String   \n  email  String  '),
    ).toBe(' id String\n email String');
  });
});
