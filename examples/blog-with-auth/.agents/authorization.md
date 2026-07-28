# Authorization

Authorization is declared in the project definition and compiled into a policy
per model. Nothing is hand-written in the generated policy files.

Each model has an **authorizer** with named **roles**. A role is a predicate over
a row ("is this principal the owner of this blog?"). Actions (`read`, `create`,
`update`, `delete`) then grant access to a set of roles:

- `roles` — instance roles, evaluated per row
- `globalRoles` — principal-level roles (e.g. `admin`, `public`), row-independent

A role compiles to both a boolean check (against a loaded row) and a Prisma
`where` filter (to fan out over a list), derived from the same declaration — so
"can I see this one?" and "which ones can I see?" can never disagree.

## Authorization Expressions

Each role's `expression` is a **JS-like boolean DSL** — it looks like TypeScript
but only the following constructs are valid.

| Construct                                    | Meaning                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `model.<field> === userId`                   | Compare a field on the row to the principal (`!==` also OK) |
| `model.<field> === 'literal'`                | Compare a field to a string/number/boolean literal          |
| `isAuthenticated`                            | Any signed-in principal                                     |
| `hasRole('admin')`                           | Principal holds a global role                               |
| `hasSomeRole(['admin', 'editor'])`           | Principal holds any of several global roles                 |
| `hasRole(model.<relation>, 'role')`          | **Delegate** to a role on a related model                   |
| `hasSomeRole(model.<relation>, ['a', 'b'])`  | Delegate, matching any of several roles                     |
| `exists(model.<relation>, { field: value })` | Some related record matches the conditions                  |
| `all(model.<relation>, { field: value })`    | Every related record matches the conditions                 |
| `&&`, `\|\|`                                 | Combine any of the above                                    |

Available context: `model.<field>` (the row), `userId` and `isAuthenticated`
(the principal). `userId` is the only auth property.

**Delegation (`hasRole` with a relation)** is the main tool for reuse — instead
of restating a parent's rule on the child, point at it:

```js
// BlogPost.owner — delegate to the Blog's own `owner` role (belongs-to)
hasRole(model.blog, 'owner');

// Blog.member — "some related BlogUser grants `owner`" (has-many)
hasRole(model.members, 'owner');
```

Both relation directions work. A belongs-to relation delegates to the single
related record; a has-many relation is **existential** — at least one related
record must grant the role. A row with no related records is never granted the
role, even if the delegated role is otherwise unrestricted.

`exists`/`all` are the direct-predicate alternative when there is no role to
reuse — they match on _fields_ of the related records, and require a has-many
relation:

```js
// "I'm a member of this blog", stated inline rather than delegated
exists(model.members, { userId: userId });
```

Prefer `hasRole(model.<relation>, ...)` when the related model already defines
the role — it stays correct when that role's definition changes.

## Editing authorization

Roles live under a model's `authorizer.roles`; grants live on `graphql.queries`
(read) and `service.{create,update,delete}`. Use `stage-patch-entity` on the
`model` entity, then `show-draft` and `commit-draft`. The expression is
validated on save — an unknown field, relation, or role surfaces as a warning
rather than failing silently.

See [baseplate.md](baseplate.md) for the general MCP workflow.
