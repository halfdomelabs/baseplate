#!/usr/bin/env node
/**
 * Pre-publish validation script for monorepo npm packages
 * - Validates non-private packages against their "files" array
 * - Ensures packages with changes are properly staged for publishing
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const execAsync = promisify(exec);

// TypeScript interfaces
interface PackageJson {
  name: string;
  private?: boolean;
  files?: string[];
  [key: string]: any;
}

interface PackageInfo {
  name: string;
  dir: string;
  packageJson: PackageJson;
}

interface ChangesetRelease {
  name: string;
  type: string;
  oldVersion: string;
  newVersion: string;
  changesets: string[];
}

interface ChangesetStatus {
  changesets: Array<{
    releases: Array<{ name: string; type: string }>;
    summary: string;
    id: string;
  }>;
  releases: ChangesetRelease[];
}

const CHANGESET_OUTPUT_FILE = 'changeset-output.json';

// Main function to run the validation
async function validatePrePublish(): Promise<void> {
  let tempDir: string | null = null;

  try {
    // Step 1: Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-packages-'));
    console.log(`Created temporary directory: ${tempDir}`);

    // Step 2: Find all package.json files in the monorepo
    const packageJsonFiles = await fs.glob('**/package.json', {
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    });

    // Step 3: Process each package and identify non-private packages
    const nonPrivatePackages: PackageInfo[] = [];
    const packagesWithErrors: string[] = [];

    for await (const packageJsonPath of packageJsonFiles) {
      const packageDir = path.dirname(packageJsonPath);
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson: PackageJson = JSON.parse(packageJsonContent);

      // Skip private packages
      if (packageJson.private === true) {
        console.log(`Skipping private package: ${packageJson.name}`);
        continue;
      }

      // Check if "files" array exists
      if (!Array.isArray(packageJson.files)) {
        throw new Error(
          `Package ${packageJson.name} is missing the "files" array in package.json`,
        );
      }

      nonPrivatePackages.push({
        name: packageJson.name,
        dir: packageDir,
        packageJson,
      });
    }

    console.log(`Found ${nonPrivatePackages.length} non-private packages`);

    // Step 4: Get packages to be published from changeset
    await execAsync(`pnpm changeset status --output=${CHANGESET_OUTPUT_FILE}`);
    const changesetData: ChangesetStatus = JSON.parse(
      await fs.readFile(CHANGESET_OUTPUT_FILE, 'utf8'),
    );

    // Extract packages that will be published (from the releases array)
    const packagesToPublish = changesetData.releases.map(
      (release) => release.name,
    );

    console.log(
      `Packages to be published according to changeset:`,
      packagesToPublish,
    );

    // Step 5: For each non-private package, check if built files match the "files" array
    for (const pkg of nonPrivatePackages) {
      const packageTempDir = path.join(tempDir, pkg.name);
      await fs.mkdir(packageTempDir, { recursive: true });

      // Pack the package to the temp directory
      console.log(`Packing ${pkg.name} to temporary directory...`);
      const { stdout: packOutput } = await execAsync(
        `npm pack ${pkg.name}@latest --pack-destination="${packageTempDir}"`,
      );

      // Extract the tarball name from the output
      const tarballName = packOutput.trim().split('\n').pop() as string;
      const tarballPath = path.join(packageTempDir, tarballName);

      // Extract the tarball
      await execAsync(`tar -xzf "${tarballPath}" -C "${packageTempDir}"`);

      // Now check the package contents
      const extractedPackageDir = path.join(packageTempDir, 'package');
      const filesInPackage = new Set<string>();
      for await (const file of await fs.glob('**/*', {
        withFileTypes: true,
        cwd: extractedPackageDir,
      })) {
        if (!file.isDirectory() && file.name !== 'package.json') {
          filesInPackage.add(
            path.relative(
              extractedPackageDir,
              path.join(file.parentPath, file.name),
            ),
          );
        }
      }

      // Get the files array from package.json
      const declaredFiles = [
        ...(pkg.packageJson.files ?? []),
        'README.md',
        'LICENSE',
      ];

      // Expand the files array patterns to match actual files
      const expectedFiles = new Set<string>();

      // Add files from the "files" array
      for (const pattern of declaredFiles) {
        const matchedFiles = await fs.glob(pattern, {
          cwd: pkg.dir,
          withFileTypes: true,
        });

        for await (const file of matchedFiles) {
          if (!file.isDirectory() && file.name !== 'package.json') {
            expectedFiles.add(
              path.relative(pkg.dir, path.join(file.parentPath, file.name)),
            );
          }
        }
      }

      // Convert expectedFiles set to array for comparison
      const expectedFilesArray = Array.from(expectedFiles);

      // Check if all expected files exist in the package
      const missingFiles = expectedFilesArray.filter(
        (file) => !filesInPackage.has(file),
      );

      // Check if all files match contents
      const fileMatches = await Promise.all(
        expectedFilesArray.map(async (file) => {
          try {
            const expectedFilePath = path.join(pkg.dir, file);
            const actualFilePath = path.join(extractedPackageDir, file);
            if (!filesInPackage.has(file)) {
              return { file, isMatch: true };
            }
            const expectedContent = await fs.readFile(expectedFilePath);
            const actualContent = await fs.readFile(actualFilePath);
            const isMatch = expectedContent.equals(actualContent);
            return { file, isMatch };
          } catch (err) {
            throw new Error(`Unable to read file ${file}: ${String(err)}`);
          }
        }),
      );
      const mismatchedFiles = fileMatches.filter(({ isMatch }) => !isMatch);

      // Check if there are files in the package that aren't in the expected files
      const extraFiles = Array.from(filesInPackage).filter(
        (file) => !expectedFiles.has(file),
      );

      if (
        missingFiles.length > 0 ||
        extraFiles.length > 0 ||
        mismatchedFiles.length > 0
      ) {
        console.error(`Package ${pkg.name} has file discrepancies:`);

        if (missingFiles.length > 0) {
          console.error(`  Missing files: ${missingFiles.join(', ')}`);
        }

        if (extraFiles.length > 0) {
          console.error(`  Extra files: ${extraFiles.join(', ')}`);
        }

        if (mismatchedFiles.length > 0) {
          console.error(
            `  Mismatched files: ${mismatchedFiles.map((m) => m.file).join(', ')}`,
          );
        }

        packagesWithErrors.push(pkg.name);
      } else {
        console.log(`Package ${pkg.name} files validation successful`);
      }
    }

    // Step 6: Compare packages with changes to packages being published
    const packagesWithChanges = nonPrivatePackages.filter((pkg) =>
      packagesWithErrors.includes(pkg.name),
    );
    const packagesWithChangesNames = packagesWithChanges.map((pkg) => pkg.name);

    // Find packages with changes that aren't being published
    const packagesWithChangesNotPublishing = packagesWithChangesNames.filter(
      (name) => !packagesToPublish.includes(name),
    );

    if (packagesWithChangesNotPublishing.length > 0) {
      throw new Error(
        `The following packages have changes but are not set to be published: ${packagesWithChangesNotPublishing.join(
          ', ',
        )}`,
      );
    }

    console.log('Pre-publish validation completed successfully!');
  } catch (error) {
    console.error('Pre-publish validation failed:', error);
    process.exit(1);
  } finally {
    // Ensure cleanup of temp directory always happens
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${tempDir}`);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    try {
      await fs.rm(CHANGESET_OUTPUT_FILE, { force: true });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

// Run the validation
validatePrePublish();
