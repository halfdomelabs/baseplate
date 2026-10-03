#!/usr/bin/env bash
# Summarises `pnpm audit --json` for one workspace: one row per vulnerable
# package version, with the importers that depend on it directly and a count of
# those that only reach it transitively.
#
# Usage: audit-summary.sh [workspace-dir]   (defaults to the current directory)
set -euo pipefail

WORKSPACE_DIR="${1:-.}"

# Strip npm_/pnpm_ vars injected by an outer pnpm script runner so they don't
# leak into an example's pnpm (same approach as scripts/run-example.sh).
UNSET_ARGS=()
while IFS='=' read -r key _; do
  case "$key" in
    npm_* | pnpm_*) UNSET_ARGS+=("-u" "$key") ;;
  esac
done < <(env)

# `pnpm audit` exits non-zero whenever it finds advisories.
AUDIT_JSON="$(cd "$WORKSPACE_DIR" && env ${UNSET_ARGS[@]+"${UNSET_ARGS[@]}"} pnpm audit --json 2>/dev/null || true)"

if [ -z "$AUDIT_JSON" ]; then
  echo "pnpm audit produced no output in $WORKSPACE_DIR" >&2
  exit 1
fi

echo "$AUDIT_JSON" | jq -r '
  # Audit paths look like "apps__web>jsdom>undici"; the first segment is the
  # importer ("." for the workspace root) and two segments means a direct dep.
  def importer: split(">")[0] | gsub("__"; "/");
  def rank: {"critical": 0, "high": 1, "moderate": 2, "low": 3, "info": 4}[.];

  [ .advisories[] as $a
    | $a.findings[] as $f
    | {
        severity: $a.severity,
        package: $a.module_name,
        version: $f.version,
        # pnpm 12 reports null when no published version fixes the advisory.
        patched: ($a.patched_versions // "none"),
        ghsa: $a.github_advisory_id,
        direct: [$f.paths[] | select(split(">") | length == 2) | importer],
        transitive: [$f.paths[] | select(split(">") | length > 2) | importer]
      }
  ]
  | group_by([.package, .version])
  | map({
      severity: (map(.severity) | min_by(rank)),
      package: .[0].package,
      version: .[0].version,
      patched: (map(.patched) | unique | join(" ")),
      advisories: (map(.ghsa) | unique | length),
      direct: (map(.direct[]) | unique),
      transitive: (map(.transitive[]) | unique)
    })
  | sort_by([(.severity | rank), .package, .version])
  | (["SEVERITY", "PACKAGE", "INSTALLED", "PATCHED", "ADVISORIES", "DIRECT_IN", "TRANSITIVE_IMPORTERS"] | @tsv),
    (.[] | [
      .severity, .package, .version, .patched, (.advisories | tostring),
      (if (.direct | length) > 0 then .direct | join(",") else "-" end),
      # Transitive fixes go through `pnpm audit --fix=update`, so only the
      # count matters; `pnpm why -r <pkg>` lists them when needed.
      (.transitive | length | tostring)
    ] | @tsv)
' | column -t -s $'\t'

echo "$AUDIT_JSON" | jq -r '
  .metadata.vulnerabilities
  | "Totals: \(.critical) critical | \(.high) high | \(.moderate) moderate | \(.low) low"
'
