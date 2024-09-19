import { describe, expect, expectTypeOf, it } from 'vitest';

import { migration006IndividualServiceControllers } from './migration-006-individual-service-controllers.js';
import { ProjectDefinition } from '../schema/index.js';

describe('migration006IndividualServiceControllers', () => {
  it('migrates service fields to new format', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            build: true,
            create: {
              fields: ['name'],
              transformerNames: ['transformer1'],
            },
            update: {
              fields: ['name'],
              transformerNames: ['transformer2'],
            },
            delete: {
              disabled: false,
            },
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            create: {
              enabled: true,
              fields: ['name'],
              transformerNames: ['transformer1'],
            },
            update: {
              enabled: true,
              fields: ['name'],
              transformerNames: ['transformer2'],
            },
            delete: {
              enabled: true,
            },
          },
        },
      ],
    };

    const migratedConfig =
      migration006IndividualServiceControllers.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);

    // simple type test to make sure the destination type matches ProjectDefinition (can remove once migrations are done)
    expectTypeOf(migratedConfig).toMatchTypeOf<ProjectDefinition>();
  });

  it('handles missing service fields gracefully', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            build: true,
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            create: undefined,
            updated: undefined,
            delete: { enabled: true },
          },
        },
      ],
    };

    const migratedConfig =
      migration006IndividualServiceControllers.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('removes service field if build is false', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            build: false,
            create: {
              fields: ['name'],
              transformerNames: ['transformer1'],
            },
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const migratedConfig =
      migration006IndividualServiceControllers.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('removes delete and create if no fields', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            build: true,
            create: {
              fields: [],
              transformerNames: [],
            },
            update: {
              fields: ['name'],
              transformerNames: [],
            },
            delete: {
              disabled: true,
            },
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
          service: {
            update: {
              enabled: true,
              fields: ['name'],
              transformerNames: [],
            },
          },
        },
      ],
    };

    const migratedConfig =
      migration006IndividualServiceControllers.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('handles empty or missing service field gracefully', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const migratedConfig =
      migration006IndividualServiceControllers.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });
});
