---
'@baseplate-dev/core-generators': patch
---

Improve Docker Compose generation with security, resource management, and developer experience enhancements

## Version Upgrades

- Upgrade PostgreSQL from 16.2 to 17.5-alpine
- Upgrade Redis from 7.2.4 to 8.0-alpine
- For existing projects, follow the upgrade guide at https://docs.baseplate.dev/guides/upgrading-postgres/

## Security Improvements

- Use environment variables for all sensitive data (passwords, usernames)
- Add `security_opt: no-new-privileges:true` to prevent privilege escalation
- Fix Redis healthcheck to include authentication

## Networking

- Create custom bridge network for better isolation
- All services communicate over internal network

## Database Configuration

- Add PostgreSQL environment variables: `POSTGRES_DB`, `POSTGRES_INITDB_ARGS`
- Use default `postgres` user for simplicity in local development
- Add container names for easier management
- Improve volume configuration

## Redis Configuration

- Add Redis memory limits (256MB) and eviction policy (no-eviction for BullMQ)
- Configure maxmemory and maxmemory-policy

## Developer Experience

- Add logging configuration to prevent disk filling (10MB max, 3 files)
- Generate `.env.example` file with all available variables
- Improve health checks with start periods
- Better default values using project name
- Fix interface bug in redis.ts (PostgresConfig → RedisConfig)

## Breaking Changes

- PostgreSQL generator now requires additional config parameters (database, projectName)
- Redis generator now requires projectName parameter
- Generated Docker Compose files now use custom bridge network
