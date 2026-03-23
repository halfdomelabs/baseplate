import { describe, expect, it } from 'vitest';

import { migration031UuidDefaultGeneration } from './migration-031-uuid-default-generation.js';

describe('migration-031-uuid-default-generation', () => {
  it('should convert genUuid: true to defaultGeneration: uuidv4', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      models: [
        {
          model: {
            fields: [
              {
                name: 'id',
                type: 'uuid',
                options: { genUuid: true, default: '' },
              },
            ],
          },
        },
      ],
    });

    expect(result.models?.[0]?.model?.fields?.[0]?.options).toEqual({
      defaultGeneration: 'uuidv4',
    });
  });

  it('should convert genUuid: false to defaultGeneration: none', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      models: [
        {
          model: {
            fields: [
              {
                name: 'id',
                type: 'uuid',
                options: { genUuid: false },
              },
            ],
          },
        },
      ],
    });

    expect(result.models?.[0]?.model?.fields?.[0]?.options).toEqual({
      defaultGeneration: 'none',
    });
  });

  it('should convert absent genUuid to defaultGeneration: none', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      models: [
        {
          model: {
            fields: [
              {
                name: 'id',
                type: 'uuid',
                options: {},
              },
            ],
          },
        },
      ],
    });

    expect(result.models?.[0]?.model?.fields?.[0]?.options).toEqual({
      defaultGeneration: 'none',
    });
  });

  it('should not modify non-uuid fields', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      models: [
        {
          model: {
            fields: [
              {
                name: 'email',
                type: 'string',
                options: { default: 'test@example.com' },
              },
            ],
          },
        },
      ],
    });

    expect(result.models?.[0]?.model?.fields?.[0]?.options).toEqual({
      default: 'test@example.com',
    });
  });

  it('should handle models without fields', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      models: [{ model: {} }],
    });

    expect(result.models?.[0]?.model).toEqual({});
  });

  it('should handle config without models', () => {
    const result = migration031UuidDefaultGeneration.migrate({
      settings: { theme: {} },
    });

    expect(result).toEqual({ settings: { theme: {} } });
  });
});
