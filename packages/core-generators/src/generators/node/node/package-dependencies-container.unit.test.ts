import { describe, expect, it } from 'vitest';

import { NodePackageDependenciesContainer } from './package-dependencies-container.js';

describe('NodePackageDependenciesContainer', () => {
  it('should initialize with empty dependencies', () => {
    const container = new NodePackageDependenciesContainer();
    expect(container.getValue()).toEqual({
      dev: {},
      prod: {},
      peer: {},
    });
  });

  it('should add a production dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    expect(container.getValue()).toEqual({
      dev: {},
      prod: { express: '^4.18.2' },
      peer: {},
    });
  });

  it('should add a dev dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('typescript', '^5.0.0', 'dev');
    expect(container.getValue()).toEqual({
      dev: { typescript: '^5.0.0' },
      prod: {},
      peer: {},
    });
  });

  it('should merge compatible versions when adding same dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.add('express', '^4.18.2', 'prod');
    container.add('express', '4.18.2', 'prod');
    expect(container.getValue()).toEqual({
      dev: {},
      prod: { express: '4.18.2' },
      peer: {},
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
      peer: {},
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
      peer: {},
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
      peer: {},
    });
  });

  it('should add a peer dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.addPeerPackages({ react: '^19.0.0' });
    expect(container.getValue()).toEqual({
      dev: {},
      prod: {},
      peer: { react: '^19.0.0' },
    });
  });

  it('should allow a package to be both a peer and a dev dependency at once', () => {
    const container = new NodePackageDependenciesContainer();
    container.addPackages({
      peer: { react: '^19.0.0' },
      dev: { react: '^19.0.0' },
    });
    expect(container.getValue()).toEqual({
      dev: { react: '^19.0.0' },
      prod: {},
      peer: { react: '^19.0.0' },
    });
  });

  it('should merge compatible versions when adding same peer dependency', () => {
    const container = new NodePackageDependenciesContainer();
    container.addPeerPackages({ react: '^19.0.0' });
    container.addPeerPackages({ react: '19.0.0' });
    expect(container.getValue()).toEqual({
      dev: {},
      prod: {},
      peer: { react: '19.0.0' },
    });
  });

  it('should throw error when adding incompatible peer dependency versions', () => {
    const container = new NodePackageDependenciesContainer();
    container.addPeerPackages({ react: '^19.0.0' });
    expect(() => {
      container.addPeerPackages({ react: '^18.0.0' });
    }).toThrow('Could not merge incompatible versions for dependency "react"');
  });
});
