import { createTaskTestRunner } from '@baseplate-dev/sync';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { pnpmWorkspaceGenerator } from './pnpm-workspace.generator.js';

async function renderWorkspaceYaml(
  descriptor: Parameters<typeof pnpmWorkspaceGenerator>[0],
): Promise<{ raw: string; parsed: Record<string, unknown> }> {
  const bundle = pnpmWorkspaceGenerator(descriptor);
  const runner = createTaskTestRunner(bundle.tasks.main);
  const result = await runner.run({});
  const raw = result.getFileOutputContents('pnpm-workspace.yaml') ?? '';
  return { raw, parsed: parse(raw) as Record<string, unknown> };
}

describe('pnpmWorkspaceGenerator', () => {
  it('disables strict dep builds so unapproved build scripts only warn', async () => {
    const { parsed } = await renderWorkspaceYaml({
      packages: ['apps/*', 'libs/*'],
    });

    expect(parsed.packages).toEqual(['apps/*', 'libs/*']);
    expect(parsed.strictDepBuilds).toBe(false);
  });

  it('does not emit allowBuilds when none are provided', async () => {
    const { raw, parsed } = await renderWorkspaceYaml({
      packages: ['apps/*'],
    });

    expect(parsed).not.toHaveProperty('allowBuilds');
    expect(raw).not.toContain('allowBuilds');
  });

  it('emits a sorted allowBuilds block preserving true/false approvals', async () => {
    const { parsed } = await renderWorkspaceYaml({
      packages: ['apps/*'],
      // Intentionally unsorted to verify deterministic ordering.
      allowBuilds: { prisma: true, esbuild: false, '@prisma/engines': true },
    });

    expect(parsed.allowBuilds).toEqual({
      '@prisma/engines': true,
      esbuild: false,
      prisma: true,
    });
    expect(Object.keys(parsed.allowBuilds as Record<string, boolean>)).toEqual([
      '@prisma/engines',
      'esbuild',
      'prisma',
    ]);
  });
});
