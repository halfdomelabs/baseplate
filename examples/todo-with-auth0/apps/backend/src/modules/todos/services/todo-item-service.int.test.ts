import { describe, expect, it } from 'vitest';

import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { createTodoItem, updateTodoItem } from './todo-item.data-service.js';

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
      where: { id: createdItem.id },
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

  it('should return nested attachments directly from createTodoItem when query is provided', async () => {
    await prisma.user.deleteMany({});

    const owner = await prisma.user.create({
      data: { email: 'test@example.com' },
    });
    const todoList = await prisma.todoList.create({
      data: { ownerId: owner.id, position: 1, name: 'Test List' },
    });

    // Call createTodoItem WITH a query that includes attachments
    const createdItem = await createTodoItem({
      data: {
        todoListId: todoList.id,
        position: 1,
        text: 'Test item',
        done: false,
        attachments: [
          {
            url: 'https://example.com',
            position: 1,
            tags: [{ tag: 'test-tag' }],
          },
        ],
      },
      query: { include: { attachments: { include: { tags: true } } } },
      context,
    });

    // The returned item should directly contain the attachments (no separate query needed)
    expect(createdItem.attachments).toHaveLength(1);
    expect(createdItem.attachments[0]).toMatchObject({
      url: 'https://example.com',
      position: 1,
      tags: [{ tag: 'test-tag' }],
    });
  });

  it('should return nested attachments directly from updateTodoItem when query is provided', async () => {
    await prisma.user.deleteMany({});

    const owner = await prisma.user.create({
      data: { email: 'test@example.com' },
    });
    const todoList = await prisma.todoList.create({
      data: { ownerId: owner.id, position: 1, name: 'Test List' },
    });
    const todoItem = await prisma.todoItem.create({
      data: {
        todoListId: todoList.id,
        position: 1,
        text: 'Initial item',
        done: false,
      },
    });

    // Call updateTodoItem WITH a query that includes attachments
    const updatedItem = await updateTodoItem({
      where: { id: todoItem.id },
      data: {
        text: 'Updated item',
        attachments: [
          {
            url: 'https://example.com',
            position: 1,
            tags: [{ tag: 'update-tag' }],
          },
        ],
      },
      query: { include: { attachments: { include: { tags: true } } } },
      context,
    });

    // The returned item should directly contain the attachments (no separate query needed)
    expect(updatedItem.attachments).toHaveLength(1);
    expect(updatedItem.attachments[0]).toMatchObject({
      url: 'https://example.com',
      position: 1,
      tags: [{ tag: 'update-tag' }],
    });
    expect(updatedItem.text).toBe('Updated item');
  });

  it('should not allow updating an attachment that belongs to a different todo item', async () => {
    await prisma.user.deleteMany({});

    const owner = await prisma.user.create({
      data: { email: 'test@example.com' },
    });
    const todoList = await prisma.todoList.create({
      data: { ownerId: owner.id, position: 1, name: 'Test List' },
    });

    // Create two separate todo items, each with their own attachment
    const itemA = await createTodoItem({
      data: {
        todoListId: todoList.id,
        position: 1,
        text: 'Item A',
        done: false,
        attachments: [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            url: 'https://example.com/a',
            position: 1,
            tags: [],
          },
        ],
      },
      context,
    });

    await createTodoItem({
      data: {
        todoListId: todoList.id,
        position: 2,
        text: 'Item B',
        done: false,
        attachments: [
          {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            url: 'https://example.com/b',
            position: 1,
            tags: [],
          },
        ],
      },
      context,
    });

    // Attempt to update Item A but reference Item B's attachment ID.
    // The parent-scoped upsert won't match, so it falls through to create,
    // which fails with a unique constraint violation on the existing ID.
    await expect(
      updateTodoItem({
        where: { id: itemA.id },
        data: {
          attachments: [
            {
              id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              url: 'https://example.com/hijacked',
              position: 1,
              tags: [],
            },
          ],
        },
        context,
      }),
    ).rejects.toThrow('Unique constraint failed');
  });
});
