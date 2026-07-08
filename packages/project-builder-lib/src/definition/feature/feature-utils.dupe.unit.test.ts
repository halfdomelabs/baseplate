import { describe, expect, it } from 'vitest';

import type { ProjectDefinition } from '#src/schema/index.js';

import { FeatureUtils } from './feature-utils.js';

describe('ensureFeatureByNameRecursively idempotency', () => {
  it('does not duplicate a nested feature on repeated calls', () => {
    const draft = { features: [] } as unknown as ProjectDefinition;

    // Parent auth builder ensures both features.
    FeatureUtils.ensureFeatureByNameRecursively(draft, 'accounts/auth');
    FeatureUtils.ensureFeatureByNameRecursively(draft, 'accounts/users');

    // local-auth impl builder ensures the same features again (documented as
    // idempotent).
    FeatureUtils.ensureFeatureByNameRecursively(draft, 'accounts/auth');
    FeatureUtils.ensureFeatureByNameRecursively(draft, 'accounts/users');

    const names = draft.features.map((f) => f.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    expect({ names, duplicates }).toMatchObject({ duplicates: [] });
  });
});
