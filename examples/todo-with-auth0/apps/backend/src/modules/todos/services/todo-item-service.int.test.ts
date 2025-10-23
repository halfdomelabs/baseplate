import { describe, expect, it } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { createTodoItem, updateTodoItem } from './todo-item.crud.js';

const context = createTestServiceContext();

describe('create', () => {
  it('should create nested todo item', async () => {
    await prisma.user.deleteMany({});

    const owner = await prisma.user.create({
      data: {
        email: 'foo@example.com',
      },
    });
    const todoList = await prisma.todoList.create({
      data: {
        ownerId: owner.id,
        position: 1,
        name: 'My Todo List',
      },
    });

    const createdItem = await createTodoItem({
      data: {
        todoListId: todoList.id,
        position: 1,
        text: 'hihi',
        done: false,
        attachments: [
          {
            id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
            url: 'https://google.com',
            position: 1,
            tags: [{ tag: 'hello' }],
          },
        ],
      },
      context,
    });

    const itemCheck = await prisma.todoItem.findUnique({
      where: { id: createdItem.id },
      include: {
        attachments: {
          include: {
            tags: true,
          },
        },
      },
    });

    expect(itemCheck).toMatchObject({
      id: createdItem.id,
      attachments: [
        {
          id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
          url: 'https://google.com',
          position: 1,
          tags: [{ tag: 'hello' }],
        },
      ],
    });

    await updateTodoItem({
      id: createdItem.id,
      data: {
        todoListId: todoList.id,
        position: 1,
        text: 'hihi',
        done: false,
        attachments: [
          {
            id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
            url: 'https://google.com',
            position: 1,
            tags: [{ tag: 'hello' }, { tag: 'bye' }],
          },
          {
            url: 'https://google.com',
            position: 2,
            tags: [{ tag: 'test' }],
          },
        ],
      },
      context,
    });

    const updatedItemWithAttachments = await prisma.todoItem.findUnique({
      where: { id: createdItem.id },
      include: {
        attachments: {
          include: {
            tags: true,
          },
        },
      },
    });

    expect(updatedItemWithAttachments).toMatchObject({
      id: createdItem.id,
      attachments: [
        {
          id: '67362d38-abb6-4778-95bd-f6f398bc5c54',
          url: 'https://google.com',
          position: 1,
          tags: [{ tag: 'hello' }, { tag: 'bye' }],
        },
        {
          url: 'https://google.com',
          position: 2,
          tags: [{ tag: 'test' }],
        },
      ],
    });
  });
});
