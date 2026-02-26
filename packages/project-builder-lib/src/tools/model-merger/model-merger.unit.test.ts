import { isEqual, mapValues } from 'es-toolkit';
import { describe, expect, it } from 'vitest';

import type {
  ModelConfigInput,
  ModelScalarFieldConfigInput,
} from '#src/schema/models/index.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import {
  createTestProjectDefinition,
  createTestProjectDefinitionContainer,
} from '#src/definition/project-definition-container.test-utils.js';
import { serializeSchemaFromRefPayload } from '#src/references/serialize-schema.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/schema/definition.test-helper.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import type {
  ModelMergerDefinitionDiffOutput,
  ModelMergerModelInput,
  ModelMergerModelsInput,
  ModelMergerRelationFieldInput,
  ModelMergerScalarFieldInput,
  ModelMergerUniqueConstraintInput,
} from './model-merger.js';

import {
  applyModelMergerDiff,
  createAndApplyModelMergerResults,
  createModelMergerResult,
} from './model-merger.js';

const testFeature = createTestFeature();
const existingModel = createTestModel({
  featureRef: testFeature.name,
  name: 'ExistingModel',
});
const testProjectDefinition = createTestProjectDefinition({
  features: [testFeature],
  models: [existingModel],
});
const mockDefinitionContainer: ProjectDefinitionContainer =
  createTestProjectDefinitionContainer(testProjectDefinition);

function applyModelMergerDiffToProjectDefinition<
  T extends ModelMergerModelsInput,
>(
  existingModels: Record<keyof T, ModelConfigInput | undefined>,
  desired: T,
): {
  newDefinition: ProjectDefinition;
  newIds: Record<keyof T, string>;
  serializedDefinition: ProjectDefinition;
  hasChanges: boolean;
} {
  const definitionContainer = createTestProjectDefinitionContainer({
    features: [testFeature],
    models: Object.values(existingModels).filter((x) => x !== undefined),
  });
  const draftDefinition = structuredClone(definitionContainer.definition);

  const newIds = createAndApplyModelMergerResults(
    draftDefinition,
    mapValues(existingModels, (x) => x?.id ?? undefined),
    desired,
    definitionContainer,
  );
  const newDefinitionContainer = ProjectDefinitionContainer.fromDefinition(
    draftDefinition,
    definitionContainer.parserContext,
  );
  return {
    newDefinition: draftDefinition,
    newIds,
    serializedDefinition: serializeSchemaFromRefPayload(
      newDefinitionContainer.refPayload,
    ),
    hasChanges: !isEqual(draftDefinition, newDefinitionContainer.definition),
  };
}

describe('createModelMergerDiff', () => {
  it('should detect field additions', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: idFieldId,
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
        ],
        primaryKeyFieldRefs: [idFieldId],
      },
    };

    const desired: ModelMergerModelInput = {
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'email',
            type: 'string',
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    };

    const result = createModelMergerResult(
      current,
      desired,
      mockDefinitionContainer,
    );
    expect(result).toBeDefined();
    expect(result?.changes['model.fields']).toHaveLength(1);
    expect(result?.changes['model.fields']?.[0].type).toBe('add');
    expect(result?.changes['model.fields']?.[0].key).toBe('email');
  });

  it('should detect field updates', () => {
    const fieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: fieldId,
            name: 'email',
            type: 'string',
            isOptional: false,
          },
        ],
        primaryKeyFieldRefs: [fieldId],
      },
    };

    const desired: ModelMergerModelInput = {
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            name: 'email',
            type: 'string',
            isOptional: true,
          },
        ],
        primaryKeyFieldRefs: ['email'],
      },
    };

    const result = createModelMergerResult(
      current,
      desired,
      mockDefinitionContainer,
    );
    expect(result).toBeDefined();
    expect(result?.changes['model.fields']).toHaveLength(1);
    expect(result?.changes['model.fields']?.[0].type).toBe('update');
    expect(result?.changes['model.fields']?.[0].key).toBe('email');
    expect(
      (result?.changes['model.fields']?.[0].item as ModelScalarFieldConfigInput)
        .isOptional,
    ).toBe(true);
  });

  it('should detect relation additions', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: idFieldId,
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
        ],
        primaryKeyFieldRefs: [idFieldId],
      },
    };

    const desired: ModelMergerModelInput = {
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
        ],
        relations: [
          {
            name: 'posts',
            modelRef: existingModel.id,
            references: [
              {
                localRef: 'id',
                foreignRef: 'id',
              },
            ],
            foreignRelationName: 'author',
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    };

    const result = createModelMergerResult(
      current,
      desired,
      mockDefinitionContainer,
    );
    expect(result).toBeDefined();
    expect(result?.changes['model.fields']).toEqual([]);
    expect(result?.changes['model.relations']).toEqual([
      {
        type: 'add',
        key: 'posts',
        item: {
          name: 'posts',
          modelRef: existingModel.id,
          references: [
            {
              localRef: 'id',
              foreignRef: 'id',
            },
          ],
          foreignRelationName: 'author',
        },
      },
    ]);
  });

  it('should detect unique constraint additions', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const emailFieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: 'model1',
      name: 'TestModel',
      featureRef: 'feature1',
      model: {
        fields: [
          {
            id: idFieldId,
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            id: emailFieldId,
            name: 'email',
            type: 'string',
          },
        ],
        primaryKeyFieldRefs: [idFieldId],
      },
    };

    const desired: ModelMergerModelInput = {
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'email',
            type: 'string',
          },
        ],
        uniqueConstraints: [
          {
            fields: [{ fieldRef: 'email' }],
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    };

    const result = createModelMergerResult(
      current,
      desired,
      mockDefinitionContainer,
    );
    expect(result).toBeDefined();
    expect(result?.changes['model.fields']).toEqual([]);
    expect(result?.changes['model.relations']).toEqual([]);
    expect(result?.changes['model.uniqueConstraints']).toEqual([
      {
        type: 'add',
        key: 'email',
        item: {
          fields: [{ fieldRef: 'email' }],
        },
      },
    ]);
  });
});

describe('applyModelMergerDiff', () => {
  it('should apply field additions', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true, default: '123' },
    });
    const current: ModelConfigInput = createTestModel({
      featureRef: testFeature.id,
      model: {
        fields: [idField],
        primaryKeyFieldRefs: [idField.id],
      },
    });

    const diff: ModelMergerDefinitionDiffOutput = {
      'model.fields': [
        {
          type: 'add',
          key: 'email',
          item: {
            name: 'email',
            type: 'string',
          } satisfies ModelMergerScalarFieldInput,
        },
      ],
      'model.relations': [],
      'model.primaryKeyFieldRefs': [],
      'model.uniqueConstraints': [],
    };

    const result = applyModelMergerDiff(current, diff, mockDefinitionContainer);
    expect(result.model.fields).toHaveLength(2);
    expect(result.model.fields[1].name).toBe('email');
    expect(result.model.fields[1].type).toBe('string');
    expect(result.model.fields[1].id).toBeDefined();
    expect(typeof result.model.fields[1].id).toBe('string');
    expect(result.model.fields[0].id).toBe(idField.id);
  });

  it('should apply field updates', () => {
    const fieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: fieldId,
            name: 'email',
            type: 'string',
            isOptional: false,
          },
        ],
        primaryKeyFieldRefs: [fieldId],
      },
    };

    const diff: ModelMergerDefinitionDiffOutput = {
      'model.fields': [
        {
          type: 'update',
          key: 'email',
          item: {
            name: 'email',
            type: 'string',
            isOptional: true,
          },
        },
      ],
      'model.relations': [],
      'model.primaryKeyFieldRefs': [],
      'model.uniqueConstraints': [],
    };

    const result = applyModelMergerDiff(current, diff, mockDefinitionContainer);
    expect(result.model.fields[0].isOptional).toBe(true);
    expect(result.model.fields[0].id).toBe(fieldId);
  });

  it('should apply relation additions', () => {
    const fieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: fieldId,
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
        ],
        primaryKeyFieldRefs: [fieldId],
      },
    };

    const diff: ModelMergerDefinitionDiffOutput = {
      'model.fields': [],
      'model.relations': [
        {
          type: 'add',
          key: 'posts',
          item: {
            name: 'posts',
            modelRef: existingModel.id,
            references: [
              {
                localRef: 'id',
                foreignRef: 'id',
              },
            ],
            foreignRelationName: 'author',
          } satisfies ModelMergerRelationFieldInput,
        },
      ],
      'model.primaryKeyFieldRefs': [],
      'model.uniqueConstraints': [],
    };

    const result = applyModelMergerDiff(current, diff, mockDefinitionContainer);
    expect(result.model.relations).toBeDefined();
    expect(result.model.relations?.[0].name).toBe('posts');
    expect(result.model.relations?.[0].modelRef).toBe(existingModel.id);
  });

  it('should apply unique constraint additions', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const emailFieldId = modelScalarFieldEntityType.generateNewId();
    const current: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'TestModel',
      featureRef: testFeature.id,
      model: {
        fields: [
          {
            id: idFieldId,
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            id: emailFieldId,
            name: 'email',
            type: 'string',
          },
        ],
        primaryKeyFieldRefs: [idFieldId],
      },
    };

    const diff: ModelMergerDefinitionDiffOutput = {
      'model.fields': [],
      'model.relations': [],
      'model.primaryKeyFieldRefs': [],
      'model.uniqueConstraints': [
        {
          type: 'add',
          key: 'email',
          item: {
            fields: [{ fieldRef: 'email' }],
          } satisfies ModelMergerUniqueConstraintInput,
        },
      ],
    };

    const result = applyModelMergerDiff(current, diff, mockDefinitionContainer);
    expect(result.model.uniqueConstraints).toBeDefined();
    expect(result.model.uniqueConstraints?.[0].fields[0].fieldRef).toBe(
      emailFieldId,
    );
  });
});

describe('GraphQL support', () => {
  it('should apply GraphQL objectType field additions', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const nameFieldId = modelScalarFieldEntityType.generateNewId();
    const current = {
      TestModel: {
        id: modelEntityType.generateNewId(),
        name: 'TestModel',
        featureRef: testFeature.name,
        model: {
          fields: [
            {
              id: idFieldId,
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              id: nameFieldId,
              name: 'name',
              type: 'string',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: false,
            fields: [{ ref: 'id' }],
          },
        },
      },
    } satisfies Record<string, ModelConfigInput>;

    const desired = {
      TestModel: {
        name: 'TestModel',
        featureRef: testFeature.id,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'name' }],
          },
        },
      },
    } satisfies ModelMergerModelsInput;

    const { serializedDefinition } = applyModelMergerDiffToProjectDefinition(
      current,
      desired,
    );
    expect(
      serializedDefinition.models[0].graphql.objectType.fields.map(
        (f) => f.ref,
      ),
    ).toEqual(['id', 'name']);
  });

  it('should not remove existing GraphQL fields when using ArrayIncludesField', () => {
    const idFieldId = modelScalarFieldEntityType.generateNewId();
    const nameFieldId = modelScalarFieldEntityType.generateNewId();
    const emailFieldId = modelScalarFieldEntityType.generateNewId();
    const current = {
      TestModel: {
        id: modelEntityType.generateNewId(),
        name: 'TestModel',
        featureRef: testFeature.name,
        model: {
          fields: [
            {
              id: idFieldId,
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              id: nameFieldId,
              name: 'name',
              type: 'string',
            },
            {
              id: emailFieldId,
              name: 'email',
              type: 'string',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'name' }, { ref: 'email' }],
          },
        },
      },
    } satisfies Record<string, ModelConfigInput>;

    const desired = {
      TestModel: {
        name: 'TestModel',
        featureRef: testFeature.id,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'email',
              type: 'string',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'name' }], // Missing 'email' but it should not be removed
          },
        },
      },
    } satisfies ModelMergerModelsInput;

    const { hasChanges } = applyModelMergerDiffToProjectDefinition(
      current,
      desired,
    );
    // Should have no changes since our custom field only adds, never removes
    expect(hasChanges).toBe(false);
  });

  it('should handle GraphQL relations correctly', () => {
    const authorModel: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'Author',
      featureRef: testFeature.name,
      model: {
        fields: [
          {
            id: modelScalarFieldEntityType.generateNewId(),
            name: 'id',
            type: 'uuid',
            options: { genUuid: true, default: 'uuid_generate_v4()' },
            isOptional: false,
          },
          {
            id: modelScalarFieldEntityType.generateNewId(),
            name: 'name',
            type: 'string',
            options: { default: '' },
            isOptional: false,
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    };

    const postModel: ModelConfigInput = {
      id: modelEntityType.generateNewId(),
      name: 'Post',
      featureRef: testFeature.name,
      model: {
        fields: [
          {
            id: modelScalarFieldEntityType.generateNewId(),
            name: 'id',
            type: 'uuid',
            options: { genUuid: true, default: 'uuid_generate_v4()' },
            isOptional: false,
          },
          {
            id: modelScalarFieldEntityType.generateNewId(),
            name: 'title',
            type: 'string',
            options: { default: '' },
            isOptional: false,
          },
        ],
        relations: [
          {
            id: modelLocalRelationEntityType.generateNewId(),
            foreignId: modelForeignRelationEntityType.generateNewId(),
            name: 'author',
            modelRef: authorModel.name,
            references: [
              {
                localRef: 'id',
                foreignRef: 'id',
              },
            ],
            foreignRelationName: 'posts',
            onDelete: 'Cascade',
            onUpdate: 'Cascade',
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    };

    const current = {
      Author: authorModel,
      Post: postModel,
    } satisfies Record<string, ModelConfigInput>;

    const desired = {
      Author: {
        name: 'Author',
        featureRef: testFeature.id,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true, default: 'uuid_generate_v4()' },
              isOptional: false,
            },
            {
              name: 'name',
              type: 'string',
              options: { default: '' },
              isOptional: false,
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'name' }],
            foreignRelations: [{ ref: 'posts' }],
          },
        },
      },
      Post: {
        name: 'Post',
        featureRef: testFeature.id,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true, default: 'uuid_generate_v4()' },
              isOptional: false,
            },
            {
              name: 'title',
              type: 'string',
              options: { default: '' },
              isOptional: false,
            },
          ],
          relations: [
            {
              name: 'author',
              modelRef: 'Author',
              references: [
                {
                  localRef: 'id',
                  foreignRef: 'id',
                },
              ],
              foreignRelationName: 'posts',
              onDelete: 'Cascade',
              onUpdate: 'Cascade',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'title' }],
            localRelations: [{ ref: 'author' }],
          },
        },
      },
    } satisfies ModelMergerModelsInput;

    const { serializedDefinition } = applyModelMergerDiffToProjectDefinition(
      current,
      desired,
    );

    const authorModelResult = serializedDefinition.models.find(
      (m) => m.name === 'Author',
    );
    const postModelResult = serializedDefinition.models.find(
      (m) => m.name === 'Post',
    );

    expect(
      authorModelResult?.graphql.objectType.fields.map((f) => f.ref),
    ).toEqual(['id', 'name']);
    expect(
      authorModelResult?.graphql.objectType.foreignRelations.map((r) => r.ref),
    ).toEqual(['posts']);
    expect(
      postModelResult?.graphql.objectType.fields.map((f) => f.ref),
    ).toEqual(['id', 'title']);
    expect(
      postModelResult?.graphql.objectType.localRelations.map((r) => r.ref),
    ).toEqual(['author']);
  });
});
