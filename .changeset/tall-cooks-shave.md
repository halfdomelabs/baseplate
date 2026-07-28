---
'@baseplate-dev/fastify-generators': patch
---

Add `r.viaMany` to model authorizers for delegating a role across a to-many relation — a row holds the role if some related row grants it, emitted as `{ relation: { some: … } }` and checked with a single query. The relation is constrained at the type level to relations that actually point at the target policy's model, so a mismatched pairing is a compile error rather than a filter against the wrong model.
