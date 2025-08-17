import { describe, expect, it } from 'vitest';

import { migration019ColumnTypeBased } from './migration-019-column-type-based.js';

describe('migration019ColumnTypeBased', () => {
  it('should migrate text columns from display-based to type-based', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'web',
          name: 'Test App',
          adminApp: {
            sections: [
              {
                id: 'section1',
                name: 'Users',
                type: 'crud',
                table: {
                  columns: [
                    {
                      id: 'col1',
                      label: 'Name',
                      display: {
                        type: 'text' as const,
                        modelFieldRef: 'name',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(
      result.apps?.[0]?.adminApp?.sections?.[0]?.table?.columns?.[0],
    ).toEqual({
      id: 'col1',
      type: 'text',
      label: 'Name',
      modelFieldRef: 'name',
    });
  });

  it('should migrate foreign columns from display-based to type-based', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'web',
          name: 'Test App',
          adminApp: {
            sections: [
              {
                id: 'section1',
                name: 'Posts',
                type: 'crud',
                table: {
                  columns: [
                    {
                      id: 'col1',
                      label: 'Author',
                      display: {
                        type: 'foreign' as const,
                        localRelationRef: 'authorRef',
                        labelExpression: 'name',
                        valueExpression: 'id',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(
      result.apps?.[0]?.adminApp?.sections?.[0]?.table?.columns?.[0],
    ).toEqual({
      id: 'col1',
      type: 'foreign',
      label: 'Author',
      localRelationRef: 'authorRef',
      labelExpression: 'name',
      valueExpression: 'id',
    });
  });

  it('should migrate embedded form columns', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'web',
          name: 'Test App',
          adminApp: {
            sections: [
              {
                id: 'section1',
                name: 'Users',
                type: 'crud',
                embeddedForms: [
                  {
                    id: 'form1',
                    name: 'Posts',
                    type: 'list',
                    table: {
                      columns: [
                        {
                          id: 'col1',
                          label: 'Title',
                          display: {
                            type: 'text' as const,
                            modelFieldRef: 'title',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(
      result.apps?.[0]?.adminApp?.sections?.[0]?.embeddedForms?.[0]?.table
        ?.columns?.[0],
    ).toEqual({
      id: 'col1',
      type: 'text',
      label: 'Title',
      modelFieldRef: 'title',
    });
  });

  it('should handle sections without tables or columns', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'web',
          name: 'Test App',
          adminApp: {
            sections: [
              {
                id: 'section1',
                name: 'Users',
                type: 'crud',
                // No table property
              },
              {
                id: 'section2',
                name: 'Posts',
                type: 'crud',
                table: {
                  // No columns property
                },
              },
            ],
          },
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections).toHaveLength(2);
    expect(result.apps?.[0]?.adminApp?.sections?.[0]).toEqual({
      id: 'section1',
      name: 'Users',
      type: 'crud',
    });
    expect(result.apps?.[0]?.adminApp?.sections?.[1]).toEqual({
      id: 'section2',
      name: 'Posts',
      type: 'crud',
      table: {},
    });
  });

  it('should handle apps without adminApp', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'backend',
          name: 'API App',
          // No adminApp
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'app1',
      type: 'backend',
      name: 'API App',
    });
  });

  it('should handle config without apps', () => {
    const oldConfig = {
      schemaVersion: 18,
      models: [
        {
          id: 'model1',
          name: 'User',
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(result).toEqual(oldConfig);
  });

  it('should preserve other column properties', () => {
    const oldConfig = {
      schemaVersion: 18,
      apps: [
        {
          id: 'app1',
          type: 'web',
          name: 'Test App',
          adminApp: {
            sections: [
              {
                id: 'section1',
                name: 'Users',
                type: 'crud',
                table: {
                  columns: [
                    {
                      id: 'col1',
                      label: 'Name',
                      customProperty: 'preserved',
                      display: {
                        type: 'text' as const,
                        modelFieldRef: 'name',
                        customDisplayProperty: 'ignored',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    const result = migration019ColumnTypeBased.migrate(oldConfig);

    expect(
      result.apps?.[0]?.adminApp?.sections?.[0]?.table?.columns?.[0],
    ).toEqual({
      id: 'col1',
      type: 'text',
      label: 'Name',
      modelFieldRef: 'name',
      customProperty: 'preserved',
    });
  });
});
