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
