#!/usr/bin/env tsx

import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function main(): Promise<void> {
  const workingDir = process.argv[2] || process.cwd();

  console.log(`🔍 Working directory: ${workingDir}`);
  console.log('🔍 Finding all generator files...');

  // Find all *.generator.ts files
  const generatorFiles = await globby(['**/*.generator.ts'], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true,
    cwd: workingDir,
  });

  console.log(`Found ${generatorFiles.length} generator files`);

  // Create index.ts files for each generator
  const generatorDirs = new Map<string, string>(); // dir path -> relative path from working dir

  for (const generatorFile of generatorFiles) {
    const dir = path.dirname(generatorFile);
    const basename = path.basename(generatorFile, '.ts');
    const indexPath = path.join(dir, 'index.ts');
    const relativeDir = path.relative(workingDir, dir);

    generatorDirs.set(dir, relativeDir);

    // Check if index.ts already exists
    const indexExists = await fs
      .access(indexPath)
      .then(() => true)
      .catch(() => false);

    if (indexExists) {
      console.log(`⚠️  Index already exists in ${relativeDir}, skipping...`);
      continue;
    }

    // Create barrel export
    const exportContent = `export * from './${basename}.js';\n`;

    await fs.writeFile(indexPath, exportContent);
    console.log(`✅ Created index.ts in ${relativeDir}`);
  }

  console.log('\n🔍 Finding all TypeScript files to update imports...');

  // Find all TypeScript files that might have imports
  const allTsFiles = await globby(['**/*.{ts,tsx}'], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true,
    cwd: workingDir,
  });

  console.log(`Found ${allTsFiles.length} TypeScript files to check`);

  let updatedCount = 0;

  // Build a map of generator directories for efficient lookup
  const generatorRelativePaths = new Set<string>();
  for (const [, relativePath] of generatorDirs) {
    generatorRelativePaths.add(relativePath);
  }

  for (const tsFile of allTsFiles) {
    // Skip processing the index.ts files we just created to avoid circular imports
    if (path.basename(tsFile) === 'index.ts') {
      const tsFileDir = path.dirname(tsFile);
      if (generatorDirs.has(tsFileDir)) {
        continue; // Skip this file as it's a barrel export we created
      }
    }

    const content = await fs.readFile(tsFile, 'utf8');
    let updatedContent = content;
    let hasChanges = false;

    // Pattern to match imports of generator files
    // Matches: import { ... } from '.../*.generator.js'
    const generatorImportPattern =
      /(from\s+['"])(.*?)(\/[^/]+\.generator\.js)(['"])/g;

    updatedContent = updatedContent.replaceAll(
      generatorImportPattern,
      (originalMatch, prefix, pathPart, _generatorPart, suffix) => {
        if (pathPart === '.') return originalMatch;
        hasChanges = true;
        // Replace with /index.js for Node 16 module resolution
        return `${prefix}${pathPart}/index.js${suffix}`;
      },
    );

    // Pattern to match imports of generated/ts-import-maps.js from generator directories
    // This checks if the import path corresponds to a generator directory
    const generatedImportPattern =
      /(from\s+['"])(.*?)(\/generated\/ts-import-maps\.js)(['"])/g;

    updatedContent = updatedContent.replaceAll(
      generatedImportPattern,
      (originalMatch, prefix, pathPart, _generatedPart, suffix) => {
        if (pathPart === '.') return originalMatch;
        // Check if this path corresponds to a generator directory
        const importDir = path.dirname(tsFile);
        const resolvedPath = path.resolve(importDir, pathPart);
        const relativePath = path.relative(workingDir, resolvedPath);

        // Check if this directory contains a generator
        if (
          [...generatorRelativePaths].some(
            (genPath) =>
              relativePath === genPath || relativePath.endsWith(`/${genPath}`),
          )
        ) {
          hasChanges = true;
          return `${prefix}${pathPart}/index.js${suffix}`;
        }

        return originalMatch;
      },
    );

    if (hasChanges) {
      await fs.writeFile(tsFile, updatedContent);
      updatedCount++;
      console.log(`📝 Updated imports in ${path.relative(workingDir, tsFile)}`);
    }
  }

  console.log(`\n✨ Done! Updated ${updatedCount} files`);
  console.log(`📁 Created barrel exports in ${generatorDirs.size} directories`);
}

main().catch((error: unknown) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
