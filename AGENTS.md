# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Build and Test Commands

See @.agents/dev-commands.md for dev commands for building and testing.

## Code Style Guidelines

See @.agents/code-style.md for code style guidelines.

## UI Development Guidelines

See .agents/ui-rules.md for UI development guidelines.

See .agents/ui-components.md for the full UI component reference.

## Testing Best Practices

See .agents/testing.md for testing best practices.

## Repository Structure

Baseplate is being rebuilt on a new stack. `main` holds only the packages the rebuild reuses:

- **packages/sync** (`@baseplate-dev/sync`): Code generation engine: task runner, providers, phases, file identities, and diff3/JSON diff3 merging
- **packages/core-generators** (`@baseplate-dev/core-generators`): TypeScript rendering primitives (`TsCodeFragment`, `TsCodeUtils`, import maps, template renderers and extractor) plus the minimal node/typescript generators they run on
- **packages/project-builder-lib** (`@baseplate-dev/project-builder-lib`): Plugin system: plugin specs, spec store, plugin metadata, and the plugin loader
- **packages/code-morph** (`@baseplate-dev/code-morph`): Codebase transformations
- **packages/ui-components** (`@baseplate-dev/ui-components`): Reusable UI component library with Storybook
- **packages/utils** (`@baseplate-dev/utils`): Utility functions
- **packages/tools** (`@baseplate-dev/tools`): Common configurations (oxlint, oxfmt, TSConfig, Vitest)

## Porting from Legacy

The original Baseplate (project builder web/server/CLI, React and Fastify generators, all plugins, and the example projects) is frozen on the `legacy` branch and `legacy-final` tag. It is not on `main`. When porting logic, check it out side by side instead of recreating deleted packages:

```bash
git worktree add ../baseplate-legacy legacy-final
```

Treat legacy code as reference only: its stack (Fastify, Pothos/GraphQL, Prisma) is being replaced, so port the logic, not the patterns.

## Key Reminders

- Run `pnpm check` during development to validate affected packages (formatting, linting, type checking, testing)
- Only run `pnpm check:full` as a final pass when completely done — it runs everything including knip and metadata sync and is much slower
- For new or modified features, generate a patch changeset in the .changeset/ directory. **One or two sentences, hard limit.** Describe only what changes for someone using the generated code — not the refactor that got you there, not the rationale, not the file names, not the internal symbols. If several things changed, summarise the outcome rather than listing each one; a changeset is a release note, not a summary of the diff. Write it as a single continuous line with no internal newlines, and do not reference Linear tickets.

  ```markdown
  ---
  'package-name': patch
  ---

  Description of the feature or change
  ```

  **Bump type below 1.0:** use `patch` by default and `minor` for breaking changes. **Never use `major`**: all packages share one fixed version, so a single `major` would push every package to 1.0.0. `pnpm changesets:check` rejects it. See CONTRIBUTING.md.

  Good: `The notification feed is now cursor-paginated, so rows are no longer skipped or repeated when a notification arrives between page fetches.`

  Too long: the same thing plus the module that was split out, the file the query moved to, the index that changed, and the type signature that was tightened. Those belong in the PR description.

  Before adding one, check whether a pending changeset in .changeset/ already covers the feature you are modifying. If it does, rewrite that changeset to describe the end state and do not add a second one — iterating on an unreleased feature should produce one release note, not one per pass. When your change supersedes behavior from a pending changeset, describe only what users will get, dropping the intermediate step entirely; when it supersedes behavior that has already been released, describe the new shape and the migration away from the old one, since users are on it.

- IMPORTANT: If you have to go through more than two cycles of edits to fix linting, type, or test errors, please stop and ask for help. Often fixing errors will cause worse changes so it's better to ask for help than to continue. Feel free to ask for help at any time for any issues.
- IMPORTANT: If you notice you are looping, encountering contradictory instructions, or something seems off, stop and flag it to the user immediately. See .agents/code-style.md for the full list of glitch indicators.
