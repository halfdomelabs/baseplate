import { describe, expect, it } from 'vitest';

import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { createPluginModule } from '#src/plugins/imports/types.js';
import { createTestPluginSpecStore } from '#src/plugins/plugins.test-utils.js';
import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { checkMutationRoles } from './mutation-roles-checker.js';

const authEnabledModule = createPluginModule({
  name: 'test-auth-config',
  dependencies: { authConfig: authConfigSpec },
  initialize: ({ authConfig }) => {
    authConfig.getAuthConfig.set(() => ({
      roles: [{ id: '1', name: 'admin', comment: '', builtIn: false }],
    }));
  },
});

const feature = createTestFeature({ name: 'core' });
const authDisabledStore = createTestPluginSpecStore();
const authEnabledStore = createTestPluginSpecStore([authEnabledModule]);

function createDefinitionWithModels(
  ...modelOverrides: Parameters<typeof createTestModel>[0][]
): ProjectDefinition {
  const models = modelOverrides.map((overrides) =>
    createTestModel({
      featureRef: feature.name,
      model: {
        fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
        primaryKeyFieldRefs: ['id'],
      },
      ...overrides,
    }),
  );
  return createTestProjectDefinitionContainer({
    features: [feature],
    models,
  }).definition;
}

describe('checkMutationRoles', () => {
  it('returns no issues when auth is disabled', () => {
    const definition = createDefinitionWithModels({
      service: {
        create: { enabled: true, globalRoles: [] },
      },
      graphql: { mutations: { create: { enabled: true } } },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authDisabledStore,
    });
    expect(issues).toEqual([]);
  });

  it('returns no issues when mutation has roles assigned', () => {
    const definition = createDefinitionWithModels({
      service: {
        create: { enabled: true, globalRoles: ['admin'] },
      },
      graphql: { mutations: { create: { enabled: true } } },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toEqual([]);
  });

  it('returns warning when mutation exposed to GraphQL has no roles', () => {
    const definition = createDefinitionWithModels({
      name: 'Post',
      service: { create: { enabled: true, globalRoles: [] } },
      graphql: { mutations: { create: { enabled: true } } },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message:
        "Model 'Post' create mutation is exposed to GraphQL but has no roles assigned",
      path: ['models', 0, 'service', 'create', 'globalRoles'],
      severity: 'warning',
    });
  });

  it('returns no issues when mutation is enabled but not exposed to GraphQL', () => {
    const definition = createDefinitionWithModels({
      service: { create: { enabled: true, globalRoles: [] } },
      graphql: { mutations: { create: { enabled: false } } },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toEqual([]);
  });

  it('returns no issues when update has instance roles', () => {
    const definition = createDefinitionWithModels({
      service: {
        update: {
          enabled: true,
          globalRoles: [],
          instanceRoles: ['owner'],
        },
      },
      graphql: { mutations: { update: { enabled: true } } },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toEqual([]);
  });

  it('warns for multiple mutations missing roles', () => {
    const definition = createDefinitionWithModels({
      name: 'Post',
      service: {
        create: { enabled: true, globalRoles: [] },
        update: {
          enabled: true,
          globalRoles: [],
          instanceRoles: [],
        },
        delete: {
          enabled: true,
          globalRoles: [],
          instanceRoles: [],
        },
      },
      graphql: {
        mutations: {
          create: { enabled: true },
          update: { enabled: true },
          delete: { enabled: true },
        },
      },
    });

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toHaveLength(3);
  });

  it('handles empty models array', () => {
    const { definition } = createTestProjectDefinitionContainer();

    const issues = checkMutationRoles(definition, {
      pluginStore: authEnabledStore,
    });
    expect(issues).toEqual([]);
  });
});
