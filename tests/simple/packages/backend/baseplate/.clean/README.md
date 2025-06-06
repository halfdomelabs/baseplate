# simple backend

This project was generated by Baseplate.

## Stack

- Node/Typescript (language)
- Postgres (SQL database)
- [Fastify](https://fastify.dev/) (HTTP server)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) (GraphQL plugin)
- [Pothos](https://pothos-graphql.dev/) (GraphQL schema builder)
- [Prisma](https://www.prisma.io/) (ORM)

## Developer Setup

In order to set up the backend, you must do the following steps:

1. **Prerequisites**: Ensure you have Docker and Node (ideally with [Mise](https://mise.sh), [Volta](https://volta.sh), or another version manager)
2. **Install dependencies**: `pnpm install`
3. **Spin up backend dependencies, e.g. database**: `cd packages/backend/docker && docker compose up`
4. **Run database migrations and seed database with test data**: Run `pnpm prisma migrate dev` in the backend directory (`packages/backend`)

## Running Server

1. **Run Docker**: `cd docker && docker compose up`
2. **Run Server**: `pnpm dev`
