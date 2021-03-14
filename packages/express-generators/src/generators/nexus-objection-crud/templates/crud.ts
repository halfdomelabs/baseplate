import {
  createListQueryField,
  createMutationField,
} from '@/src/graphql/fieldHelpers';
import { idArg, nonNull, queryField } from 'nexus';

export const LIST_QUERY_VAR = createListQueryField(LIST_QUERY_NAME, {
  objectType: OBJECT_TYPE,
  resolve: async (root, args, context, info) => {
    const items = await MODEL_CLASS.query();

    return { nodes: items };
  },
});

export const QUERY_BY_ID_VAR = queryField(QUERY_BY_ID_NAME, {
  type: OBJECT_TYPE,
  args: {
    ID_FIELD_NAME: nonNull(idArg()),
  },
  resolve: async (root, args, context) => {
    const item = await MODEL_CLASS.query().findById(args.id);

    return item;
  },
});

export const INSERT_MUTATION_VAR = createMutationField(INSERT_MUTATION_NAME, {
  inputDefinition: (t) => {
    INSERT_FIELDS;
  },
  payloadDefinition: (t) => {
    t.field(MODEL_FIELD_NAME, { type: OBJECT_TYPE });
  },
  resolve: async (root, args, context) => {
    const { input } = args;
    const item = await MODEL_CLASS.query().insert(INSERT_VALUES);
    return {
      MODEL_FIELD_NAME: item,
    };
  },
});

export const UPDATE_MUTATION_VAR = createMutationField(UPDATE_MUTATION_NAME, {
  inputDefinition: (t) => {
    UPDATE_FIELDS;
  },
  payloadDefinition: (t) => {
    t.field(MODEL_FIELD_NAME, { type: OBJECT_TYPE });
  },
  resolve: async (root, args, context) => {
    const { input } = args;
    const item = await MODEL_CLASS.query().patchAndFetchById(
      input.ID_FIELD_NAME,
      UPDATE_VALUES
    );
    if (!item) {
      throw new Error('Item not found!');
    }
    return {
      MODEL_FIELD_NAME: item,
    };
  },
});

export const DELETE_MUTATION_VAR = createMutationField(DELETE_MUTATION_NAME, {
  inputDefinition: (t) => {
    DELETE_FIELDS;
  },
  payloadDefinition: (t) => {
    t.nonNull.boolean('success');
  },
  resolve: async (root, args, context) => {
    const { input } = args;

    const affected = await MODEL_CLASS.query().deleteById(input.ID_FIELD_NAME);

    if (affected === 0) {
      throw new Error('Item not found!');
    }

    return {
      success: true,
    };
  },
});
