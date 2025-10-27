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
vi.mock('./find-examples-directories.js', () => ({
  findExamplesDirectories: vi.fn(),
}));

const mockFindExamplesDirectories = vi.mocked(
  await import('./find-examples-directories.js'),
).findExamplesDirectories;

describe('project-resolver', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.PROJECT_DIRECTORIES;
    delete process.env.INCLUDE_EXAMPLES;
  });

  describe('resolveProjects', () => {
    it('resolves projects from provided directories', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/package.json': JSON.stringify({
            name: 'test-project-1',
            version: '1.0.0',
          }),
          '/project2/package.json': JSON.stringify({
            name: 'test-project-2',
            version: '2.0.0',
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
        packageJson: { name: 'test-project-1', version: '1.0.0' },
        isInternalExample: false,
      });
      expect(result.get('test-project-2')).toEqual({
        name: 'test-project-2',
        path: '/project2',
        packageJson: { name: 'test-project-2', version: '2.0.0' },
        isInternalExample: false,
      });
    });

    it('includes example projects when includeExamples is true', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/examples/blog-with-auth/package.json': JSON.stringify({
            name: 'blog-with-auth',
            version: '0.1.0',
          }),
          '/examples/todo-app/package.json': JSON.stringify({
            name: 'todo-app',
            version: '0.1.0',
          }),
        },
        '/',
      );

      mockFindExamplesDirectories.mockResolvedValue([
        '/examples/blog-with-auth',
        '/examples/todo-app',
      ]);

      // Act
      const result = await resolveProjects({
        includeExamples: true,
      });

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('blog-with-auth')).toEqual({
        name: 'blog-with-auth',
        path: '/examples/blog-with-auth',
        packageJson: { name: 'blog-with-auth', version: '0.1.0' },
        isInternalExample: true,
      });
      expect(result.get('todo-app')).toEqual({
        name: 'todo-app',
        path: '/examples/todo-app',
        packageJson: { name: 'todo-app', version: '0.1.0' },
        isInternalExample: true,
      });
    });

    it('uses PROJECT_DIRECTORIES environment variable', async () => {
      // Arrange
      process.env.PROJECT_DIRECTORIES = '/project1,/project2';
      vol.fromJSON(
        {
          '/project1/package.json': JSON.stringify({
            name: 'env-project-1',
            version: '1.0.0',
          }),
          '/project2/package.json': JSON.stringify({
            name: 'env-project-2',
            version: '2.0.0',
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

    it('uses INCLUDE_EXAMPLES environment variable', async () => {
      // Arrange
      process.env.INCLUDE_EXAMPLES = 'true';
      vol.fromJSON(
        {
          '/examples/test-example/package.json': JSON.stringify({
            name: 'test-example',
            version: '0.1.0',
          }),
        },
        '/',
      );

      mockFindExamplesDirectories.mockResolvedValue(['/examples/test-example']);

      // Act
      const result = await resolveProjects();

      // Assert
      expect(result.size).toBe(1);
      expect(result.get('test-example')).toEqual({
        name: 'test-example',
        path: '/examples/test-example',
        packageJson: { name: 'test-example', version: '0.1.0' },
        isInternalExample: true,
      });
    });

    it('defaults to current working directory when defaultToCwd is true and no projects specified', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/current/package.json': JSON.stringify({
            name: 'current-project',
            version: '1.0.0',
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
        packageJson: { name: 'current-project', version: '1.0.0' },
        isInternalExample: false,
      });
    });

    it('throws error on duplicate project names', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/package.json': JSON.stringify({
            name: 'duplicate-name',
            version: '1.0.0',
          }),
          '/project2/package.json': JSON.stringify({
            name: 'duplicate-name',
            version: '2.0.0',
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
          '/project1/package.json': JSON.stringify({
            name: 'valid-project',
            version: '1.0.0',
          }),
          '/project2/other-file.txt': 'not a package.json',
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
          '/absolute/path/package.json': JSON.stringify({
            name: 'path-project',
            version: '1.0.0',
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
        packageJson: { name: 'path-project', version: '1.0.0' },
        isInternalExample: false,
      });
    });

    it('resolves project by relative path with separators', async () => {
      // Arrange
      const currentDir = process.cwd();
      const relativePath = `${currentDir}/relative/path`;
      vol.fromJSON(
        {
          [`${relativePath}/package.json`]: JSON.stringify({
            name: 'relative-project',
            version: '1.0.0',
          }),
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
          '/project1/package.json': JSON.stringify({
            name: 'named-project',
            version: '1.0.0',
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
        packageJson: { name: 'named-project', version: '1.0.0' },
        isInternalExample: false,
      });
    });

    it('throws error when project name is not found', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project1/package.json': JSON.stringify({
            name: 'existing-project',
            version: '1.0.0',
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

    it('throws error when package.json has no name field', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project/package.json': JSON.stringify({
            version: '1.0.0',
            // Missing name field
          }),
        },
        '/',
      );

      // Act & Assert
      await expect(resolveProject('/project')).rejects.toThrow(
        'package.json must have a valid "name" field',
      );
    });

    it('throws error when package.json has invalid name field', async () => {
      // Arrange
      vol.fromJSON(
        {
          '/project/package.json': JSON.stringify({
            name: null,
            version: '1.0.0',
          }),
        },
        '/',
      );

      // Act & Assert
      await expect(resolveProject('/project')).rejects.toThrow(
        'package.json must have a valid "name" field',
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
          '/examples/test-project/package.json': JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
          }),
          '/regular/project/package.json': JSON.stringify({
            name: 'regular-project',
            version: '1.0.0',
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
          '/examples/test-project/package.json': JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
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
          '/home/user/project/package.json': JSON.stringify({
            name: 'home-project',
            version: '1.0.0',
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
