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
