---
'@baseplate-dev/core-generators': patch
---

Upgrade PostgreSQL from 17.5 to 18.3 and Redis from 8.0 to 8.6 in Docker Compose generators

## Breaking: Volume mount path changed

PostgreSQL 18 changed its default data directory from `/var/lib/postgresql/data` to `/var/lib/postgresql/<major>/docker` and placed a symlink at the old path. Mounting a volume directly to `/var/lib/postgresql/data` on Postgres 18+ will cause a container startup error:

```
error mounting "..." to rootfs at "/var/lib/postgresql/data": no such file or directory
```

To align with this change, the Docker Compose volume mount has been updated from `db-data:/var/lib/postgresql/data` to `db-data:/var/lib/postgresql`. This means **existing dev databases will not be found** after upgrading and you must re-create or migrate your database.

## Upgrading your dev database

After syncing, your `docker-compose.yml` will reference `postgres:18.3-alpine` with the new volume mount path. You have three options:

### Option 1: Auto-upgrade with pgautoupgrade (in-place upgrade)

Use the [`pgautoupgrade`](https://github.com/pgautoupgrade/docker-pgautoupgrade) Docker image to upgrade the data directory in-place:

1. Stop your containers:

   ```bash
   cd docker && docker compose down
   ```

2. Temporarily swap the image in `docker-compose.yml`:

   ```yaml
   image: pgautoupgrade/pgautoupgrade:18-alpine
   ```

3. Start the container and watch for the upgrade:

   ```bash
   docker compose up               # wait for "Upgrade to PostgreSQL 18.3 complete." message
   ```

4. Once complete, stop and revert the image:
   ```bash
   docker compose down
   ```
   Change the image back in `docker-compose.yml`:
   ```yaml
   image: postgres:18.3-alpine
   ```
   ```bash
   docker compose up
   ```

### Option 2: Fresh start (for dev databases with no important data)

Delete the old volume and start fresh:

```bash
cd docker
docker compose down -v           # removes containers AND volumes
docker compose up                # starts fresh with Postgres 18
cd ../apps/backend
pnpm db:migrate                  # re-apply all migrations
pnpm db:seed                     # re-seed if applicable
```

### Option 3: Dump and restore (preserves data)

If you need to keep your data but don't want to use pgautoupgrade:

```bash
cd docker

# 1. While still on the OLD docker-compose.yml, dump your data
docker compose exec db pg_dumpall -U postgres > backup.sql

# 2. Now sync your project to get the new docker-compose.yml
# ... run baseplate sync ...

# 3. Remove old volume and start with new config
docker compose down -v
docker compose up -d

# 4. Restore your data
docker compose exec -T db psql -U postgres < backup.sql
rm backup.sql
```
