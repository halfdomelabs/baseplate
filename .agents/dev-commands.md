## Build and Test Commands

### For the entire repository

- Build: `pnpm build`
- Lint affected with auto-fixing: `pnpm lint:only:affected -- --fix`
- Check types: `pnpm typecheck`
- Test affected: `pnpm test:affected`
- Check affected code: `pnpm check` (runs formatting, linting, type checking, and testing on affected packages — use this during development)
- Full check: `pnpm check:full` (runs everything including knip and metadata sync — only run as a final pass before completing a task)

### For a specific package

- Build: `pnpm --filter @baseplate-dev/<package-name> build`
- Lint with auto-fixing: `pnpm --filter @baseplate-dev/<package-name> lint --fix`
- Check types: `pnpm --filter @baseplate-dev/<package-name> typecheck`
- Test all: `pnpm --filter @baseplate-dev/<package-name> test`
- Test single file: `pnpm --filter @baseplate-dev/<package-name> test <package-relative-path/to/file.unit.test.ts>`
- Run only specific tests: `pnpm --filter @baseplate-dev/<package-name> test "<test name pattern>"`

### For example projects

Example projects (`examples/`) are standalone monorepos not included in the pnpm workspace.

- Run a command in a specific example: `pnpm run:example <example-name> -- <command>`
  - Install: `pnpm run:example todo-with-better-auth -- pnpm install`
  - Lint: `pnpm run:example blog-with-auth -- pnpm lint`
  - Test: `pnpm run:example todo-with-better-auth -- pnpm test`
  - Typecheck: `pnpm run:example todo-with-better-auth -- pnpm typecheck`
- Run a command in all examples + root + tests: `pnpm run:all -- <command>`

### Checking examples after regenerating them

Examples run their own stricter generated-app lint/tsconfig, so errors in generated code (e.g. an eslint rule the source packages don't enforce) only surface when the example itself is checked. After changing generators or templates that regenerate example output, run:

- `pnpm check:examples` — runs each example's own `check` (`lint`, `prettier:check`, `test`, `typecheck` over affected packages) via `pnpm run:examples -- pnpm check`.

Assumes example deps are already installed (they use a committed lockfile); run `pnpm run:examples -- pnpm install --frozen-lockfile` once if not. The `test` step needs Docker running (`docker compose up -d` in each example's `docker/` dir). To lint/typecheck only, run: `pnpm run:examples -- sh -c 'pnpm lint && pnpm typecheck'`.
