import { compareStrings } from '@baseplate-dev/utils';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every `components/ui` template is a copy of its `@baseplate-dev/ui-components`
 * twin. The two are authored separately — the library by hand, the template by
 * `extract-templates` from the example apps — so nothing but this test stops
 * them drifting.
 *
 * Compared modulo imports: the template rewrites them to `$name` placeholders
 * and prepends `// @ts-nocheck`. Comments are compared, because a deviation
 * from the shadcn source is required to carry an inline comment naming it.
 */

const require = createRequire(import.meta.url);
const uiComponentsRoot = path.dirname(
  require.resolve('@baseplate-dev/ui-components/package.json'),
);

const templateComponentsDir = path.join(
  import.meta.dirname,
  'templates/components/ui',
);
const templateSrcDir = path.join(import.meta.dirname, 'templates/src');

/** Support modules whose twin sits at a different filename. */
const RENAMED_TWINS: Record<string, string> = {
  'types/icon.ts': 'types/react.ts',
  'utils/merge-refs.ts': 'utils/refs.ts',
};

/** Templates with no library twin, by design. */
const TEMPLATE_ONLY = new Set([
  // Renders a `@tanstack/react-router` Link; ui-components is router-agnostic.
  'not-found-card.tsx',
]);

/**
 * Twins allowed to differ. Each entry must name why — an entry that no longer
 * differs fails the test, so this list cannot rot.
 */
const COMPONENT_STRINGS =
  'ui-components resolves its user-facing copy through `useComponentStrings`; generated apps inline the English strings.';

const DEVIATIONS: { file: string; reason: string }[] = [
  {
    file: 'components/ui/combobox-field.tsx',
    reason: COMPONENT_STRINGS,
  },
  {
    file: 'components/ui/confirm-dialog.tsx',
    reason: COMPONENT_STRINGS,
  },
  {
    file: 'components/ui/error-display.tsx',
    reason: COMPONENT_STRINGS,
  },
  {
    file: 'components/ui/multi-combobox-field.tsx',
    reason: COMPONENT_STRINGS,
  },
];

function readTwinPair(
  templatePath: string,
  libraryPath: string,
): { template: string; library: string } {
  return {
    template: readFileSync(templatePath, 'utf8'),
    library: readFileSync(libraryPath, 'utf8'),
  };
}

/**
 * Strips imports and blank lines so the two copies can be compared on body
 * alone, along with the leading `// @ts-nocheck` / `'use client';` prologue that
 * only one side carries. A directive further down the file is left in place: it
 * is a defect, and dropping every occurrence would hide a duplicated one.
 *
 * Lint pragmas are normalised because generated apps run eslint and the library
 * runs oxlint, which is a difference in tooling rather than in the component.
 */
function stripImports(source: string): string {
  const lines: string[] = [];
  let inImport = false;
  let inPrologue = true;
  let directiveSeen = false;
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (inImport) {
      if (trimmed.endsWith(';')) inImport = false;
      continue;
    }
    if (inPrologue && trimmed === '// @ts-nocheck') continue;
    if (inPrologue && trimmed === "'use client';" && !directiveSeen) {
      directiveSeen = true;
      continue;
    }
    if (trimmed !== '') inPrologue = false;
    if (line.startsWith('import ')) {
      if (!trimmed.endsWith(';')) inImport = true;
      continue;
    }
    if (trimmed === '') continue;
    lines.push(
      line.replace(
        '// oxlint-disable-next-line',
        '// eslint-disable-next-line',
      ),
    );
  }
  return lines.join('\n');
}

/**
 * Names bound by a file's imports, ignoring which module they came from — the
 * template's `$name` placeholders point at the same symbols under other paths.
 *
 * The React namespace type import is skipped: extraction gives every template an
 * `import type * as React from 'react'` that the library takes from its
 * tsconfig globals instead.
 */
function importedSymbols(source: string): string[] {
  const symbols = new Set<string>();
  for (const match of source.matchAll(
    /^import\s+(type\s+)?([^;]*?)\s+from\s+['"]([^'"]+)['"];/gms,
  )) {
    const [, typeOnly, clause, module] = match;
    if (!clause) continue;
    if (typeOnly && clause.trim() === '* as React' && module === 'react') {
      continue;
    }
    for (const part of clause.replaceAll(/[{}]/g, ',').split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .at(-1);
      if (name && name !== '*') symbols.add(name);
    }
  }
  return [...symbols].toSorted(compareStrings);
}

/** Every template that should have a library twin, paired with that twin. */
function collectTwins(): {
  name: string;
  templatePath: string;
  libraryPath: string;
}[] {
  const twins = readdirSync(templateComponentsDir)
    .filter((file) => file.endsWith('.tsx') && !TEMPLATE_ONLY.has(file))
    .map((file) => {
      const component = path.basename(file, '.tsx');
      return {
        name: `components/ui/${file}`,
        templatePath: path.join(templateComponentsDir, file),
        libraryPath: path.join(
          uiComponentsRoot,
          'src/components/ui',
          component,
          file,
        ),
      };
    });

  for (const group of ['hooks', 'styles', 'types', 'utils']) {
    const groupDir = path.join(templateSrcDir, group);
    if (!existsSync(groupDir)) continue;
    for (const file of readdirSync(groupDir)) {
      const relative = `${group}/${file}`;
      twins.push({
        name: `src/${relative}`,
        templatePath: path.join(groupDir, file),
        libraryPath: path.join(
          uiComponentsRoot,
          'src',
          RENAMED_TWINS[relative] ?? relative,
        ),
      });
    }
  }

  return twins.toSorted((a, b) => compareStrings(a.name, b.name));
}

const twins = collectTwins();
const deviations = new Map(
  DEVIATIONS.map(({ file, reason }) => [file, reason]),
);

describe('component templates match their ui-components twins', () => {
  const enforced = twins.filter(({ name }) => !deviations.has(name));

  it.each(enforced.map(({ name }) => name))('%s', (name) => {
    const twin = twins.find((candidate) => candidate.name === name);
    if (!twin) throw new Error(`No twin registered for ${name}`);

    const { template, library } = readTwinPair(
      twin.templatePath,
      twin.libraryPath,
    );

    expect(stripImports(template)).toEqual(stripImports(library));
    expect(importedSymbols(template)).toEqual(importedSymbols(library));
  });

  it('has a library twin for every template', () => {
    const missing = twins
      .filter(({ libraryPath }) => !existsSync(libraryPath))
      .map(({ name }) => name);
    expect(missing).toEqual([]);
  });

  it('lists no deviation that has stopped deviating', () => {
    const stale = [...deviations.keys()].filter((name) => {
      const twin = twins.find((candidate) => candidate.name === name);
      if (!twin || !existsSync(twin.libraryPath)) return false;
      const { template, library } = readTwinPair(
        twin.templatePath,
        twin.libraryPath,
      );
      return stripImports(template) === stripImports(library);
    });
    expect(stale).toEqual([]);
  });
});
