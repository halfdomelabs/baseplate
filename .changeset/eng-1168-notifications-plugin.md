---
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/project-builder-common': patch
'@baseplate-dev/fastify-generators': patch
---

Add a native notification engine plugin (`@baseplate-dev/plugin-notifications`). The GraphQL Yoga plugin generator now exposes `getPubSub` as an import provider so notification (and other) modules can consume the real-time pubsub instance; this is an additive change with no effect on generated output for projects that don't use it.
