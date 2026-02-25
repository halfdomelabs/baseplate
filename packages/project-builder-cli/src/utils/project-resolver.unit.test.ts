import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DiscoveredProjectInfo } from './project-resolver.js';

import {
  getProjectDirectories,
  getProjectNames,
  resolveProject,
  resolveProjects,
} from './project-resolver.js';

vi.mock('node:fs/promises');

describe('project-resolver', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.PROJECT_DIRECTORIES;
  });

  describe('resolveProjects', () => {
    it('resolves projects from provided directories', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'test-project-1' } },
          }),
          '/project2/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'test-project-2' } },
          }),
        },
        '/',
      );

      // Act
      const result = await resolveProjects({
        directories: ['/project1', '/project2'],
      });

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('test-project-1')).toEqual({
        name: 'test-project-1',
        path: '/project1',
        isInternalExample: false,
      });
      expect(result.get('test-project-2')).toEqual({
        name: 'test-project-2',
        path: '/project2',
        isInternalExample: false,
      });
    });

    it('uses PROJECT_DIRECTORIES environment variable', async () => {
      // Arrange
      process.env.PROJECT_DIRECTORIES = '/project1,/project2';
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'env-project-1' } },
          }),
          '/project2/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'env-project-2' } },
          }),
        },
        '/',
      );

      // Act
      const result = await resolveProjects();

      // Assert
      expect(result.size).toBe(2);
      expect(result.has('env-project-1')).toBe(true);
      expect(result.has('env-project-2')).toBe(true);
    });

    it('defaults to current working directory when defaultToCwd is true and no projects specified', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/current/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'current-project' } },
          }),
        },
        '/',
      );

      // Mock process.cwd()
      vi.spyOn(process, 'cwd').mockReturnValue('/current');

      // Act
      const result = await resolveProjects({
        defaultToCwd: true,
      });

      // Assert
      expect(result.size).toBe(1);
      expect(result.get('current-project')).toEqual({
        name: 'current-project',
        path: '/current',
        isInternalExample: false,
      });
    });

    it('throws error on duplicate project names', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'duplicate-name' } },
          }),
          '/project2/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'duplicate-name' } },
          }),
        },
        '/',
      );

      // Act & Assert
      await expect(
        resolveProjects({
          directories: ['/project1', '/project2'],
        }),
      ).rejects.toThrow(
        'Duplicate project names found: duplicate-name. Each project must have a unique name in its package.json.',
      );
    });

    it('warns and skips directories without valid package.json', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Mock implementation
      });
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'valid-project' } },
          }),
          '/project2/other-file.txt': 'not a project-definition.json',
        },
        '/',
      );

      // Act
      const result = await resolveProjects({
        directories: ['/project1', '/project2'],
      });

      // Assert
      expect(result.size).toBe(1);
      expect(result.has('valid-project')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not load project from /project2'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('resolveProject', () => {
    it('resolves project by absolute path', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/absolute/path/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'path-project' } },
          }),
        },
        '/',
      );

      // Act
      const result = await resolveProject('/absolute/path');

      // Assert
      expect(result).toEqual({
        name: 'path-project',
        path: '/absolute/path',
        isInternalExample: false,
      });
    });

    it('resolves project by relative path with separators', async () => {
      // Arrange
      const currentDir = process.cwd();
      const relativePath = `${currentDir}/relative/path`;
      vol.fromJSON(
        {
          [`${relativePath}/baseplate/project-definition.json`]: JSON.stringify(
            {
              settings: { general: { name: 'relative-project' } },
            },
          ),
        },
        '/',
      );

      // Act
      const result = await resolveProject('./relative/path');

      // Assert
      expect(result.name).toBe('relative-project');
      expect(result.path).toBe(relativePath);
    });

    it('resolves project by name from available projects', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'named-project' } },
          }),
        },
        '/',
      );

      process.env.PROJECT_DIRECTORIES = '/project1';

      // Act
      const result = await resolveProject('named-project');

      // Assert
      expect(result).toEqual({
        name: 'named-project',
        path: '/project1',
        isInternalExample: false,
      });
    });

    it('throws error when project name is not found', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'existing-project' } },
          }),
        },
        '/',
      );

      process.env.PROJECT_DIRECTORIES = '/project1';

      // Act & Assert
      await expect(resolveProject('non-existent-project')).rejects.toThrow(
        "Project 'non-existent-project' not found. Available projects: existing-project\nYou can also specify a directory path directly.",
      );
    });

    it('throws error when directory does not exist', async () => {
      // Arrange
      vol.fromJSON({}, '/');

      // Act & Assert
      await expect(resolveProject('/non-existent')).rejects.toThrow(
        'No package.json found in /non-existent',
      );
    });

    it('throws error when project definition has no name field', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project/baseplate/project-definition.json': JSON.stringify({
            settings: { general: {} },
            // Missing name field
          }),
        },
        '/',
      );

      // Act & Assert
      await expect(resolveProject('/project')).rejects.toThrow(
        'Validation failed',
      );
    });

    it('throws error when project definition has invalid name field', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: null } },
          }),
        },
        '/',
      );

      // Act & Assert
      await expect(resolveProject('/project')).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('getProjectDirectories', () => {
    it('returns array of project paths', () => {
      // Arrange
      const projectMap = new Map<string, DiscoveredProjectInfo>([
        [
          'project1',
          {
            name: 'project1',
            path: '/path1',
            isInternalExample: false,
          },
        ],
        [
          'project2',
          {
            name: 'project2',
            path: '/path2',
            isInternalExample: true,
          },
        ],
      ]);

      // Act
      const result = getProjectDirectories(projectMap);

      // Assert
      expect(result).toEqual(['/path1', '/path2']);
    });

    it('returns empty array for empty map', () => {
      // Arrange
      const projectMap = new Map<string, DiscoveredProjectInfo>();

      // Act
      const result = getProjectDirectories(projectMap);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getProjectNames', () => {
    it('returns sorted array of project names', () => {
      // Arrange
      const projectMap = new Map<string, DiscoveredProjectInfo>([
        [
          'zebra-project',
          {
            name: 'zebra-project',
            path: '/zebra',
            isInternalExample: false,
          },
        ],
        [
          'alpha-project',
          {
            name: 'alpha-project',
            path: '/alpha',
            isInternalExample: true,
          },
        ],
        [
          'beta-project',
          {
            name: 'beta-project',
            path: '/beta',
            isInternalExample: false,
          },
        ],
      ]);

      // Act
      const result = getProjectNames(projectMap);

      // Assert
      expect(result).toEqual([
        'alpha-project',
        'beta-project',
        'zebra-project',
      ]);
    });

    it('returns empty array for empty map', () => {
      // Arrange
      const projectMap = new Map<string, DiscoveredProjectInfo>();

      // Act
      const result = getProjectNames(projectMap);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('example project detection', () => {
    it('correctly identifies example projects by path', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/examples/package.json': JSON.stringify({
            name: '@baseplate-dev/root',
          }),
          '/examples/test-project/baseplate/project-definition.json':
            JSON.stringify({
              settings: { general: { name: 'test-project' } },
            }),
          '/regular/project/baseplate/project-definition.json': JSON.stringify({
            settings: { general: { name: 'regular-project' } },
          }),
        },
        '/',
      );

      // Act
      const exampleProject = await resolveProject('/examples/test-project');
      const regularProject = await resolveProject('/regular/project');

      // Assert
      expect(exampleProject.isInternalExample).toBe(true);
      expect(regularProject.isInternalExample).toBe(false);
    });

    it('handles Windows-style paths for example detection', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/examples/package.json': JSON.stringify({
            name: '@baseplate-dev/root',
          }),
          '/examples/test-project/baseplate/project-definition.json':
            JSON.stringify({
              settings: { general: { name: 'test-project' } },
            }),
        },
        '/',
      );

      // Act
      const result = await resolveProject('/examples/test-project');

      // Assert
      expect(result.isInternalExample).toBe(true);
    });
  });

  describe('directory expansion', () => {
    it('expands tilde in directory paths', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/home/user/project/baseplate/project-definition.json':
            JSON.stringify({
              settings: { general: { name: 'home-project' } },
            }),
        },
        '/',
      );

      // Act - Test with absolute path that simulates tilde expansion
      const result = await resolveProject('/home/user/project');

      // Assert
      expect(result.name).toBe('home-project');
      expect(result.path).toBe('/home/user/project');
    });
  });
});
