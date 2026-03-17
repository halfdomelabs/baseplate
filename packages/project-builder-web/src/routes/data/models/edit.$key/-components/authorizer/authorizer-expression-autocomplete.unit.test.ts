import { javascript } from '@codemirror/lang-javascript';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import type { ExpressionCompletionContext } from './authorizer-expression-autocomplete.js';

import { resolveExpressionCompletionContext } from './authorizer-expression-autocomplete.js';

/**
 * Create an EditorState with JavaScript language support and ensure the
 * syntax tree is fully parsed before returning.
 */
function createState(code: string): EditorState {
  const state = EditorState.create({
    doc: code,
    extensions: [javascript()],
  });
  // Force synchronous parse so the syntax tree is available
  ensureSyntaxTree(state, code.length, 5000);
  return state;
}

/**
 * Resolve the expression completion context for the given code at the cursor position.
 * The cursor position is indicated by `|` in the code string.
 */
function resolve(codeWithCursor: string): ExpressionCompletionContext {
  const pos = codeWithCursor.indexOf('|');
  if (pos === -1) {
    throw new Error('Test code must contain | to indicate cursor position');
  }
  const code = codeWithCursor.slice(0, pos) + codeWithCursor.slice(pos + 1);
  const state = createState(code);
  return resolveExpressionCompletionContext(state, pos);
}

describe('resolveExpressionCompletionContext', () => {
  describe('topLevel', () => {
    it('should detect top-level identifier', () => {
      expect(resolve('h|')).toEqual({ type: 'topLevel' });
    });

    it('should detect top-level for multi-char identifier', () => {
      expect(resolve('has|')).toEqual({ type: 'topLevel' });
    });

    it('should detect top-level for isAuthenticated', () => {
      expect(resolve('isA|')).toEqual({ type: 'topLevel' });
    });
  });

  describe('modelField', () => {
    it('should detect model. with no prefix', () => {
      expect(resolve('model.|')).toEqual({ type: 'modelField' });
    });

    it('should detect model. with partial prefix', () => {
      expect(resolve('model.i|')).toEqual({ type: 'modelField' });
    });

    it('should detect model. in comparison context', () => {
      expect(resolve('model.id| === userId')).toEqual({
        type: 'modelField',
      });
    });
  });

  describe('modelRelation', () => {
    it('should detect model. inside hasRole(', () => {
      expect(resolve('hasRole(model.|')).toEqual({ type: 'modelRelation' });
    });

    it('should detect model. inside exists(', () => {
      expect(resolve('exists(model.|')).toEqual({ type: 'modelRelation' });
    });

    it('should detect model. inside all( with partial prefix', () => {
      expect(resolve('all(model.t|')).toEqual({ type: 'modelRelation' });
    });

    it('should detect model. inside hasSomeRole(', () => {
      expect(resolve('hasSomeRole(model.|')).toEqual({
        type: 'modelRelation',
      });
    });
  });

  describe('roleString', () => {
    it('should detect cursor inside hasRole string', () => {
      expect(resolve("hasRole('|')")).toEqual({
        type: 'roleString',
        nestedRelationName: null,
      });
    });

    it('should detect cursor inside hasRole string with partial text', () => {
      expect(resolve("hasRole('ad|')")).toEqual({
        type: 'roleString',
        nestedRelationName: null,
      });
    });

    it('should detect nested hasRole with relation name', () => {
      expect(resolve("hasRole(model.todoList, '|')")).toEqual({
        type: 'roleString',
        nestedRelationName: 'todoList',
      });
    });

    it('should detect nested hasSomeRole with relation name in array', () => {
      expect(resolve("hasSomeRole(model.todoList, ['|'])")).toEqual({
        type: 'roleString',
        nestedRelationName: 'todoList',
      });
    });
  });

  describe('conditionKey', () => {
    it('should detect key position after opening brace', () => {
      expect(resolve('exists(model.members, { |')).toEqual({
        type: 'conditionKey',
        relationName: 'members',
      });
    });

    it('should detect key position with partial text', () => {
      expect(resolve('exists(model.members, { u|')).toEqual({
        type: 'conditionKey',
        relationName: 'members',
      });
    });

    it('should detect key position after comma', () => {
      expect(resolve('exists(model.members, { userId: userId, |')).toEqual({
        type: 'conditionKey',
        relationName: 'members',
      });
    });

    it('should detect key position for all()', () => {
      expect(resolve('all(model.tasks, { |')).toEqual({
        type: 'conditionKey',
        relationName: 'tasks',
      });
    });
  });

  describe('conditionValue', () => {
    it('should detect value position after colon', () => {
      expect(resolve('exists(model.members, { userId: |')).toEqual({
        type: 'conditionValue',
        relationName: 'members',
      });
    });

    it('should detect value position with partial text', () => {
      expect(resolve('exists(model.members, { userId: u|')).toEqual({
        type: 'conditionValue',
        relationName: 'members',
      });
    });

    it('should detect value position for all()', () => {
      expect(resolve('all(model.tasks, { isCompleted: |')).toEqual({
        type: 'conditionValue',
        relationName: 'tasks',
      });
    });
  });

  describe('none', () => {
    it('should return none for empty document', () => {
      expect(resolve('|')).toEqual({ type: 'none' });
    });

    it('should return none for whitespace only', () => {
      expect(resolve(' |')).toEqual({ type: 'none' });
    });
  });
});
