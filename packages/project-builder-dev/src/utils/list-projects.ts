import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import {
  discoverProjects,
  loadProjectFromDirectory,
} from '@baseplate-dev/project-builder-server/actions';
import { dirExists, expandPathWithTilde } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import { logger } from '#src/services/logger.js';

import { getEnvConfig } from './config.js';
import { loadDevConfig } from './dev-config.js';

function getProjectDirectories({
  additionalDirectories,
  defaultToCwd,
}: {
  additionalDirectories?: string[];
  defaultToCwd: boolean;
}): string[] {
  const config = getEnvConfig();
  const allDirectories = new Set<string>();

  // Add directories from PROJECT_DIRECTORIES env var
  const envDirectories = config.PROJECT_DIRECTORIES?.split(',') ?? [];
  for (const dir of envDirectories) {
    if (dir.trim()) {
      allDirectories.add(expandPathWithTilde(dir.trim()));
    }
  }

  // Add explicitly provided directories
  for (const dir of additionalDirectories ?? []) {
    allDirectories.add(expandPathWithTilde(dir));
  }

  // Default to current working directory if no projects specified
  if (allDirectories.size === 0 && defaultToCwd) {
    allDirectories.add(process.cwd());
  }

  return [...allDirectories];
}

/**
 * Lists subdirectories within a configured directory, or returns an empty array
 * if the directory is not configured or doesn't exist.
 */
async function listSubdirectories(
  directory: string | undefined,
): Promise<string[]> {
  if (!directory || !(await dirExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(directory, e.name));
}

export async function listProjects({
  additionalDirectories,
}: {
  additionalDirectories?: string[];
}): Promise<ProjectInfo[]> {
  const config = await loadDevConfig();
  const projectDirs = getProjectDirectories({
    additionalDirectories,
    defaultToCwd: true,
  });
  const exampleDirs = await listSubdirectories(config.examplesDirectory);
  const testDirs = await listSubdirectories(config.testProjectsDirectory);

  return discoverProjects(
    {
      projectDirectories: projectDirs,
      exampleDirectories: exampleDirs,
      testProjectDirectories: testDirs,
    },
    logger,
  );
}

export async function resolveProject(
  projectNameOrDirectory: string | undefined = process.cwd(),
): Promise<ProjectInfo> {
  if (
    projectNameOrDirectory.startsWith('.') ||
    path.isAbsolute(projectNameOrDirectory) ||
    projectNameOrDirectory.startsWith('~') ||
    projectNameOrDirectory.includes(path.sep) ||
    projectNameOrDirectory.includes('/')
  ) {
    const resolvedPath = expandPathWithTilde(projectNameOrDirectory);
    return loadProjectFromDirectory(
      resolvedPath,
      path.join(resolvedPath, 'baseplate'),
      'user',
    );
  }

  const projects = await listProjects({});
  const project = projects.find(
    (p) => p.name === projectNameOrDirectory || p.id === projectNameOrDirectory,
  );
  if (!project) {
    throw new Error(`Project ${projectNameOrDirectory} not found`);
  }
  return project;
}

export async function getExampleProjects(): Promise<ProjectInfo[]> {
  const config = await loadDevConfig();
  const exampleDirs = await listSubdirectories(config.examplesDirectory);
  return discoverProjects({ exampleDirectories: exampleDirs }, logger);
}

export async function getTestProjects(): Promise<ProjectInfo[]> {
  const config = await loadDevConfig();
  const testDirs = await listSubdirectories(config.testProjectsDirectory);
  return discoverProjects({ testProjectDirectories: testDirs }, logger);
}
