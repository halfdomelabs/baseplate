import {
  findReferencableEntries,
  findReferenceEntries,
  fixReferenceRenames,
  ObjectReference,
  ObjectReferenceable,
} from './references';

describe('findReferenceableEntries', () => {
  it('should find nested arrayed references', () => {
    const object = {
      features: [
        { model: { fields: [{ name: 'test' }, { name: 'test2' }] } },
        { model: { fields: [{ name: 'test3' }, { name: 'test4' }] } },
      ],
    };
    const reference: ObjectReferenceable = {
      category: 'test',
      nameProperty: 'name',
      path: 'features.*.model.fields.*',
    };

    const references = findReferencableEntries(object, reference);

    expect(references).toEqual([
      {
        name: 'test',
        id: 'test',
        key: 'test',
        path: 'features.0.model.fields.0',
      },
      {
        name: 'test2',
        id: 'test2',
        key: 'test2',
        path: 'features.0.model.fields.1',
      },
      {
        name: 'test3',
        id: 'test3',
        key: 'test3',
        path: 'features.1.model.fields.0',
      },
      {
        name: 'test4',
        id: 'test4',
        key: 'test4',
        path: 'features.1.model.fields.1',
      },
    ]);
  });

  it('should work with IDs', () => {
    const object = {
      model: {
        fields: [
          { id: 'id1', name: 'test' },
          { id: 'id2', name: 'test2' },
        ],
      },
    };
    const reference: ObjectReferenceable = {
      category: 'test',
      nameProperty: 'name',
      idProperty: 'id',
      path: 'model.fields.*',
    };

    const references = findReferencableEntries(object, reference);

    expect(references).toEqual([
      { name: 'test', id: 'id1', key: 'test', path: 'model.fields.0' },
      { name: 'test2', id: 'id2', key: 'test2', path: 'model.fields.1' },
    ]);
  });

  it('should allow context', () => {
    const object = {
      models: [
        {
          name: 'model1',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
        {
          name: 'model2',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
      ],
    };
    const reference: ObjectReferenceable = {
      category: 'test',
      nameProperty: 'name',
      path: 'models.*.fields.*',
      mapToKey: (name, parents) => {
        const model = parents[2] as { name: string };
        return `${model.name}#${name}`;
      },
    };

    const references = findReferencableEntries(object, reference);

    expect(references).toEqual([
      {
        name: 'test1',
        id: 'test1',
        key: 'model1#test1',
        path: 'models.0.fields.0',
      },
      {
        name: 'test2',
        id: 'test2',
        key: 'model1#test2',
        path: 'models.0.fields.1',
      },
      {
        name: 'test1',
        id: 'test1',
        key: 'model2#test1',
        path: 'models.1.fields.0',
      },
      {
        name: 'test2',
        id: 'test2',
        key: 'model2#test2',
        path: 'models.1.fields.1',
      },
    ]);
  });
});

describe('findReferenceEntries', () => {
  it('should find nested arrayed references', () => {
    const object = {
      features: [
        { model: { embeddedRelations: ['test1', 'test2'] } },
        { model: { embeddedRelations: ['test3', 'test4'] } },
      ],
    };
    const reference: ObjectReference = {
      category: 'test',
      path: 'features.*.model.embeddedRelations.*',
    };

    const references = findReferenceEntries(object, reference);

    expect(references).toEqual([
      {
        name: 'test1',
        key: 'test1',
        path: 'features.0.model.embeddedRelations.0',
      },
      {
        name: 'test2',
        key: 'test2',
        path: 'features.0.model.embeddedRelations.1',
      },
      {
        name: 'test3',
        key: 'test3',
        path: 'features.1.model.embeddedRelations.0',
      },
      {
        name: 'test4',
        key: 'test4',
        path: 'features.1.model.embeddedRelations.1',
      },
    ]);
  });

  it('should work with mapToKey', () => {
    const object = {
      models: [
        {
          name: 'model1',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
        {
          name: 'model2',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
      ],
    };
    const reference: ObjectReference = {
      category: 'test',
      path: 'models.*.fields.*.name',
      mapToKey: (name, parents) => {
        const model = parents[2] as { name: string };
        return `${model.name}#${name}`;
      },
    };

    const references = findReferenceEntries(object, reference);

    expect(references).toEqual([
      { name: 'test1', key: 'model1#test1', path: 'models.0.fields.0.name' },
      { name: 'test2', key: 'model1#test2', path: 'models.0.fields.1.name' },
      { name: 'test1', key: 'model2#test1', path: 'models.1.fields.0.name' },
      { name: 'test2', key: 'model2#test2', path: 'models.1.fields.1.name' },
    ]);
  });

  it('should work with shouldInclude', () => {
    const object = {
      models: [
        {
          name: 'model1',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
        {
          name: 'model2',
          fields: [{ name: 'test1' }, { name: 'test2' }],
        },
      ],
    };
    const reference: ObjectReference = {
      category: 'test',
      path: 'models.*.fields.*.name',
      shouldInclude: (name, parents) => {
        const model = parents[2] as { name: string };
        return model.name === 'model1';
      },
      mapToKey: (name, parents) => {
        const model = parents[2] as { name: string };
        return `${model.name}#${name}`;
      },
    };

    const references = findReferenceEntries(object, reference);

    expect(references).toEqual([
      { name: 'test1', key: 'model1#test1', path: 'models.0.fields.0.name' },
      { name: 'test2', key: 'model1#test2', path: 'models.0.fields.1.name' },
    ]);
  });
});

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
    const referenceable: ObjectReferenceable = {
      category: 'test',
      nameProperty: 'name',
      idProperty: 'id',
      path: 'model.fields.*',
    };
    const reference: ObjectReference = {
      category: 'test',
      path: 'model.goodFields.*',
    };

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      [referenceable],
      [reference]
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
    const referenceable: ObjectReferenceable = {
      category: 'test',
      nameProperty: 'name',
      idProperty: 'id',
      path: 'model.fields.*',
    };
    const reference: ObjectReference = {
      category: 'test',
      path: 'model.goodFields.*.name',
    };

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      [referenceable],
      [reference]
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
    const referenceables: ObjectReferenceable[] = [
      {
        category: 'field',
        nameProperty: 'name',
        idProperty: 'id',
        path: 'model.fields.*',
      },
      {
        category: 'fieldRef',
        nameProperty: 'name',
        idProperty: 'id',
        path: 'model.fieldRef.*',
      },
    ];
    const references: ObjectReference[] = [
      {
        category: 'field',
        path: 'model.fieldRef.*.name',
      },
      {
        category: 'fieldRef',
        path: 'model.fieldRefRef.*.name',
      },
    ];

    const updatedObject = fixReferenceRenames(
      oldObject,
      newObject,
      referenceables,
      references
    );

    expect(updatedObject.model.fieldRef).toEqual([
      { id: 'id2', name: 'test3' },
    ]);
    expect(updatedObject.model.fieldRefRef).toEqual([{ name: 'test3' }]);
  });
});
