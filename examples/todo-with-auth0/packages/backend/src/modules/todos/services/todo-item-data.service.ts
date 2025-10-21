import { pick } from 'es-toolkit';
import { z } from 'zod';

import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
  relationHelpers,
  scalarField,
} from '@src/utils/data-operations/index.js';

/**
 * Common field definitions for todo items
 * All fields are validated as scalars - relations are handled in transform step
 */
const commonFields = {
  todoListId: scalarField(z.string()),
  assigneeId: scalarField(z.string().nullish()),
  position: scalarField(z.number()),
  text: scalarField(z.string()),
  done: scalarField(z.boolean()),
};

/**
 * Create a new todo item
 * Demonstrates the new multi-stage pipeline with prepare and transform steps
 */
export const createTodoItem = defineCreateOperation({
  model: 'todoItem',
  fields: pick(commonFields, [
    'todoListId',
    'assigneeId',
    'position',
    'text',
    'done',
  ] as const),

  prepareComputedFields: () => ({
    createdAt: new Date(),
  }),

  /**
   * Build data step - convert scalar IDs to Prisma relation objects
   * Runs inside transaction
   */
  buildData: ({ todoListId, assigneeId, ...rest }) => ({
    todoList: relationHelpers.connectCreate({ id: todoListId }),
    assignee: relationHelpers.connectCreate({ id: assigneeId }),
    ...rest,
  }),
});

/**
 * Update an existing todo item
 * Demonstrates prepare step for updates
 */
export const updateTodoItem = defineUpdateOperation({
  model: 'todoItem',
  fields: pick(commonFields, [
    'assigneeId',
    'position',
    'text',
    'done',
  ] as const),

  /**
   * Build data step - convert scalar IDs to Prisma relation objects
   */
  buildData: ({ assigneeId, ...rest }) => ({
    assignee: relationHelpers.connectUpdate({ id: assigneeId }),
    ...rest,
  }),
});

/**
 * Delete a todo item
 */
export const deleteTodoItem = defineDeleteOperation({
  model: 'todoItem',
});
