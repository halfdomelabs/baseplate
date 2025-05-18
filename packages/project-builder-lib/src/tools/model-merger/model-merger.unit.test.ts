import { describe, expect, it } from 'vitest';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type {
  ModelConfigInput,
  ModelScalarFieldConfigInput,
} from '@src/schema/models/index.js';

import { createTestProjectDefinitionContainer } from '@src/definition/project-definition-container.test-helper.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '@src/schema/definition.test-helper.js';
import {
  modelEntityType,
  modelScalarFieldEntityType,
} from '@src/schema/models/index.js';

import type {
  ModelMergerDiffOutput,
  ModelMergerModelInput,
  ModelMergerRelationFieldInput,
  ModelMergerScalarFieldInput,
  ModelMergerUniqueConstraintInput,
} from './model-merger.js';

import {
  applyModelMergerDiff,
  createModelMergerResult,
} from './model-merger.js';

describe('ModelMerger', () => {
  const testFeature = createTestFeature();
  const existingModel = createTestModel(testFeature.name, {
    name: 'ExistingModel',
  });
  const mockDefinitionContainer: ProjectDefinitionContainer =
    createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [existingModel],
    });

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
        { defaultName: 'TestModel', defaultFeatureRef: testFeature.id },
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
        { defaultName: 'TestModel', defaultFeatureRef: testFeature.id },
      );
      expect(result).toBeDefined();
      expect(result?.changes['model.fields']).toHaveLength(1);
      expect(result?.changes['model.fields']?.[0].type).toBe('update');
      expect(result?.changes['model.fields']?.[0].key).toBe('email');
      expect(
        (
          result?.changes['model.fields']?.[0]
            .item as ModelScalarFieldConfigInput
        ).isOptional,
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
        { defaultName: 'TestModel', defaultFeatureRef: testFeature.id },
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
        { defaultName: 'TestModel', defaultFeatureRef: testFeature.id },
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
      const current: ModelConfigInput = createTestModel(testFeature.id, {
        model: {
          fields: [idField],
          primaryKeyFieldRefs: [idField.id],
        },
      });

      const diff: ModelMergerDiffOutput = {
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

      const result = applyModelMergerDiff(
        current,
        diff,
        mockDefinitionContainer,
      );
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

      const diff: ModelMergerDiffOutput = {
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

      const result = applyModelMergerDiff(
        current,
        diff,
        mockDefinitionContainer,
      );
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

      const diff: ModelMergerDiffOutput = {
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

      const result = applyModelMergerDiff(
        current,
        diff,
        mockDefinitionContainer,
      );
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

      const diff: ModelMergerDiffOutput = {
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

      const result = applyModelMergerDiff(
        current,
        diff,
        mockDefinitionContainer,
      );
      expect(result.model.uniqueConstraints).toBeDefined();
      expect(result.model.uniqueConstraints?.[0].fields[0].fieldRef).toBe(
        emailFieldId,
      );
    });
  });
});
