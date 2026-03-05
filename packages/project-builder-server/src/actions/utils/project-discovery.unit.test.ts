import { createTestProjectDefinition } from '@baseplate-dev/project-builder-lib';
import { createTestLogger } from '@baseplate-dev/sync';
import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  discoverProjects,
  isBaseplateProject,
  loadProjectFromDirectory,
} from './project-discovery.js';

vi.mock('node:fs/promises');

function makeProjectDef(name: string): string {
  return JSON.stringify(
    createTestProjectDefinition({
      settings: { general: { name, packageScope: '', portOffset: 3000 } },
    }),
  );
}

const mockLogger = createTestLogger();

describe('project-discovery', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe('isBaseplateProject', () => {
    it('returns true when project-definition.json exists', async () => {
      vol.fromJSON({
        '/project/baseplate/project-definition.json': makeProjectDef('test'),
      });

      expect(await isBaseplateProject('/project/baseplate')).toBe(true);
    });

    it('returns false when project-definition.json does not exist', async () => {
      vol.fromJSON({
        '/project/baseplate/other-file.txt': 'content',
      });

      expect(await isBaseplateProject('/project/baseplate')).toBe(false);
    });

    it('returns false for an empty directory', async () => {
      vol.mkdirSync('/empty/baseplate', { recursive: true });

      expect(await isBaseplateProject('/empty/baseplate')).toBe(false);
    });
  });

  describe('loadProjectFromDirectory', () => {
    it('loads a user project', async () => {
      vol.fromJSON({
        '/project/baseplate/project-definition.json':
          makeProjectDef('my-project'),
      });

      const project = await loadProjectFromDirectory(
        '/project',
        '/project/baseplate',
        'user',
      );

      expect(project.name).toBe('my-project');
      expect(project.directory).toBe('/project');
      expect(project.baseplateDirectory).toBe('/project/baseplate');
      expect(project.type).toBe('user');
      expect(project.id).toBeDefined();
    });

    it('loads an example project without name prefix', async () => {
      vol.fromJSON({
        '/examples/blog/baseplate/project-definition.json':
          makeProjectDef('blog'),
      });

      const project = await loadProjectFromDirectory(
        '/examples/blog',
        '/examples/blog/baseplate',
        'example',
      );

      expect(project.name).toBe('blog');
      expect(project.type).toBe('example');
    });

    it('prefixes test project names with test:', async () => {
      vol.fromJSON({
        '/tests/simple/project-definition.json': makeProjectDef('simple'),
      });

      const project = await loadProjectFromDirectory(
        '/tests/simple/.output',
        '/tests/simple',
        'test',
      );

      expect(project.name).toBe('test:simple');
      expect(project.directory).toBe('/tests/simple/.output');
      expect(project.baseplateDirectory).toBe('/tests/simple');
      expect(project.type).toBe('test');
    });

    it('throws when project-definition.json is missing', async () => {
      vol.mkdirSync('/empty/baseplate', { recursive: true });

      await expect(
        loadProjectFromDirectory('/empty', '/empty/baseplate', 'user'),
      ).rejects.toThrow('No project definition found');
    });

    it('throws when name is missing from project definition', async () => {
      vol.fromJSON({
        '/project/baseplate/project-definition.json': JSON.stringify({
          settings: { general: { packageScope: '' } },
        }),
      });

      await expect(
        loadProjectFromDirectory('/project', '/project/baseplate', 'user'),
      ).rejects.toThrow('valid name');
    });
  });

  describe('discoverProjects', () => {
    it('discovers user projects', async () => {
      vol.fromJSON({
        '/user-project/baseplate/project-definition.json':
          makeProjectDef('user-proj'),
      });

      const projects = await discoverProjects(
        { projectDirectories: ['/user-project'] },
        mockLogger,
      );

      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({
        name: 'user-proj',
        type: 'user',
        directory: '/user-project',
        baseplateDirectory: path.join('/user-project', 'baseplate'),
      });
    });

    it('discovers example projects', async () => {
      vol.fromJSON({
        '/examples/blog/baseplate/project-definition.json':
          makeProjectDef('blog'),
      });

      const projects = await discoverProjects(
        { exampleDirectories: ['/examples/blog'] },
        mockLogger,
      );

      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({
        name: 'blog',
        type: 'example',
        directory: '/examples/blog',
        baseplateDirectory: path.join('/examples/blog', 'baseplate'),
      });
    });

    it('discovers test projects with correct output dir and name prefix', async () => {
      vol.fromJSON({
        '/tests/simple/project-definition.json': makeProjectDef('simple'),
      });

      const projects = await discoverProjects(
        { testProjectDirectories: ['/tests/simple'] },
        mockLogger,
      );

      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({
        name: 'test:simple',
        type: 'test',
        directory: path.join('/tests/simple', '.output'),
        baseplateDirectory: '/tests/simple',
      });
    });

    it('discovers mixed project types in a single call', async () => {
      vol.fromJSON({
        '/user/baseplate/project-definition.json': makeProjectDef('user-proj'),
        '/examples/blog/baseplate/project-definition.json':
          makeProjectDef('blog'),
        '/tests/simple/project-definition.json': makeProjectDef('simple'),
      });

      const projects = await discoverProjects(
        {
          projectDirectories: ['/user'],
          exampleDirectories: ['/examples/blog'],
          testProjectDirectories: ['/tests/simple'],
        },
        mockLogger,
      );

      expect(projects).toHaveLength(3);

      const names = projects.map((p) => p.name);
      expect(names).toContain('user-proj');
      expect(names).toContain('blog');
      expect(names).toContain('test:simple');

      const types = projects.map((p) => p.type);
      expect(types).toContain('user');
      expect(types).toContain('example');
      expect(types).toContain('test');
    });

    it('skips directories without a valid project definition', async () => {
      vol.fromJSON({
        '/valid/baseplate/project-definition.json': makeProjectDef('valid'),
        '/invalid/baseplate/other-file.txt': 'not a project',
      });

      const projects = await discoverProjects(
        { projectDirectories: ['/valid', '/invalid'] },
        mockLogger,
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('valid');
    });

    it('throws on duplicate project names', async () => {
      vol.fromJSON({
        '/project1/baseplate/project-definition.json':
          makeProjectDef('duplicate'),
        '/project2/baseplate/project-definition.json':
          makeProjectDef('duplicate'),
      });

      await expect(
        discoverProjects(
          { projectDirectories: ['/project1', '/project2'] },
          mockLogger,
        ),
      ).rejects.toThrow('Duplicate project names found: duplicate');
    });

    it('returns empty array when no directories are provided', async () => {
      const projects = await discoverProjects({}, mockLogger);
      expect(projects).toEqual([]);
    });

    it('returns empty array when all directories are empty', async () => {
      vol.mkdirSync('/empty1', { recursive: true });
      vol.mkdirSync('/empty2', { recursive: true });

      const projects = await discoverProjects(
        { projectDirectories: ['/empty1', '/empty2'] },
        mockLogger,
      );

      expect(projects).toEqual([]);
    });
  });
});
