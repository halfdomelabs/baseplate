---
name: upgrade-dependencies
description: Upgrades dependencies across the Baseplate monorepo and every example project. With no arguments, fixes every vulnerable package `pnpm audit` reports (root + examples) without overrides, flagging major bumps instead of applying them. With package names, upgrades just those. Routes each bump to where its version actually lives (catalog, package.json, or generator constants + resync).
argument-hint: '[package...]'
allowed-tools: Bash(.claude/skills/upgrade-dependencies/audit-summary.sh *), Bash(pnpm audit), Bash(pnpm update -r *), Bash(pnpm install), Bash(pnpm install *), Bash(pnpm why *), Bash(pnpm view *), Bash(npm view *), Bash(pnpm build), Bash(pnpm check), Bash(pnpm check:*), Bash(pnpm start sync-examples *), Bash(pnpm start diff-examples *), Bash(pnpm run:example *), Bash(pnpm run:examples *), Bash(pnpm versions:check), Bash(git status *), Bash(git diff *), Bash(git grep *), Bash(git checkout -- *), Read, Edit, Write
---

# Upgrade Dependencies

Arguments: `$ARGUMENTS`

- **No arguments → vulnerability mode.** Fix everything `pnpm audit` reports in the root workspace and every `examples/*` project.
- **Package names → targeted mode.** Upgrade those packages to their latest non-major version, or to the version given as `pkg@x.y.z`.

Both modes share the same routing, guardrails, verification, and report.

## Where versions live

Each example under `examples/` is a standalone pnpm workspace with its own lockfile. Its `package.json` files are **generator output**, so the version source depends on what kind of dependency it is:

| Dependency                           | Version source                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo direct dep (catalogued)     | `catalog:` in root `pnpm-workspace.yaml`                                                                                            |
| Monorepo direct dep (not catalogued) | That package's `package.json`                                                                                                       |
| Example direct dep                   | Generator constants (see below), then resync                                                                                        |
| Transitive dep (anywhere)            | That workspace's lockfile, via `pnpm update -r <pkg>`. Example lockfiles are not generated, so lockfile-only fixes survive a resync |

**Never hand-edit an example's `package.json` or `baseplate/generated/**`.** The next sync overwrites them.

Find the generator constant that owns a package. It lives in files like `packages/*-generators/src/constants/*-packages.ts` and `plugins/plugin-auth/src/better-auth/constants/packages.ts`:

```bash
# Unscoped keys are unquoted (`fastify: '5.12.1'`) and scoped keys are quoted.
# git grep -E has no `\s`, so the pattern uses [[:space:]].
git grep -nE "^[[:space:]]*'?<pkg>'?: '" -- 'packages/*/src/**' 'plugins/*/src/**'
```

If that finds nothing, grep for the installed version string instead. Some generators inline their versions.

The same package can be both a generator constant and a monorepo direct dependency (`fastify`, `vitest`, `typescript`, …). Bump both together; `pnpm versions:check` catches drift inside the monorepo.

## Ground rules

1. **Don't use `pnpm audit --fix` in any form.**
   - Bare `--fix` writes `overrides`.
   - On pnpm 12.8, `--fix=update` re-resolves the whole graph: one run moved about 520 packages and rewrote unrelated `package.json` and catalog ranges.
   - Use the targeted `pnpm update -r <pkg...>` in step 3 instead.
2. **No overrides.** Never write `overrides`, never pass `--force`, and never add `minimumReleaseAgeExclude` entries.
   - If a fix needs a version younger than `minimumReleaseAge`, the install fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`.
   - Revert that bump and report it. The user decides between waiting and a deliberate exclusion.
3. **Majors are the user's call.** A bump is major when the leftmost non-zero component changes, so `0.4 → 0.5` counts. Never apply one, and don't take prereleases.
4. **Stop and ask** if any of these happens:
   - an install fails workspace-wide;
   - a fix needs an override;
   - you loop on the same error twice.

## 1. Scan

```bash
git status --short          # note anything already dirty
.claude/skills/upgrade-dependencies/audit-summary.sh .
.claude/skills/upgrade-dependencies/audit-summary.sh examples/<name>   # for each examples/* dir
```

Keep these outputs as the baseline. Each row is one vulnerable package version:

- **`PATCHED`** lists the fixed ranges of its advisories. `none` means no published version fixes that advisory.
- **`DIRECT_IN`** names the importers that depend on it directly.
- **`TRANSITIVE_IMPORTERS`** counts the importers that only reach it through other packages.

In targeted mode, skip the audit. Use `pnpm view <pkg> version` and `git grep` to find the current version(s) and every source from the table above.

## 2. Plan the bumps

For each row (vulnerability mode) or package (targeted mode):

- **Choose the target.**
  - Vulnerability mode: the lowest version satisfying every `PATCHED` range. Prefer the latest patch or minor in the same major (`pnpm view <pkg> versions --json`).
  - If only a major satisfies it, record it for the report and skip it.
- **Direct rows:** route to the catalog, the `package.json`, or the generator constant, using the table.
  - A direct row in an example almost always maps to a generator constant.
  - If the same package is also a monorepo direct dep, bump that too.
- **Transitive rows:** collect them into one `pnpm update -r` list per workspace for step 3. Leave out anything that needs a major.
- **`none` rows:** these can't be fixed. Carry them into the report.

## 3. Apply

Run these in order, because each step feeds the next:

```bash
# 1. Edit catalog / package.json / generator constants from step 2, then:
pnpm install
pnpm build                                   # sync must load the new constants
pnpm start sync-examples --overwrite         # regenerates example package.json + installs

# 2. Transitive fixes (vulnerability mode): one call per workspace, with that workspace's transitive rows
pnpm update -r <pkg> <pkg> ...
pnpm run:example <name> -- pnpm update -r <pkg> <pkg> ...    # for each example
```

- `pnpm update -r` honours each package's declared range and `minimumReleaseAge`, and only re-resolves the packages you name.
- After each step, check that `git diff --stat` shows a small lockfile diff and no `package.json` changes beyond the step 2 edits.
- An example `package.json` change that didn't come from the sync means a direct dependency got into the update list. Revert it with `git checkout -- <file>` and route that package through its generator constant.

## 4. Whatever's left

Rerun the step 1 scans and compare them with the baseline. For each remaining row with a non-`none` patch, find out why the lockfile is held back:

```bash
pnpm why -r <pkg>                                       # or: pnpm run:example <name> -- pnpm why -r <pkg>
npm view <parent>@<installed> dependencies --json      # does the parent pin it exactly?
npm view <parent>@<newer> dependencies --json          # which parent release pins the patched version?
```

- **A non-major parent release has the fix:** bump the parent, routed through the table. Then repeat step 3 for that workspace.
  - Respect any lockstep notes next to the catalog entry. For example, `@module-federation/vite` pins its own `@module-federation/runtime`, so `enhanced` must match.
- **That parent release is younger than `minimumReleaseAge`:** the install fails. Revert the bump and report the date it matures.
- **Only a major or a prerelease of the parent has the fix**, or the row is `none`: carry it into the report.

## 5. Verify

```bash
pnpm check
pnpm check:examples       # diff-examples --fail-on-differences + each example's `pnpm check` + check:example-deps
```

- The examples' tests need Docker; start it with `docker compose up -d` in each example's `docker/`.
- If Docker isn't available, run `pnpm run:examples -- sh -c 'pnpm lint && pnpm typecheck'` plus `pnpm start diff-examples --fail-on-differences`. Say in the report that you fell back.
- Run every check even if an earlier one fails.
- Cross-reference each failure with the bumps you applied. A minor that broke something goes in the report, not into a workaround.

## 6. Changeset

- **Generator constants changed:** add one patch changeset listing every affected generator or plugin package. Keep it to one sentence about what generated projects get, e.g. "Generated projects now use patched versions of fastify and axios."
- **Only lockfiles changed:** no changeset needed.
- **Pending changeset already exists:** check `.changeset/` first and update the existing one rather than adding a second.

## 7. Report

1. **⚠️ Majors needing review:** package (or the parent that pins it), current → required version, the advisory and severity, and a changelog link from `npm view <pkg> repository.url`.
2. **Fixed:** per workspace (root, then each example), the package versions moved and where each was changed: lockfile, catalog, or generator constant.
3. **Blocked by `minimumReleaseAge`:** package, version needed, and the UTC time it matures.
4. **Unresolved:** `none` rows and parent pins with no non-major fix. For high and critical advisories, summarise what the vulnerability actually involves and whether it's reachable (dev-only tooling, or shipped runtime).
5. **Totals:** severity totals before and after, for each workspace.
6. **Verification:** which path ran (`check:examples`, or the lint and typecheck fallback) and the results.

## Troubleshooting

- **Peer dependency warnings after a bump:** check whether the peer's ecosystem needs a matching bump (React, Vite, ESLint plugins) and bump those together.
- **Type errors after a minor bump:** read the package changelog. Fix call sites in the monorepo. Fix generated code through the generator templates using the `modify-generated-code` skill, not in the example.
- **`diff-examples` fails after a sync:** a constant probably changed without `pnpm build`. Rebuild and resync.
