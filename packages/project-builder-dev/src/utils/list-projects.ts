import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import {
  discoverProjects,
  loadProjectFromDirectory,
} from '@baseplate-dev/project-builder-server/actions';
import { expandPathWithTilde } from '@baseplate-dev/utils/node';
import path from 'node:path';

import { logger } from '#src/services/logger.js';

import { getEnvConfig } from './config.js';
import { findExamplesDirectories } from './find-examples-directories.js';

const config = getEnvConfig();

async function getSearchDirectories({
  additionalDirectories,
  includeExamples,
  defaultToCwd,
}: {
  additionalDirectories?: string[];
  includeExamples: boolean;
  defaultToCwd: boolean;
}): Promise<string[]> {
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

  // Add example directories if requested
  if (includeExamples) {
    const exampleDirs = await findExamplesDirectories();
    for (const dir of exampleDirs) {
      allDirectories.add(dir);
    }
  }

  // Default to current working directory if no projects specified
  if (allDirectories.size === 0 && defaultToCwd) {
    allDirectories.add(process.cwd());
  }

  return [...allDirectories];
}

export async function listProjects({
  additionalDirectories,
}: {
  additionalDirectories?: string[];
}): Promise<ProjectInfo[]> {
  const searchDirectories = await getSearchDirectories({
    additionalDirectories,
    includeExamples: !(config.EXCLUDE_EXAMPLES ?? false),
    defaultToCwd: true,
  });
  return discoverProjects(searchDirectories, logger);
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
    return loadProjectFromDirectory(resolvedPath);
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
  const exampleDirs = await findExamplesDirectories();
  return discoverProjects(exampleDirs, logger);
}
