---
name: baseplate-review
description: Review Baseplate branches, pull requests, commits, staged changes, or working-tree diffs for correctness, generator/template hygiene, repository conventions, comment discipline, AI-style code smells, type safety, test quality, and changeset quality. Use when asked to review, audit, assess merge readiness, or check code quality in this repository.
model: fable
---

# Baseplate Review

Review the requested diff, not the repository in the abstract. Find concrete defects and design
risks first, then explain the smallest reasonable correction.

## Establish the Review Surface

1. Inspect `git status --short` before choosing the diff so staged, unstaged, and untracked work is
   not silently omitted.
2. Use the user's baseline and target when provided. Otherwise review the full PR-in-progress:
   - Baseline: merge base with `main` (fall back to `origin/main`).
   - Target: current `HEAD` **plus** staged, unstaged, and related untracked files.
3. Enumerate the surface before deep review: changed-file status, diff stat, commits in scope when
   useful, and untracked files that appear related.
4. **Ignore everything under `baseplate/generated/`** (e.g. `examples/<name>/baseplate/generated/`,
   `examples/<name>/apps/<app>/baseplate/generated/`). These are sync bookkeeping artifacts, not
   authored or reviewable code. Exclude them from the diff surface up front —
   `git diff <base> -- . ':(exclude)**/baseplate/generated/**'` — so diff stats and file counts
   reflect real changes. Never report findings against them.
5. Exclude pre-existing problems unless the diff introduces, worsens, or exposes them.

Do not mutate code during a review unless the user separately asks for fixes.

## Load the Relevant Project Intent

Always honor `AGENTS.md` and `.agents/code-style.md` (loaded via project instructions). Then load
only what the changed area needs:

- `.agents/testing.md` when tests are added, changed, or conspicuously missing.
- `.agents/ui-rules.md` and `.agents/ui-components.md` when the diff touches `ui-components`,
  `project-builder-web`, or plugin UI (`plugins/*/src/**` web code).
- `.agents/mcp-actions.md` when the diff touches generators, templates, or generated output.

## Review in Risk Order

### 1. Correctness and Data Integrity

Trace changed behavior end to end. Check invalid inputs, null/empty states, error paths,
ordering/determinism of generated output (stable sorts via `compareStrings`), and partial failure
during sync. Confirm schema changes flow through the project-definition → compiler → generator
pipeline consistently.

**When generators or templates changed, review in this order — generated code first, generator
second:**

1. **Read the generated output as a downstream user would.** Start with the example diffs under
   `examples/**` (excluding `baseplate/generated/**`) and the template sources under
   `generators/**/generated/**`. Judge that code on its own merits: is it correct, idiomatic, well
   typed, free of dead code and authoring commentary, and something you would accept in a
   hand-written project? A generator bug ships to every downstream project, so a flaw here outranks
   anything in the generator itself.
2. **Then read the generator that produced it.** With the concrete output in hand, evaluate how the
   generator is set up — task/provider wiring, template choice versus string composition,
   determinism, and whether the generator's structure explains the flaws found in step 1. Trace each
   output flaw back to its cause and report the fix at the generator/template level, not as a
   hand-edit to the output.

Do not review the generator first and infer the output from it; read what actually ships.

### 2. Generator and Template Hygiene

- **No hand-edits to generated artifacts.** Templates under `generators/**/generated/**` must be
  authored through the template extraction workflow (Baseplate MCP tools / `/modify-generated-code`),
  never edited directly. Flag diffs to generated files that lack a corresponding template or
  generator change.
- **No test scaffolding in generated code.** Generated output must not contain test code, debug
  helpers, or development leftovers. Test files that belong to an example project should be
  **snapshotted** (`snapshot-add` / `snapshot-save`) rather than emitted by a generator.
- **No authoring commentary in generated code.** Comments in templates ship verbatim into every
  user's project. Flag comments explaining the template's own construction, change rationale, or
  anything a downstream user would not benefit from.
- **Prefer template files over string composition.** When a generator builds nontrivial file
  content by concatenating strings or ts-fragments by hand, flag it if a template file (text, raw,
  or ts template) would express the same output more maintainably. Hand composition is acceptable
  only for genuinely dynamic structure a template cannot express.
- **Examples must stay in sync.** When generators or templates changed, examples under `examples/`
  must be regenerated (`pnpm start sync-examples --overwrite`) and committed. Verify example diffs
  are consistent with the generator change — nothing more, nothing less.

### 3. Repository Conventions and Type Safety

Verify against `.agents/code-style.md`: `??` over `||`, explicit return types on top-level
functions, definition-before-use ordering, `.js` import extensions, `#src/` aliases, no cross-package
re-exports, `es-toolkit` over manual utility implementations, `compareStrings` over `localeCompare`.
Lint catches some of this — focus on what it does not.

Actively hunt escape-hatch typing: `any`, `as` casts, `as unknown as`, non-null assertions (`!`),
`@ts-ignore`/`@ts-expect-error`, and conditional/mapped types whose complexity obscures the domain.
Demand type guards, discriminated unions, generics, or Zod validation at real boundaries instead.

### 4. Comment Discipline (Strict)

Comments must earn their place by stating a non-obvious constraint, external-API quirk, or subtle
edge case that names and types cannot express. Flag — even at one line — comments that:

- restate what the code plainly does or narrate steps ("// 1. Fetch the user");
- justify a decision to a reviewer ("// using X because it's cleaner");
- record change history, past bugs, or future plans;
- reference tickets, PRs, or conversations;
- pad JSDoc with background prose or "prefer this over X" commentary.

JSDoc should state what a function does, its params, and its return in as few lines as possible.

### 5. Pattern Smells

Actively hunt for these; they are findings, not preferences:

- **AI-style artifacts:** banner/section comments, numbered step comments, single-use helper
  functions that fragment straightforward logic, convenience re-exports, backwards-compat shims or
  deprecated aliases nobody asked for, dead parameters kept "just in case."
- **Defensive over-coding:** try/catch that swallows or re-wraps without adding information,
  null checks or optional chaining on values the types prove non-nullish, fallback defaults that
  mask upstream bugs, guards for states the type system or schema already makes unrepresentable.
  A missing guard is a finding only when the unguarded path is reachable; an unreachable guard is
  a finding too.
- **Over-engineering:** abstractions, configuration, or extensibility built for hypothetical
  future needs. If two things do roughly the same job, they should be one function with a
  parameter — but do not demand an abstraction without pointing at the concrete duplication that
  justifies it.

### 6. UI Conventions (when UI is touched)

Components come from `@baseplate-dev/ui-components` (ShadCN-based), styling is Tailwind-only,
icons come from `react-icons/md`, plugin Tailwind classes carry the plugin prefix (`auth-`,
`storage-`, …). New `ui-components` components need Storybook stories.

### 7. Tests — Judicious, Both Directions

- Flag risky changed logic with no covering test, mapping to the patterns in `.agents/testing.md`
  (colocated `*.unit.test.ts` / `*.int.test.ts`, existing `*.test-helper.ts` factories, memfs for
  filesystem code).
- Equally flag test bloat: trivial tests of getters/pass-throughs, exhaustive permutations that
  belong in one parameterized case, heavy integration setups exercising minor logic, and mocks
  that re-implement the code under test.
- Distinguish a test that was not run from a test that failed.

### 8. Changeset Quality

For user-facing or generated-output changes, a `.changeset/*.md` entry must exist, name the right
packages, and read as a one-to-two-sentence release note for a **user of the generated code** — not
a diff summary, rationale, file list, or ticket reference. A single continuous line, no internal
newlines. Flag missing changesets and changesets that describe the refactor instead of the outcome.

## Validate Proportionally

Run the narrowest useful checks; never mutate code to make them pass.

1. Focused tests for risky changed paths: `pnpm --filter @baseplate-dev/<pkg> test <file>`.
2. `pnpm typecheck` / `pnpm lint:only:affected` when the diff is broad or types look fragile.
3. When generators or templates changed: `pnpm start diff-examples --fail-on-differences` (or
   scoped `pnpm start diff <example>`) to confirm examples are in sync.
4. Do not claim behavior is safe solely because types, lint, or generated output pass.

## Finding Bar

Report only an issue that is introduced or materially worsened by the reviewed change, reproducible
from a concrete execution path or maintainability cost, actionable with a clear correction, and
important enough that the author would likely address it.

Priorities:

- **P0:** catastrophic — data loss in sync/merge, or a defect shipped into every generated project.
- **P1:** likely correctness, security, or generated-output failure that should block merging.
- **P2:** meaningful defect, convention violation, or recurring developer cost.
- **P3:** localized low-risk problem worth fixing; omit subjective polish.

Do not elevate a preference into a finding. When unsure whether a P3 clears the bar, drop it.

## Output Contract

Lead with decisions in priority order:

- `FIX [P0–P3] — <specific title>` for an actionable issue. Put the tightest changed `file:line`
  directly below it, then the concrete failure or cost and the smallest coherent correction —
  usually one short paragraph. Suggest a deeper refactor only when a local patch would leave the
  implementation brittle, and say why.
- `SKIP — <specific title>` only for a conspicuous concern that is deliberately acceptable, with
  the reason in one or two sentences. Omit routine non-issues; SKIP is not review padding.

After the decisions, include a brief review-coverage and validation summary and any residual risk
from checks not run. A review with two P1s and nothing else beats the same two P1s buried under
eight P3s. If there are no FIX findings, say so explicitly — never invent decisions to make the
review look useful.

Do not include a PR title in the review itself. Later in the session, once the FIX findings have
actually been applied, provide a **Proposed PR Title**: a succinct, conventional-commit-style
title reflecting the change as it now stands (e.g.,
`feat: add radio and number field controllers with unified empty-value handling`).
