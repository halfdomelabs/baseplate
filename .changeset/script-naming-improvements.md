---
'@baseplate-dev/fastify-generators': patch
---

Improve package.json script naming conventions

Updates the generated package.json scripts for better clarity and consistency:

- **Development Scripts**:
  - `dev:server` - Runs the Fastify server in development mode
  - `dev:workers` - Runs background job workers in development mode
  - Both scripts now use `--env-file-if-exists` for optional .env file loading
- **Script Utilities**:
  - `script:dev` - Generic development script runner with watch mode
  - `script:run` - Generic script runner for one-off executions
- **Worker Scripts**:
  - `start:workers` - Production worker startup command

These naming conventions make it clearer what each script does and follow a consistent pattern of `category:action` for better organization.
