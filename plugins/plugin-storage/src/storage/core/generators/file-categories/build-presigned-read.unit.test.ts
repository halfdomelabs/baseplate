import type {
  PrismaModelPolicyProvider,
  PrismaOutputProvider,
} from '@baseplate-dev/fastify-generators';

import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { describe, expect, it } from 'vitest';

import type {
  PresignedReadBuilderContext,
  ReferencedBy,
} from './build-presigned-read.js';

import {
  buildAuthorizeFragment,
  buildPresignedReadFragment,
  buildReferenceReadFragment,
} from './build-presigned-read.js';

const POLICIED_MODELS = new Set(['TodoList', 'UserProfile']);

function createModelPolicy(modelName: string): PrismaModelPolicyProvider {
  const policyName = `${modelName.toLowerCase()}Policy`;
  return {
    getActionWhereFragment: (action) =>
      tsCodeFragment(`${policyName}.actions.${action}.where`),
    getRoleCheckFragment: (roleName) =>
      tsCodeFragment(`${policyName}.roles.${roleName}.check`),
  } as PrismaModelPolicyProvider;
}

function createContext(
  overrides: Partial<PresignedReadBuilderContext> = {},
): PresignedReadBuilderContext {
  return {
    prismaOutput: {
      getPrismaModel: (name: string) => ({
        name,
        fields: [],
        idFields: ['id'],
      }),
      getPrismaModelFragment: (name: string) =>
        tsCodeFragment(`prisma.${name.toLowerCase()}`),
    } as unknown as PrismaOutputProvider,
    getModelPolicy: (modelName) =>
      POLICIED_MODELS.has(modelName) ? createModelPolicy(modelName) : undefined,
    forbiddenErrorFragment: () => tsCodeFragment('ForbiddenError'),
    ...overrides,
  };
}

function createRef(overrides: Partial<ReferencedBy> = {}): ReferencedBy {
  return {
    relationName: 'todoListCoverPhoto',
    modelName: 'TodoList',
    fieldName: 'coverPhoto',
    foreignKeyFieldName: 'coverPhotoId',
    fieldRoles: { globalRoles: [], instanceRoles: [] },
    ...overrides,
  };
}

describe('buildReferenceReadFragment', () => {
  it('returns undefined when the model has no policy', () => {
    const ref = createRef({ modelName: 'UserImage' });
    expect(buildReferenceReadFragment(ref, createContext())).toBeUndefined();
  });

  it('returns undefined when the relation is not exposed in GraphQL', () => {
    // An unexposed relation has no field gate to mirror, so no rule is
    // derivable — it must NOT fall through to the ungated existence check.
    const ref = createRef({ fieldRoles: undefined });
    expect(buildReferenceReadFragment(ref, createContext())).toBeUndefined();
  });

  it('emits an existence check narrowed to id fields when ungated', () => {
    const fragment = buildReferenceReadFragment(createRef(), createContext());
    const contents = fragment?.contents ?? '';

    expect(contents).toContain('prisma.todolist.findFirst');
    expect(contents).toContain('todolistPolicy.actions.read.where(context,');
    expect(contents).toContain('coverPhotoId: file.id');
    expect(contents).toContain('select:');
    expect(contents).toContain('!== null');
  });

  it('uses the relation FK name rather than deriving it from the field name', () => {
    const ref = createRef({ fieldName: 'file', foreignKeyFieldName: 'fileId' });
    const contents =
      buildReferenceReadFragment(ref, createContext())?.contents ?? '';

    expect(contents).toContain('fileId: file.id');
    expect(contents).not.toContain('fileIdId');
  });

  it('loads the whole row and ORs the field gate when gated', () => {
    const ref = createRef({
      modelName: 'UserProfile',
      fieldName: 'avatar',
      foreignKeyFieldName: 'avatarId',
      fieldRoles: { globalRoles: ['admin'], instanceRoles: ['owner'] },
    });
    const contents =
      buildReferenceReadFragment(ref, createContext())?.contents ?? '';

    // A gate's instance checks receive the row, so it must not be narrowed.
    expect(contents).not.toContain('select:');
    expect(contents).toContain("context.auth.hasSomeRole(['admin'])");
    expect(contents).toContain(
      'userprofilePolicy.roles.owner.check(context, row)',
    );
    expect(contents).toContain(' || ');
    expect(contents).toContain('if (!row) return false;');
  });
});

describe('buildPresignedReadFragment', () => {
  it('returns undefined when no reference yields a rule', () => {
    const refs = [
      createRef({ modelName: 'UserImage' }),
      createRef({ fieldRoles: undefined }),
    ];
    expect(buildPresignedReadFragment(refs, createContext())).toBeUndefined();
  });

  it('emits a bare rule without a ForbiddenError guard for a single reference', () => {
    const contents =
      buildPresignedReadFragment([createRef()], createContext())?.contents ??
      '';

    expect(contents).toContain('async (file, context) =>');
    expect(contents).not.toContain('ForbiddenError');
  });

  it('guards each reference against ForbiddenError when several exist', () => {
    // A model granting nothing throws from `.where`; that must not sink the
    // whole check when another model may still grant access.
    const refs = [
      createRef(),
      createRef({
        modelName: 'UserProfile',
        fieldName: 'avatar',
        foreignKeyFieldName: 'avatarId',
      }),
    ];
    const contents =
      buildPresignedReadFragment(refs, createContext())?.contents ?? '';

    expect(contents.match(/instanceof ForbiddenError/g)).toHaveLength(2);
    expect(contents).toContain('return false;');
    expect(contents).toContain('throw error;');
    expect(contents).toContain(' || ');
  });

  it('skips non-derivable references but keeps the derivable ones', () => {
    const refs = [
      createRef({ modelName: 'UserImage' }),
      createRef({
        modelName: 'UserProfile',
        fieldName: 'avatar',
        foreignKeyFieldName: 'avatarId',
      }),
    ];
    const contents =
      buildPresignedReadFragment(refs, createContext())?.contents ?? '';

    // Only one rule survives → single-reference form, no guard.
    expect(contents).toContain('avatarId: file.id');
    expect(contents).not.toContain('ForbiddenError');
  });
});

describe('buildAuthorizeFragment', () => {
  it('returns undefined when neither upload nor read is derivable', () => {
    const category = {
      authorize: { uploadRoles: [] },
      referencedBy: [createRef({ modelName: 'UserImage' })],
    };
    expect(buildAuthorizeFragment(category, createContext())).toBeUndefined();
  });

  it('omits presignedRead but keeps upload when no read rule is derivable', () => {
    const category = {
      authorize: { uploadRoles: ['user'] },
      referencedBy: [createRef({ modelName: 'UserImage' })],
    };
    const contents =
      buildAuthorizeFragment(category, createContext())?.contents ?? '';

    expect(contents).toContain('upload:');
    expect(contents).not.toContain('presignedRead');
  });

  it('includes both members when each is derivable', () => {
    const category = {
      authorize: { uploadRoles: ['user'] },
      referencedBy: [createRef()],
    };
    const contents =
      buildAuthorizeFragment(category, createContext())?.contents ?? '';

    expect(contents).toContain('upload:');
    expect(contents).toContain('presignedRead:');
  });
});
