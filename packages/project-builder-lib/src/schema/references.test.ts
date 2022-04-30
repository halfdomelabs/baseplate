import {
  fixReferenceRenames,
  ReferencesBuilder,
  GetReferencesResult,
} from './references';

describe('fixReferenceRenames', () => {
  it('renames references', () => {
    const oldObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test2' },
        ],
        goodFields: [],
      },
    };
    const newObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test3' },
        ],
        goodFields: ['test', 'test2'],
      },
    };

    const getReferences = (config: typeof newObject): GetReferencesResult => {
      const builder = new ReferencesBuilder<typeof newObject>(config);
      config.model.fields.forEach((field) =>
        builder.addReferenceable({
          category: 'modelField',
          id: field.id,
          name: field.name,
        })
      );
      builder.addReferences('model.goodFields.*', { category: 'modelField' });
      return builder.build();
    };

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      getReferences
    );

    expect(updatedObject.model.goodFields).toEqual(['test', 'test3']);
  });

  it('renames nested references', () => {
    const oldObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test2' },
        ],
        goodFields: [],
      },
    };
    const newObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test3' },
        ],
        goodFields: [{ name: 'test' }, { name: 'test2' }],
      },
    };

    const getReferences = (config: typeof newObject): GetReferencesResult => {
      const builder = new ReferencesBuilder<typeof newObject>(config);
      config.model.fields.forEach((field) =>
        builder.addReferenceable({
          category: 'modelField',
          id: field.id,
          name: field.name,
        })
      );
      builder.addReferences('model.goodFields.*.name', {
        category: 'modelField',
      });
      return builder.build();
    };

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      getReferences
    );

    expect(updatedObject.model.goodFields).toEqual([
      { name: 'test' },
      { name: 'test3' },
    ]);
  });

  it('renames references to references', () => {
    const oldObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test2' },
        ],
        fieldRef: [{ id: 'id2', name: 'test' }],
        fieldRefRef: [{ name: 'test' }],
      },
    };
    const newObject = {
      model: {
        fields: [
          { id: 'id1', name: 'test3' },
          { id: 'id2', name: 'test2' },
        ],
        fieldRef: [{ id: 'id2', name: 'test' }],
        fieldRefRef: [{ name: 'test' }],
      },
    };

    const getReferences = (config: typeof newObject): GetReferencesResult => {
      const builder = new ReferencesBuilder<typeof newObject>(config);
      config.model.fields.forEach((field) =>
        builder.addReferenceable({
          category: 'modelField',
          id: field.id,
          name: field.name,
        })
      );
      config.model.fieldRef.forEach((fieldRef, i) => {
        builder
          .withPrefix(`model.fieldRef.${i}`)
          .addReferenceable({
            category: 'modelForeignRelation',
            id: fieldRef.id,
            name: fieldRef.name,
          })
          .addReference('name', {
            category: 'modelField',
            name: fieldRef.name,
          });
      });
      builder
        .withPrefix('model')
        .withPrefix('fieldRefRef')
        .addReferences('*.name', {
          category: 'modelForeignRelation',
        });
      return builder.build();
    };

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      getReferences
    );

    expect(updatedObject.model.fieldRef).toEqual([
      { id: 'id2', name: 'test3' },
    ]);
    expect(updatedObject.model.fieldRefRef).toEqual([{ name: 'test3' }]);
  });
});
