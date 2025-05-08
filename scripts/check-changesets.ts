#!/usr/bin/env node

/**
 * Check changesets script for monorepo npm packages
 * - Validates non-private packages against their "files" array
 * - Ensures packages with changes are properly staged for publishing
 * - Optimized for PR use: parallel processing and only checks affected packages
 */

import { promises as fs, globSync } from 'node:fs';
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

interface TurboOutput {
  packageManager: string;
  packages: {
    count: number;
    items: Array<{
      name: string;
      path: string;
    }>;
  };
}

// Helper function to extract and validate a package
async function extractAndValidatePackage(
  pkg: PackageInfo,
  tempDir: string,
): Promise<{ packageName: string; errors: string[] }> {
  const errors: string[] = [];
  const packageTempDir = path.join(tempDir, pkg.name);
  await fs.mkdir(packageTempDir, { recursive: true });

  try {
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
    for await (const file of await globSync('**/*', {
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
      if (missingFiles.length > 0) {
        errors.push(`Missing files: ${missingFiles.join(', ')}`);
      }

      if (extraFiles.length > 0) {
        errors.push(`Extra files: ${extraFiles.join(', ')}`);
      }

      if (mismatchedFiles.length > 0) {
        errors.push(
          `Mismatched files: ${mismatchedFiles.map((m) => m.file).join(', ')}`,
        );
      }
    }

    return { packageName: pkg.name, errors };
  } catch (error) {
    errors.push(`Error processing package: ${String(error)}`);
    return { packageName: pkg.name, errors };
  }
}

const CHANGESET_OUTPUT_FILE = 'changeset-output.json';

/**
 * Gets the list of packages that will be published according to changeset
 * Checks for .changeset/*.md files first to avoid errors when no changesets exist
 * @returns Array of package names to be published
 */
async function getPackagesToPublish(): Promise<string[]> {
  // Check if any changeset files exist
  const changesetFiles = globSync('.changeset/*.md').filter(
    (file) => file !== '.changeset/README.md',
  );

  // If no changeset files, return empty array (no packages to publish)
  if (changesetFiles.length === 0) {
    console.log('No changeset files found, assuming no packages to publish');
    return [];
  }

  try {
    // Run changeset status command
    await execAsync(`pnpm changeset status --output=${CHANGESET_OUTPUT_FILE}`);

    // Parse the output file
    const changesetData: ChangesetStatus = JSON.parse(
      await fs.readFile(CHANGESET_OUTPUT_FILE, 'utf8'),
    );

    // Extract packages that will be published (from the releases array)
    const packagesToPublish = changesetData.releases.map(
      (release) => release.name,
    );

    return packagesToPublish;
  } finally {
    // Clean up the output file if it exists
    try {
      await fs.rm(CHANGESET_OUTPUT_FILE, { force: true });
    } catch (cleanupError) {
      console.warn('Error cleaning up changeset output file:', cleanupError);
    }
  }
}

// Main function to run the validation
async function checkChangesets(): Promise<void> {
  let tempDir: string = await fs.mkdtemp(
    path.join(os.tmpdir(), 'npm-packages-'),
  );
  let exitCode = 0;

  try {
    // Step 1: Create a temporary directory
    console.log(`Created temporary directory: ${tempDir}`);

    // Step 2: Get the list of affected packages from turbo
    console.log('Getting affected packages from turbo...');
    const { stdout: turboOutput } = await execAsync(
      `pnpm turbo ls --affected --output json`,
    );
    const turboData: TurboOutput = JSON.parse(turboOutput);

    const affectedPackageNames = turboData.packages.items.map(
      (item) => item.name,
    );
    console.log(
      `Found ${affectedPackageNames.length} affected packages from turbo:`,
    );
    console.log(affectedPackageNames.join(', '));

    // Step 3: Get packages to be published from changeset
    console.log('Getting packages from changeset...');

    // Extract packages that will be published (from the releases array)
    const packagesToPublish = await getPackagesToPublish();

    console.log(
      `Packages to be published according to changeset:`,
      packagesToPublish.join(', ') || 'None',
    );

    // Step 4: Find packages that are affected but not in changeset
    const packagesToCheck = affectedPackageNames.filter(
      (name) => !packagesToPublish.includes(name),
    );

    if (packagesToCheck.length === 0) {
      console.log(
        'No affected packages need checking. All affected packages are already in changeset or there are no affected packages.',
      );
      return;
    }

    console.log(
      `Checking ${packagesToCheck.length} affected packages not in changeset:`,
    );
    console.log(packagesToCheck.join(', '));

    // Step 5: Find all package.json files for the packages to check
    const packagesInfo: PackageInfo[] = [];

    for (const packageName of packagesToCheck) {
      // Find the package path from turbo data
      const packageItem = turboData.packages.items.find(
        (item) => item.name === packageName,
      );

      if (!packageItem) {
        console.warn(`Could not find path for package ${packageName}`);
        continue;
      }

      const packageJsonPath = path.join(packageItem.path, 'package.json');

      try {
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

        packagesInfo.push({
          name: packageJson.name,
          dir: packageItem.path,
          packageJson,
        });
      } catch (error) {
        console.error(
          `Error processing package.json for ${packageName}:`,
          error,
        );
        exitCode = 1;
      }
    }

    console.log(
      `Found ${packagesInfo.length} non-private packages to validate`,
    );

    // Step 6: Process packages in parallel
    const validationResults = await Promise.all(
      packagesInfo.map((pkg) => extractAndValidatePackage(pkg, tempDir)),
    );

    // Step 7: Process results
    const packagesWithErrors = validationResults.filter(
      (result) => result.errors.length > 0,
    );

    if (packagesWithErrors.length > 0) {
      console.error(`The following packages have issues:`);
      for (const result of packagesWithErrors) {
        console.error(
          `\nPackage ${result.packageName} has file discrepancies:`,
        );
        for (const error of result.errors) {
          console.error(`  ${error}`);
        }
      }

      const packagesWithIssues = packagesWithErrors.map((r) => r.packageName);
      console.error(
        `\nThe following packages have changes but are not set to be published: ${packagesWithIssues.join(
          ', ',
        )}`,
      );

      throw new Error('Some packages have issues and need changesets');
    }

    console.log('Package changeset validation completed successfully!');
  } catch (error) {
    console.error('Package changeset validation failed:', error);
    exitCode = 1;
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
    process.exit(exitCode);
  }
}

// Run the validation
checkChangesets();
