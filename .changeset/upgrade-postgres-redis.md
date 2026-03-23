---
'@baseplate-dev/core-generators': patch
---

Upgrade PostgreSQL from 17.5 to 18.3 and Redis from 8.0 to 8.6 in Docker Compose generators

## Upgrading your dev database

After syncing, your `docker-compose.yml` will reference `postgres:18.3-alpine`. Since PostgreSQL major version upgrades require a data directory migration, you have three options:

### Option 1: Fresh start (easiest, for dev databases)

If your dev database has no important data, delete the volume and re-run migrations:

```bash
cd docker
docker compose down -v          # removes containers AND volumes
docker compose up -d             # starts fresh with Postgres 18
cd ../apps/backend
pnpm db:migrate                  # re-apply all migrations
pnpm db:seed                     # re-seed if applicable
```

### Option 2: Auto-upgrade with pgautoupgrade (preserves data)

Use the [`pgautoupgrade`](https://github.com/pgautoupgrade/docker-pgautoupgrade) Docker image to upgrade the data directory in-place:

1. Stop your containers:
   ```bash
   cd docker && docker compose down
   ```

2. Temporarily swap the image in `docker-compose.yml`:
   ```yaml
   # Change this:
   image: postgres:18.3-alpine
   # To this:
   image: pgautoupgrade/pgautoupgrade:18-alpine
   ```

3. Start the container and let it upgrade:
   ```bash
   docker compose up -d
   docker compose logs -f db     # watch for "upgrade complete" message
   ```

4. Once the upgrade finishes, stop and swap back to the official image:
   ```bash
   docker compose down
   # Revert docker-compose.yml back to: image: postgres:18.3-alpine
   docker compose up -d
   ```

### Option 3: Dump and restore (safest, preserves data)

```bash
cd docker

# Dump from the old container
docker compose exec db pg_dumpall -U postgres > backup.sql

# Remove old volume and start fresh
docker compose down -v
docker compose up -d

# Restore
docker compose exec -T db psql -U postgres < backup.sql

# Clean up
rm backup.sql
```
