import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginImplementationStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { ZodRefContext } from './extract-definition-refs.js';

import { deserializeSchemaWithTransformedReferences } from './deserialize-schema.js';
import { extractDefinitionRefsRecursive } from './extract-definition-refs.js';
import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { parseSchemaWithTransformedReferences } from './parse-schema-with-references.js';
import { createDefinitionEntityNameResolver } from './ref-builder.js';
import { createEntityType, DefinitionEntityType } from './types.js';

describe('extract-definition-refs', () => {
  describe('Integration Tests (deserializeSchemaWithTransformedReferences)', () => {
    const pluginStore = new PluginImplementationStore({});

    describe('Basic Schema Patterns', () => {
      it('should handle schema with no references', () => {
        const schemaCreator = definitionSchema(() =>
          z.object({
            name: z.string(),
            value: z.number(),
          }),
        );

        const input = {
          name: 'test',
          value: 42,
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data).toEqual(input);
        expect(result.entities).toHaveLength(0);
        expect(result.references).toHaveLength(0);
      });

      it('should collect an entity and resolve a simple reference', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entity: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            ref: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'RESTRICT',
            }),
          }),
        );

        const input = {
          entity: [{ id: entityType.generateNewId(), name: 'Entity One' }],
          ref: 'Entity One',
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.ref).toEqual(result.data.entity[0].id);
        expect(result.entities).toHaveLength(1);
        expect(result.references).toHaveLength(1);
        expect(result.references[0]).toMatchObject({
          type: entityType,
          path: ['ref'],
          onDelete: 'RESTRICT',
        });
      });

      it('should handle multiple references to same entity type', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            ref1: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'DELETE',
            }),
            ref2: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'RESTRICT',
            }),
          }),
        );

        const input = {
          entities: [
            { id: entityType.generateNewId(), name: 'Entity One' },
            { id: entityType.generateNewId(), name: 'Entity Two' },
          ],
          ref1: 'Entity One',
          ref2: 'Entity Two',
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.ref1).toEqual(result.data.entities[0].id);
        expect(result.data.ref2).toEqual(result.data.entities[1].id);
        expect(result.entities).toHaveLength(2);
        expect(result.references).toHaveLength(2);
      });
    });

    describe('Advanced Reference Patterns', () => {
      it('should handle nested references', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            nested: z.object({
              ref: ctx.withRef(z.string(), {
                type: entityType,
                onDelete: 'SET_NULL',
              }),
              metadata: z.object({
                description: z.string(),
              }),
            }),
          }),
        );

        const input = {
          entities: [{ id: entityType.generateNewId(), name: 'Target Entity' }],
          nested: {
            ref: 'Target Entity',
            metadata: {
              description: 'A nested reference test',
            },
          },
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.nested.ref).toEqual(result.data.entities[0].id);
        expect(result.data.nested.metadata.description).toBe(
          'A nested reference test',
        );
        expect(result.references[0]).toMatchObject({
          type: entityType,
          path: ['nested', 'ref'],
          onDelete: 'SET_NULL',
        });
      });

      it('should handle array of references', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            refs: z.array(
              ctx.withRef(z.string(), {
                type: entityType,
                onDelete: 'RESTRICT',
              }),
            ),
          }),
        );

        const input = {
          entities: [
            { id: entityType.generateNewId(), name: 'Entity One' },
            { id: entityType.generateNewId(), name: 'Entity Two' },
          ],
          refs: ['Entity One', 'Entity Two'],
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.refs[0]).toEqual(result.data.entities[0].id);
        expect(result.data.refs[1]).toEqual(result.data.entities[1].id);
        expect(result.references).toHaveLength(2);
        expect(result.references[0].path).toEqual(['refs', 0]);
        expect(result.references[1].path).toEqual(['refs', 1]);
      });

      it('should handle optional references (null and undefined)', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            nullRef: ctx.withRef(z.string().nullable(), {
              type: entityType,
              onDelete: 'SET_NULL',
            }),
            undefinedRef: ctx.withRef(z.string().optional(), {
              type: entityType,
              onDelete: 'SET_NULL',
            }),
          }),
        );

        const input = {
          entities: [{ id: entityType.generateNewId(), name: 'Entity One' }],
          nullRef: null,
          undefinedRef: undefined,
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.nullRef).toBeNull();
        expect(result.data.undefinedRef).toBeUndefined();
        expect(result.entities).toHaveLength(1);
        expect(result.references).toHaveLength(0); // No references since values are null/undefined
      });
    });

    describe('Parent-Child Relationships', () => {
      it('should resolve nested and parent references with context paths', () => {
        const modelType = createEntityType('model');
        const fieldType = createEntityType('field', { parentType: modelType });

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            model: ctx.withEnt(
              z.object({
                name: z.string(),
                field: ctx.withEnt(z.object({ name: z.string() }), {
                  type: fieldType,
                  parentPath: { context: 'model' },
                }),
              }),
              { type: modelType, addContext: 'model' },
            ),
            foreignRelation: ctx.withRefBuilder(
              z.object({
                modelRef: z.string(),
                fieldRef: ctx.withRef(z.string(), {
                  type: fieldType,
                  onDelete: 'RESTRICT',
                  parentPath: { context: 'model' },
                }),
              }),
              (builder) => {
                builder.addReference({
                  path: 'modelRef',
                  type: modelType,
                  onDelete: 'RESTRICT',
                  addContext: 'model',
                });
              },
            ),
          }),
        );

        const input = {
          model: {
            id: modelType.generateNewId(),
            name: 'Model One',
            field: { id: fieldType.generateNewId(), name: 'Field One' },
          },
          foreignRelation: {
            modelRef: 'Model One',
            fieldRef: 'Field One',
          },
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.foreignRelation.modelRef).toEqual(
          result.data.model.id,
        );
        expect(result.data.foreignRelation.fieldRef).toEqual(
          result.data.model.field.id,
        );

        const modelEntity = result.entities.find(
          (e) => e.id === result.data.model.id,
        );
        expect(modelEntity).toBeDefined();

        const fieldEntity = result.entities.find(
          (e) => e.id === result.data.model.field.id,
        );
        expect(fieldEntity).toBeDefined();
        expect(fieldEntity?.parentPath).toEqual(['model', 'id']);
      });

      it('should handle complex parent-child hierarchies', () => {
        const modelType = createEntityType('model');
        const fieldType = createEntityType('field', { parentType: modelType });

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            models: z.array(
              ctx.withEnt(
                z.object({
                  name: z.string(),
                  fields: z.array(
                    ctx.withEnt(z.object({ name: z.string() }), {
                      type: fieldType,
                      parentPath: { context: 'model' },
                    }),
                  ),
                  relations: z.array(
                    z.object({
                      modelName: ctx.withRef(z.string(), {
                        type: modelType,
                        onDelete: 'RESTRICT',
                        addContext: 'foreignModel',
                      }),
                      fields: z.array(
                        ctx.withRef(z.string(), {
                          type: fieldType,
                          onDelete: 'RESTRICT',
                          parentPath: { context: 'foreignModel' },
                        }),
                      ),
                    }),
                  ),
                }),
                { type: modelType, addContext: 'model' },
              ),
            ),
          }),
        );

        const input = {
          models: [
            {
              id: modelType.generateNewId(),
              name: 'User',
              fields: [
                { id: fieldType.generateNewId(), name: 'id' },
                { id: fieldType.generateNewId(), name: 'name' },
              ],
              relations: [
                {
                  modelName: 'Post',
                  fields: ['id'],
                },
              ],
            },
            {
              id: modelType.generateNewId(),
              name: 'Post',
              fields: [{ id: fieldType.generateNewId(), name: 'id' }],
              relations: [],
            },
          ],
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        const userModel = result.data.models[0];
        const postModel = result.data.models[1];

        expect(userModel.relations[0].modelName).toEqual(postModel.id);
        expect(userModel.relations[0].fields[0]).toEqual(
          postModel.fields[0].id,
        );

        expect(result.entities).toHaveLength(5); // 2 models + 3 fields
        expect(result.references).toHaveLength(2); // 1 model ref + 1 field ref
      });
    });

    describe('Custom Name Resolvers', () => {
      it('should support custom name resolvers for entities', () => {
        const entityType = createEntityType('person');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            person: ctx.withEnt(
              z.object({
                firstName: z.string(),
                lastName: z.string(),
              }),
              {
                type: entityType,
                getNameResolver: (value) => ({
                  resolveName: () => `${value.firstName} ${value.lastName}`,
                }),
              },
            ),
            ref: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'RESTRICT',
            }),
          }),
        );

        const input = {
          person: {
            id: entityType.generateNewId(),
            firstName: 'John',
            lastName: 'Doe',
          },
          ref: 'John Doe',
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.ref).toEqual(result.data.person.id);
        expect(result.entities).toHaveLength(1);
        expect(result.references).toHaveLength(1);
        // Custom name resolver logic is handled internally
        const personEntity = result.entities[0];
        expect(personEntity).toBeDefined();
        expect(personEntity.type.name).toBe('person');
      });

      it('should support basic name resolution with multiple entities', () => {
        const personType = createEntityType('person');
        const companyType = createEntityType('company');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            companies: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: companyType,
              }),
            ),
            people: z.array(
              ctx.withEnt(z.object({ name: z.string() }), { type: personType }),
            ),
            personRef: ctx.withRef(z.string(), {
              type: personType,
              onDelete: 'RESTRICT',
            }),
          }),
        );

        const input = {
          companies: [{ id: companyType.generateNewId(), name: 'Acme Corp' }],
          people: [{ id: personType.generateNewId(), name: 'Alice' }],
          personRef: 'Alice',
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.personRef).toEqual(result.data.people[0].id);
        expect(result.entities).toHaveLength(2); // 1 company + 1 person
        expect(result.references).toHaveLength(1); // 1 person reference
      });

      it('should work with createDefinitionEntityNameResolver during parsing', () => {
        const personType = createEntityType('person');
        const companyType = createEntityType('company');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            company: ctx.withEnt(z.object({ name: z.string() }), {
              type: companyType,
            }),
            person: ctx.withEnt(
              z.object({
                name: z.string(),
                companyId: z.string(),
              }),
              {
                type: personType,
                getNameResolver: (value) =>
                  createDefinitionEntityNameResolver({
                    idsToResolve: {
                      company: value.companyId,
                    },
                    resolveName: (entityNames) =>
                      `${value.name} at ${entityNames.company}`,
                  }),
              },
            ),
          }),
        );

        const companyId = companyType.generateNewId();
        const personId = personType.generateNewId();

        const input = {
          company: { id: companyId, name: 'Acme Corp' },
          person: {
            id: personId,
            name: 'Alice',
            companyId,
          },
        };

        // Use parseSchemaWithTransformedReferences to test the raw parsing
        // without the reference resolution step
        const result = parseSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
          { skipReferenceNameResolution: true },
        );

        expect(result.entities).toHaveLength(2); // company + person

        // Verify the person entity uses the complex name resolver
        const personEntity = result.entities.find(
          (e) => e.type.name === 'person',
        );
        expect(personEntity).toBeDefined();
        // The name should be resolved using createDefinitionEntityNameResolver
        // which creates "Alice at {company name}" format
        expect(personEntity?.name).toMatch(/^Alice at company:/);

        const companyEntity = result.entities.find(
          (e) => e.type.name === 'company',
        );
        expect(companyEntity).toBeDefined();
        expect(companyEntity?.name).toBe('Acme Corp');
      });
    });

    describe('RefBuilder Scenarios', () => {
      it('should handle withRefBuilder for complex scenarios', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            complexRef: ctx.withRefBuilder(
              z.object({
                targetName: z.string(),
                metadata: z.object({
                  description: z.string(),
                }),
              }),
              (builder, _data) => {
                builder.addReference({
                  path: 'targetName',
                  type: entityType,
                  onDelete: 'DELETE',
                });
              },
            ),
          }),
        );

        const input = {
          entities: [{ id: entityType.generateNewId(), name: 'target-entity' }],
          complexRef: {
            targetName: 'target-entity',
            metadata: {
              description: 'This is a complex reference',
            },
          },
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.complexRef.targetName).toEqual(
          result.data.entities[0].id,
        );
        expect(result.data.complexRef.metadata.description).toEqual(
          'This is a complex reference',
        );
        expect(result.references).toHaveLength(1);
        expect(result.references[0]).toMatchObject({
          type: entityType,
          path: ['complexRef', 'targetName'],
          onDelete: 'DELETE',
        });
      });

      it('should handle multiple references to same entity type', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), { type: entityType }),
            ),
            // Multiple references to same entity type
            ref1: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'RESTRICT',
            }),
            ref2: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'SET_NULL',
            }),
          }),
        );

        const input = {
          entities: [
            { id: entityType.generateNewId(), name: 'Entity One' },
            { id: entityType.generateNewId(), name: 'Entity Two' },
          ],
          ref1: 'Entity One',
          ref2: 'Entity Two',
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.ref1).toEqual(result.data.entities[0].id);
        expect(result.data.ref2).toEqual(result.data.entities[1].id);

        expect(result.entities).toHaveLength(2);
        expect(result.references).toHaveLength(2);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for non-existent reference target', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ name: z.string() }), {
                type: entityType,
              }),
            ),
            ref: ctx.withRef(z.string(), {
              type: entityType,
              onDelete: 'RESTRICT',
            }),
          }),
        );

        const input = {
          entities: [
            { id: entityType.generateNewId(), name: 'Existing Entity' },
          ],
          ref: 'Non-Existent Entity',
        };

        expect(() =>
          deserializeSchemaWithTransformedReferences(schemaCreator, input, {
            plugins: pluginStore,
          }),
        ).toThrow('Unable to resolve reference');
      });
    });
  });

  describe('Core Logic Tests (extractDefinitionRefsRecursive)', () => {
    describe('Edge Cases', () => {
      it('should handle missing context paths gracefully', () => {
        const modelType = new DefinitionEntityType('model', 'model');
        const fieldType = new DefinitionEntityType('field', 'field', modelType);

        const context: ZodRefContext = {
          context: {
            pathMap: new Map([
              ['model', { path: ['models', 0], type: modelType }],
            ]),
          },
          references: [],
          entitiesWithNameResolver: [],
        };

        const referenceWithMissingContext = new DefinitionReferenceMarker(
          'field:missing-context-field',
          {
            type: fieldType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'nonExistentContext' },
          },
        );

        expect(() =>
          extractDefinitionRefsRecursive(referenceWithMissingContext, context, [
            'field',
            'ref',
          ]),
        ).toThrow(
          'Could not find context for nonExistentContext from field.ref',
        );
      });

      it('should return primitive values unchanged', () => {
        const context: ZodRefContext = {
          context: { pathMap: new Map() },
          references: [],
          entitiesWithNameResolver: [],
        };

        expect(extractDefinitionRefsRecursive('string', context, [])).toBe(
          'string',
        );
        expect(extractDefinitionRefsRecursive(42, context, [])).toBe(42);
        expect(extractDefinitionRefsRecursive(true, context, [])).toBe(true);
        expect(extractDefinitionRefsRecursive(null, context, [])).toBe(null);
        expect(extractDefinitionRefsRecursive(undefined, context, [])).toBe(
          undefined,
        );
      });

      it('should handle empty objects and arrays', () => {
        const context: ZodRefContext = {
          context: { pathMap: new Map() },
          references: [],
          entitiesWithNameResolver: [],
        };

        expect(extractDefinitionRefsRecursive({}, context, [])).toEqual({});
        expect(extractDefinitionRefsRecursive([], context, [])).toEqual([]);
      });
    });

    describe('Marker Processing', () => {
      const testEntityType = new DefinitionEntityType('test', 'test');
      const testRefEntityType = new DefinitionEntityType('testref', 'testref');

      it('should extract reference markers and return clean values', () => {
        const context: ZodRefContext = {
          context: { pathMap: new Map() },
          references: [],
          entitiesWithNameResolver: [],
        };

        const referenceMarker = new DefinitionReferenceMarker(
          'testref:test-id',
          {
            type: testRefEntityType,
            onDelete: 'RESTRICT',
          },
        );

        const result = extractDefinitionRefsRecursive(
          referenceMarker,
          context,
          ['field'],
        );

        expect(result).toBe('testref:test-id');
        expect(context.references).toHaveLength(1);
        expect(context.references[0]).toEqual({
          type: testRefEntityType,
          path: ['field'],
          onDelete: 'RESTRICT',
          parentPath: undefined,
        });
      });

      it('should extract entity annotations and return clean objects', () => {
        const context: ZodRefContext = {
          context: { pathMap: new Map() },
          references: [],
          entitiesWithNameResolver: [],
        };

        const inputWithAnnotations = {
          id: 'test:test-id',
          name: 'Test Entity',
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities: [
              {
                type: testEntityType,
                getNameResolver: () => ({ resolveName: () => 'Test Entity' }),
              },
            ],
            references: [],
            contextPaths: [],
          },
        };

        const result = extractDefinitionRefsRecursive(
          inputWithAnnotations,
          context,
          ['entity'],
        );

        expect(result).toEqual({
          id: 'test:test-id',
          name: 'Test Entity',
        });
        expect(context.entitiesWithNameResolver).toHaveLength(1);
        expect(context.entitiesWithNameResolver[0]).toMatchObject({
          id: 'test:test-id',
          type: testEntityType,
          path: ['entity'],
          idPath: ['entity', 'id'],
        });
      });
    });
  });
});
