import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { describe, expect, it } from 'vitest';

import { EMAIL_PLUGIN_CONFIG_MIGRATIONS } from './migrations.js';

describe('EMAIL_PLUGIN_CONFIG_MIGRATIONS', () => {
  it('backfills emailFeatureRef by creating an emails feature when none exists', () => {
    const migration = EMAIL_PLUGIN_CONFIG_MIGRATIONS[0];
    const projectDefinition: Partial<ProjectDefinition> = {
      features: [],
    };

    const result = migration.migrate(
      { implementationPluginKey: 'baseplate-dev_plugin-email_postmark' },
      projectDefinition,
    );

    expect(projectDefinition.features).toHaveLength(1);
    const [emailsFeature] = projectDefinition.features ?? [];
    expect(emailsFeature.name).toBe('emails');
    expect(result.updatedConfig).toMatchObject({
      implementationPluginKey: 'baseplate-dev_plugin-email_postmark',
      emailFeatureRef: emailsFeature.id,
    });
  });

  it('reuses an existing emails feature instead of creating a duplicate', () => {
    const migration = EMAIL_PLUGIN_CONFIG_MIGRATIONS[0];
    const projectDefinition: Partial<ProjectDefinition> = {
      features: [{ id: 'feature:existing', name: 'emails' }],
    };

    const result = migration.migrate({}, projectDefinition);

    expect(projectDefinition.features).toHaveLength(1);
    expect(result.updatedConfig).toMatchObject({
      emailFeatureRef: 'feature:existing',
    });
  });
});
