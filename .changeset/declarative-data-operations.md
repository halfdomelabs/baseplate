---
'@baseplate-dev/fastify-generators': minor
---

Replace imperative CRUD service pattern with declarative, type-safe data operations architecture

## Overview

This change migrates from manually-written imperative CRUD functions to a declarative, type-safe data operations system featuring composable field definitions and automatic type inference. This represents a fundamental architectural improvement in how Baseplate generates data access code.

## Key Changes

### Architecture Shift

**Before**: Manual, imperative functions with explicit Prisma calls and complex data transformations

```typescript
// 250+ lines of manual data handling
export async function createUser({ data, query, context }) {
  const { roles, customer, userProfile, images, ...rest } = data;

  const customerOutput = await createOneToOneCreateData({ input: customer });
  const imagesOutput = await createOneToManyCreateData({
    /* complex config */
  });
  // ... more manual transformations

  return applyDataPipeOutput(
    [rolesOutput, customerOutput, userProfileOutput, imagesOutput],
    prisma.user.create({
      /* manually built data object */
    }),
  );
}
```

**After**: Declarative operations with composable field definitions

```typescript
// ~100 lines with clear separation of concerns
export const createUser = defineCreateOperation({
  model: 'user',
  fields: userInputFields,
  create: ({ tx, data, query }) =>
    tx.user.create({
      data,
      ...query,
    }),
});
```

### Composable Field Definitions

Field definitions are now centralized, reusable components:

```typescript
export const userInputFields = {
  name: scalarField(z.string().nullish()),
  email: scalarField(z.string()),
  customer: nestedOneToOneField({
    buildData: (data) => data,
    fields: { stripeCustomerId: scalarField(z.string()) },
    getWhereUnique: (parentModel) => ({ id: parentModel.id }),
    model: 'customer',
    parentModel,
    relationName: 'user',
  }),
  images: nestedOneToManyField({
    buildData: (data) => data,
    fields: pick(userImageInputFields, ['id', 'caption', 'file']),
    getWhereUnique: (input) => (input.id ? { id: input.id } : undefined),
    model: 'userImage',
    parentModel,
    relationName: 'user',
  }),
};
```

## Breaking Changes

- **File naming**: Services now use `*-data-service.ts` instead of `*-crud.ts`
- **Import paths**: New utilities from `@src/utils/data-operations/`
- **Service signatures**: Remain compatible - same inputs and outputs
