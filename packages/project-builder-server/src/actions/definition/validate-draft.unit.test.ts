import type { DefinitionIssue } from '@baseplate-dev/project-builder-lib';

import { describe, expect, it } from 'vitest';

import { generateFixId, mapIssueToOutput } from './validate-draft.js';

describe('generateFixId', () => {
  it('produces a deterministic ID for the same issue', () => {
    const issue: DefinitionIssue = {
      message: 'Field type mismatch',
      entityId: 'model:abc',
      path: ['model', 'fields', 0, 'type'],
      severity: 'warning',
      fix: { label: "Change type to 'uuid'" },
    };

    const id1 = generateFixId(issue);
    const id2 = generateFixId(issue);

    expect(id1).toBe(id2);
    expect(id1).toMatch(/^fix-[0-9a-f]{8}$/);
  });

  it('produces different IDs for different issues', () => {
    const issueA: DefinitionIssue = {
      message: 'Field type mismatch',
      entityId: 'model:abc',
      path: ['model', 'fields', 0, 'type'],
      severity: 'warning',
    };

    const issueB: DefinitionIssue = {
      message: 'Duplicate name',
      entityId: 'model:abc',
      path: ['model', 'fields', 1, 'name'],
      severity: 'error',
    };

    expect(generateFixId(issueA)).not.toBe(generateFixId(issueB));
  });

  it('distinguishes issues with different entityIds but same message and path', () => {
    const issueA: DefinitionIssue = {
      message: 'Missing field',
      entityId: 'model:aaa',
      path: ['model', 'fields'],
      severity: 'warning',
    };

    const issueB: DefinitionIssue = {
      message: 'Missing field',
      entityId: 'model:bbb',
      path: ['model', 'fields'],
      severity: 'warning',
    };

    expect(generateFixId(issueA)).not.toBe(generateFixId(issueB));
  });

  it('handles root-scoped issues without entityId', () => {
    const issue: DefinitionIssue = {
      message: 'Duplicate feature name',
      path: ['features', 0, 'name'],
      severity: 'error',
    };

    const id = generateFixId(issue);
    expect(id).toMatch(/^fix-[0-9a-f]{8}$/);
  });
});

describe('mapIssueToOutput', () => {
  it('maps all fields including fix metadata', () => {
    const issue: DefinitionIssue = {
      message: 'Field type mismatch',
      entityId: 'model:abc',
      path: ['model', 'fields', 0, 'type'],
      severity: 'warning',
      fix: { label: "Change type to 'uuid'" },
    };

    const output = mapIssueToOutput(issue);

    expect(output).toEqual({
      message: 'Field type mismatch',
      entityId: 'model:abc',
      path: ['model', 'fields', 0, 'type'],
      severity: 'warning',
      fixLabel: "Change type to 'uuid'",
      fixId: generateFixId(issue),
    });
  });

  it('omits fix fields when no fix is available', () => {
    const issue: DefinitionIssue = {
      message: 'Some error',
      entityId: 'model:abc',
      path: ['model'],
      severity: 'error',
    };

    const output = mapIssueToOutput(issue);

    expect(output.fixLabel).toBeUndefined();
    expect(output.fixId).toBeUndefined();
  });

  it('handles root-scoped issues', () => {
    const issue: DefinitionIssue = {
      message: 'Global issue',
      path: ['settings'],
      severity: 'warning',
    };

    const output = mapIssueToOutput(issue);

    expect(output.entityId).toBeUndefined();
    expect(output.path).toEqual(['settings']);
  });
});
