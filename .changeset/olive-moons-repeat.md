---
'@baseplate-dev/fastify-generators': patch
---

Backend test databases are now namespaced per run, so concurrent test runs against the same Postgres instance no longer drop or reuse each other's databases, and databases left behind by a crashed run are reclaimed on a later startup only once nothing is connected to them. Test code importing `TEMPLATE_DATABASE_NAME`, `dropStaleTestDatabases` or `clearWorkerDatabaseRecords` from the generated helpers needs updating.
