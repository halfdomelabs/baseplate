import { describe, expect, it } from 'vitest';

import { NodePackageDependenciesContainer } from './package-dependencies-container.js';

describe('NodePackageDependenciesContainer', () => {
  it('should initialize with empty dependencies', () => {
    const container = new NodePackageDependenciesContainer();
    expect(container.getValue()).toEqual({
      dev: {},
      prod: {},
    });
  });

  it('should add a production dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    expect(container.getValue()).toEqual({
      dev: {},
      prod: { express: '^4.18.2' },
    });
  });

  it('should add a dev dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('typescript', '^5.0.0', 'dev');
    expect(container.getValue()).toEqual({
      dev: { typescript: '^5.0.0' },
      prod: {},
    });
  });

  it('should merge compatible versions when adding same dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    container.add('express', '4.18.2', 'prod');
    expect(container.getValue()).toEqual({
      dev: {},
      prod: { express: '4.18.2' },
    });
  });

  it('should throw error when adding incompatible versions', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    expect(() => {
      container.add('express', '^5.0.0', 'prod');
    }).toThrow(
      'Could not merge incompatible versions for dependency "express"',
    );
  });

  it('should upgrade to production dependency when adding same package as both dev and prod', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('typescript', '^5.0.0', 'dev');
    container.add('typescript', '^5.0.0', 'prod');
    expect(container.getValue()).toEqual({
      dev: {},
      prod: { typescript: '^5.0.0' },
    });
  });

  it('should add multiple dependencies at once', () => {
    const container = new NodePackageDependenciesContainer();
    container.addPackages({
      dev: { typescript: '^5.0.0' },
      prod: { express: '^4.18.2' },
    });
    expect(container.getValue()).toEqual({
      dev: { typescript: '^5.0.0' },
      prod: { express: '^4.18.2' },
    });
  });

  it('should handle merging multiple dependencies with addMany', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    container.add('typescript', '^5.0.0', 'dev');

    container.addPackages({
      dev: { typescript: '^5.0.0', eslint: '^8.0.0' },
      prod: { express: '4.18.2', cors: '^2.8.5' },
    });

    expect(container.getValue()).toEqual({
      dev: { typescript: '^5.0.0', eslint: '^8.0.0' },
      prod: { express: '4.18.2', cors: '^2.8.5' },
    });
  });
});
