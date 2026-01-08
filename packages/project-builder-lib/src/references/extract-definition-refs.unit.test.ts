import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginSpecStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { collectRefs } from './collect-refs.js';
import { createDefinitionEntityNameResolver } from './definition-ref-builder.js';
import { deserializeSchemaWithTransformedReferences } from './deserialize-schema.js';
import { extractDefinitionRefs } from './extract-definition-refs.js';
import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { parseSchemaWithTransformedReferences } from './parse-schema-with-references.js';
import { createRefContextSlot } from './ref-context-slot.js';
import { createEntityType, DefinitionEntityType } from './types.js';

describe('extract-definition-refs', () => {
  describe('Integration Tests (deserializeSchemaWithTransformedReferences)', () => {
    const pluginStore = new PluginSpecStore();

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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            ref: ctx.withRef({
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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            ref1: ctx.withRef({
              type: entityType,
              onDelete: 'DELETE',
            }),
            ref2: ctx.withRef({
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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            nested: z.object({
              ref: ctx.withRef({
                type: entityType,
                onDelete: 'SET_UNDEFINED',
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
          onDelete: 'SET_UNDEFINED',
        });
      });

      it('should handle array of references', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            refs: z.array(
              ctx.withRef({
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

      it('should handle optional references (undefined)', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            optionalRef: ctx
              .withRef({
                type: entityType,
                onDelete: 'SET_UNDEFINED',
              })
              .optional(),
          }),
        );

        const input = {
          entities: [{ id: entityType.generateNewId(), name: 'Entity One' }],
          optionalRef: undefined,
        };

        const result = deserializeSchemaWithTransformedReferences(
          schemaCreator,
          input,
          { plugins: pluginStore },
        );

        expect(result.data.optionalRef).toBeUndefined();
        expect(result.entities).toHaveLength(1);
        expect(result.references).toHaveLength(0); // No references since value is undefined
      });
    });

    describe('Parent-Child Relationships', () => {
      it('should resolve nested and parent references with context paths', () => {
        const modelType = createEntityType('model');
        const fieldType = createEntityType('field', { parentType: modelType });

        const schemaCreator = definitionSchema((ctx) =>
          ctx.refContext({ modelSlot: modelType }, ({ modelSlot }) =>
            z.object({
              model: ctx.withEnt(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  field: ctx.withEnt(
                    z.object({ id: z.string(), name: z.string() }),
                    {
                      type: fieldType,
                      parentSlot: modelSlot,
                    },
                  ),
                }),
                { type: modelType, provides: modelSlot },
              ),
              foreignRelation: ctx.refContext(
                { foreignModelSlot: modelType },
                ({ foreignModelSlot }) =>
                  z.object({
                    modelRef: ctx.withRef({
                      type: modelType,
                      onDelete: 'RESTRICT',
                      provides: foreignModelSlot,
                    }),
                    fieldRef: ctx.withRef({
                      type: fieldType,
                      onDelete: 'RESTRICT',
                      parentSlot: foreignModelSlot,
                    }),
                  }),
              ),
            }),
          ),
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
              ctx.refContext({ modelSlot: modelType }, ({ modelSlot }) =>
                ctx.withEnt(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    fields: z.array(
                      ctx.withEnt(
                        z.object({ id: z.string(), name: z.string() }),
                        {
                          type: fieldType,
                          parentSlot: modelSlot,
                        },
                      ),
                    ),
                    relations: z.array(
                      ctx.refContext(
                        { foreignModelSlot: modelType },
                        ({ foreignModelSlot }) =>
                          z.object({
                            modelName: ctx.withRef({
                              type: modelType,
                              onDelete: 'RESTRICT',
                              provides: foreignModelSlot,
                            }),
                            fields: z.array(
                              ctx.withRef({
                                type: fieldType,
                                onDelete: 'RESTRICT',
                                parentSlot: foreignModelSlot,
                              }),
                            ),
                          }),
                      ),
                    ),
                  }),
                  { type: modelType, provides: modelSlot },
                ),
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
                id: z.string(),
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
            ref: ctx.withRef({
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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: companyType,
              }),
            ),
            people: z.array(
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: personType,
              }),
            ),
            personRef: ctx.withRef({
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
            company: ctx.withEnt(
              z.object({ id: z.string(), name: z.string() }),
              {
                type: companyType,
              },
            ),
            person: ctx.withEnt(
              z.object({
                id: z.string(),
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
      it('should handle complex reference scenarios', () => {
        const entityType = createEntityType('entity');

        const schemaCreator = definitionSchema((ctx) =>
          z.object({
            entities: z.array(
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            complexRef: z.object({
              targetName: ctx.withRef({
                type: entityType,
                onDelete: 'DELETE',
              }),
              metadata: z.object({
                description: z.string(),
              }),
            }),
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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            // Multiple references to same entity type
            ref1: ctx.withRef({
              type: entityType,
              onDelete: 'RESTRICT',
            }),
            ref2: ctx.withRef({
              type: entityType,
              onDelete: 'SET_UNDEFINED',
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
              ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
                type: entityType,
              }),
            ),
            ref: ctx.withRef({
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

  describe('Core Logic Tests (collectRefs + resolveSlots)', () => {
    describe('Edge Cases', () => {
      it('should handle missing slots during extraction', () => {
        const modelType = new DefinitionEntityType('model', 'model');
        const fieldType = new DefinitionEntityType('field', 'field', modelType);
        const missingSlot = createRefContextSlot('missingSlot', modelType);

        const referenceWithMissingContext = new DefinitionReferenceMarker(
          'field:missing-context-field',
          {
            path: [],
            type: fieldType,
            onDelete: 'RESTRICT',
            parentSlot: missingSlot,
          },
        );

        // Extraction should fail because missingSlot is not registered
        expect(() =>
          extractDefinitionRefs({ ref: referenceWithMissingContext }),
        ).toThrow('Could not resolve parent path');
      });

      it('should collect nothing from primitive values', () => {
        expect(collectRefs('string')).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
        expect(collectRefs(42)).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
        expect(collectRefs(true)).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
        expect(collectRefs(null)).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
        expect(collectRefs(undefined)).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
      });

      it('should handle empty objects and arrays', () => {
        expect(collectRefs({})).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
        expect(collectRefs([])).toEqual({
          entities: [],
          references: [],
          slots: [],
        });
      });
    });

    describe('Marker Processing', () => {
      const testEntityType = new DefinitionEntityType('test', 'test');
      const testRefEntityType = new DefinitionEntityType('testref', 'testref');

      it('should collect reference markers', () => {
        const referenceMarker = new DefinitionReferenceMarker(
          'testref:test-id',
          {
            path: [],
            type: testRefEntityType,
            onDelete: 'RESTRICT',
          },
        );

        const collected = collectRefs({ field: referenceMarker });

        expect(collected.references).toHaveLength(1);
        expect(collected.references[0]).toEqual({
          path: ['field'],
          type: testRefEntityType,
          onDelete: 'RESTRICT',
        });
      });

      it('should collect entity annotations', () => {
        const inputWithAnnotations = {
          id: 'test:test-id',
          name: 'Test Entity',
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities: [
              {
                path: [],
                id: 'test:test-id',
                type: testEntityType,
                nameResolver: { resolveName: () => 'Test Entity' },
              },
            ],
            references: [],
            slots: [],
          },
        };

        const collected = collectRefs({ entity: inputWithAnnotations });

        expect(collected.entities).toHaveLength(1);
        expect(collected.entities[0]).toMatchObject({
          id: 'test:test-id',
          type: testEntityType,
          path: ['entity'],
        });
      });
    });

    describe('Duplicate ID Detection', () => {
      it('should throw error when duplicate entity IDs are found', () => {
        const testEntityType = new DefinitionEntityType('test', 'test');

        const inputWithDuplicateIds = {
          entity1: {
            id: 'test:duplicate-id',
            name: 'Entity One',
            [REF_ANNOTATIONS_MARKER_SYMBOL]: {
              entities: [
                {
                  path: [],
                  id: 'test:duplicate-id',
                  type: testEntityType,
                  nameResolver: { resolveName: () => 'Entity One' },
                },
              ],
              references: [],
              slots: [],
            },
          },
          entity2: {
            id: 'test:duplicate-id', // Same ID as entity1
            name: 'Entity Two',
            [REF_ANNOTATIONS_MARKER_SYMBOL]: {
              entities: [
                {
                  path: [],
                  id: 'test:duplicate-id',
                  type: testEntityType,
                  nameResolver: { resolveName: () => 'Entity Two' },
                },
              ],
              references: [],
              slots: [],
            },
          },
        };

        expect(() => extractDefinitionRefs(inputWithDuplicateIds)).toThrow(
          'Duplicate ID found: test:duplicate-id',
        );
      });
    });
  });

  describe('Non-Recursive Function Tests (extractDefinitionRefs)', () => {
    it('should process simple object with entity annotations', () => {
      const testEntityType = new DefinitionEntityType('test', 'test');

      const input = {
        id: 'test:test-id',
        name: 'Test Entity',
        [REF_ANNOTATIONS_MARKER_SYMBOL]: {
          entities: [
            {
              path: [],
              id: 'test:test-id',
              type: testEntityType,
              nameResolver: { resolveName: () => 'Test Entity' },
            },
          ],
          references: [],
          slots: [],
        },
      };

      const result = extractDefinitionRefs(input);

      expect(result.data).toEqual({
        id: 'test:test-id',
        name: 'Test Entity',
      });
      expect(result.entitiesWithNameResolver).toHaveLength(1);
      expect(result.entitiesWithNameResolver[0]).toMatchObject({
        id: 'test:test-id',
        type: testEntityType,
        path: [],
      });
      expect(result.references).toHaveLength(0);
    });

    it('should process object with both entities and references', () => {
      const testEntityType = new DefinitionEntityType('test', 'test');
      const refEntityType = new DefinitionEntityType('ref', 'ref');

      const input = {
        entity: {
          id: 'test:entity-id',
          name: 'Test Entity',
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities: [
              {
                path: [],
                id: 'test:entity-id',
                type: testEntityType,
                nameResolver: { resolveName: () => 'Test Entity' },
              },
            ],
            references: [],
            slots: [],
          },
        },
        ref: new DefinitionReferenceMarker('ref:ref-id', {
          path: [],
          type: refEntityType,
          onDelete: 'RESTRICT',
        }),
      };

      const result = extractDefinitionRefs(input);

      expect(result.data).toEqual({
        entity: {
          id: 'test:entity-id',
          name: 'Test Entity',
        },
        ref: 'ref:ref-id',
      });
      expect(result.entitiesWithNameResolver).toHaveLength(1);
      expect(result.references).toHaveLength(1);
      expect(result.references[0]).toMatchObject({
        type: refEntityType,
        path: ['ref'],
        onDelete: 'RESTRICT',
      });
    });
  });
});
