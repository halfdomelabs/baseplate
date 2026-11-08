# Contributing

See [AGENTS.md](./AGENTS.md) for build commands, code style, and repository structure.

## Changesets and releases

Every change to a published package needs a changeset in `.changeset/`. Create one with `pnpm changeset`. Write it as a one- or two-sentence release note for someone using the generated code.

### Versioning

- All published `@baseplate-dev/*` packages are in one `fixed` group. Every release bumps all of them to the same version, even packages that did not change.
- The repository is in Changesets prerelease mode (`.changeset/pre.json`, tag `next`). Releases are published as `0.x.y-next.N` on the `next` npm dist-tag. `latest` stays on the last stable release.
- Private packages (internal tooling) are not versioned or published.

### Below 1.0: breaking changes use `minor`

While packages are below 1.0, **never use `major`**. Use `minor` for breaking changes and `patch` for everything else. A `major` changeset would push every package in the fixed group to 1.0.0, and `pnpm changesets:check` fails on one.

The first early-access changeset should be `minor`, so prereleases start at `0.7.0-next.0`, above the last stable release (0.6.x).

### Release flow

> Publishing is frozen during the rebuild: `.github/workflows/release.yml` only runs on manual dispatch and its job is disabled. Restore the `push` trigger for the first early-access release.

1. Merging to `main` makes the release workflow open or update a "Version Packages" PR.
2. Merging that PR publishes every package to npm under `next`, and creates a single `baseplate@{version}` tag and GitHub prerelease.

To leave prerelease mode for a stable release, run `pnpm changeset pre exit` and commit the result.
