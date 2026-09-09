#!/usr/bin/env node

/**
 * Compares two folders produced by `storybook:snap` and writes a reviewable
 * `report.html` into the "after" folder.
 *
 *   pnpm --filter @baseplate-dev/ui-components storybook:snap:diff -- \
 *     /tmp/before /tmp/after --open
 */

import { compareStrings } from '@baseplate-dev/utils';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import type { ReportStory } from './snap-report.ts';
import type { SnapManifest } from './snap-shared.ts';

import { renderReport } from './snap-report.ts';
import {
  COMPARABLE_MANIFEST_KEYS,
  dim,
  fail,
  MANIFEST_FILENAME,
  MANIFEST_VERSION,
  reportFatal,
  warn,
} from './snap-shared.ts';

const ASSET_DIR = 'report-assets';
const REPORT_FILENAME = 'report.html';

/** Absolute differing-pixel budget, not a ratio. */
const DEFAULT_TOLERANCE = 20;

interface CliOptions {
  beforeDir: string;
  afterDir: string;
  tolerance: number;
  inline: boolean;
  open: boolean;
}

function parseCliArgs(): CliOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      tolerance: { type: 'string', default: String(DEFAULT_TOLERANCE) },
      inline: { type: 'boolean', default: false },
      open: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.info(
      [
        'Usage: storybook:snap:diff -- <before-dir> <after-dir> [options]',
        '',
        '  --tolerance <n>   differing pixels allowed before a story counts as changed',
        `                    (default: ${DEFAULT_TOLERANCE}, absolute not a ratio)`,
        '  --inline          embed the PNGs so report.html is a single shareable file',
        '  --open            open the report when it is written',
      ].join('\n'),
    );
    process.exit(0);
  }

  const [beforeDir, afterDir] = positionals;
  if (beforeDir === undefined || afterDir === undefined) {
    fail(
      'Two folders are required: storybook:snap:diff -- <before-dir> <after-dir>',
    );
  }

  const tolerance = Number.parseInt(values.tolerance, 10);
  if (!Number.isInteger(tolerance) || tolerance < 0) {
    fail(
      `--tolerance must be a non-negative integer, got "${values.tolerance}"`,
    );
  }

  return {
    beforeDir: path.resolve(beforeDir),
    afterDir: path.resolve(afterDir),
    tolerance,
    inline: values.inline,
    open: values.open,
  };
}

async function readManifest(dir: string): Promise<SnapManifest> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(dir, MANIFEST_FILENAME), 'utf8');
  } catch {
    fail(
      `${dir} has no ${MANIFEST_FILENAME}. It was not produced by storybook:snap, or the run did not finish.`,
    );
  }
  const manifest = JSON.parse(raw) as SnapManifest;
  if (manifest.manifestVersion !== MANIFEST_VERSION) {
    fail(
      `${dir} was captured by an older version of storybook:snap (manifest v${manifest.manifestVersion}, expected v${MANIFEST_VERSION}). Re-capture both folders.`,
    );
  }
  return manifest;
}

/**
 * Two independent invocations can silently disagree on the settings that decide
 * what was captured, which turns every story into a false added/removed. Those
 * are hard failures; a differing commit is expected and only worth a note.
 */
function compareManifests(
  before: SnapManifest,
  after: SnapManifest,
): { fatal: string[]; warnings: string[] } {
  const fatal: string[] = [];
  for (const key of COMPARABLE_MANIFEST_KEYS) {
    if (before[key] !== after[key]) {
      fatal.push(
        `${key}: before=${String(before[key])}, after=${String(after[key])}`,
      );
    }
  }
  if (
    before.viewport.width !== after.viewport.width ||
    before.viewport.height !== after.viewport.height
  ) {
    fatal.push(
      `viewport: before=${before.viewport.width}x${before.viewport.height}, after=${after.viewport.width}x${after.viewport.height}`,
    );
  }

  const warnings: string[] = [];
  if (before.playwrightVersion !== after.playwrightVersion) {
    warnings.push(
      `Captured with different Playwright versions (${before.playwrightVersion} vs ${after.playwrightVersion}); rendering differences may not be yours.`,
    );
  }
  if (before.gitSha !== null && before.gitSha === after.gitSha) {
    warnings.push(
      `Both folders were captured at the same commit (${before.gitSha}), so any difference is non-determinism rather than a code change.`,
    );
  }
  return { fatal, warnings };
}

async function listStoryIds(dir: string): Promise<Map<string, string>> {
  const entries = await fs.readdir(dir);
  const byFilename = new Map<string, string>();
  for (const entry of entries) {
    if (entry.endsWith('.png')) byFilename.set(entry, path.join(dir, entry));
  }
  return byFilename;
}

interface Comparison {
  diffPixels: number | null;
  diffRatio: number | null;
  sizeNote: string | null;
  diffPng: Buffer | null;
}

function comparePngs(beforeRaw: Buffer, afterRaw: Buffer): Comparison {
  const before = PNG.sync.read(beforeRaw);
  const after = PNG.sync.read(afterRaw);

  // pixelmatch throws unless the dimensions match, and a changed box is the
  // normal outcome of a layout refactor — report it rather than crashing.
  if (before.width !== after.width || before.height !== after.height) {
    return {
      diffPixels: null,
      diffRatio: null,
      sizeNote: `${before.width}x${before.height} → ${after.width}x${after.height}`,
      diffPng: null,
    };
  }

  const diff = new PNG({ width: before.width, height: before.height });
  const diffPixels = pixelmatch(
    before.data,
    after.data,
    diff.data,
    before.width,
    before.height,
    { threshold: 0.1, includeAA: false },
  );

  return {
    diffPixels,
    diffRatio: diffPixels / (before.width * before.height),
    sizeNote: null,
    diffPng: diffPixels === 0 ? null : PNG.sync.write(diff),
  };
}

/**
 * Copies the reported PNGs into `report-assets/` and returns their relative
 * hrefs, or base64 data URLs under `--inline`.
 */
class AssetWriter {
  readonly #dir: string;
  readonly #inline: boolean;

  constructor(afterDir: string, inline: boolean) {
    this.#dir = path.join(afterDir, ASSET_DIR);
    this.#inline = inline;
  }

  async prepare(): Promise<void> {
    await fs.rm(this.#dir, { recursive: true, force: true });
    if (!this.#inline) await fs.mkdir(this.#dir, { recursive: true });
  }

  async write(name: string, data: Buffer): Promise<string> {
    if (this.#inline) {
      return `data:image/png;base64,${data.toString('base64')}`;
    }
    await fs.writeFile(path.join(this.#dir, name), data);
    return `${ASSET_DIR}/${name}`;
  }
}

async function openReport(reportPath: string): Promise<void> {
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  await new Promise<void>((resolve) => {
    execFile(opener, [reportPath], (error) => {
      if (error)
        warn(`Could not open the report automatically: ${error.message}`);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const options = parseCliArgs();

  const [beforeManifest, afterManifest] = await Promise.all([
    readManifest(options.beforeDir),
    readManifest(options.afterDir),
  ]);
  const { fatal, warnings } = compareManifests(beforeManifest, afterManifest);
  if (fatal.length > 0) {
    fail(
      [
        'The two captures used different settings, so a diff between them is meaningless:',
        ...fatal.map((line) => `  ${line}`),
        'Re-capture both folders with the same flags.',
      ].join('\n'),
    );
  }
  for (const warning of warnings) warn(warning);

  const [beforeFiles, afterFiles] = await Promise.all([
    listStoryIds(options.beforeDir),
    listStoryIds(options.afterDir),
  ]);
  const allFiles = [
    ...new Set([...beforeFiles.keys(), ...afterFiles.keys()]),
  ].toSorted(compareStrings);

  const assets = new AssetWriter(options.afterDir, options.inline);
  await assets.prepare();

  const stories: ReportStory[] = [];
  let unchangedCount = 0;

  for (const filename of allFiles) {
    const beforePath = beforeFiles.get(filename);
    const afterPath = afterFiles.get(filename);
    const id = filename.replace(/\.png$/, '');

    if (beforePath === undefined || afterPath === undefined) {
      const present = beforePath ?? afterPath;
      if (present === undefined) continue;
      const src = await assets.write(filename, await fs.readFile(present));
      stories.push({
        id,
        status: afterPath === undefined ? 'removed' : 'added',
        diffPixels: null,
        diffRatio: null,
        sizeNote: null,
        beforeSrc: afterPath === undefined ? src : null,
        afterSrc: afterPath === undefined ? null : src,
        diffSrc: null,
      });
      continue;
    }

    const [beforeRaw, afterRaw] = await Promise.all([
      fs.readFile(beforePath),
      fs.readFile(afterPath),
    ]);
    const comparison = comparePngs(beforeRaw, afterRaw);

    if (
      comparison.sizeNote === null &&
      (comparison.diffPixels ?? 0) <= options.tolerance
    ) {
      unchangedCount += 1;
      continue;
    }

    stories.push({
      id,
      status: 'changed',
      diffPixels: comparison.diffPixels,
      diffRatio: comparison.diffRatio,
      sizeNote: comparison.sizeNote,
      beforeSrc: await assets.write(`before-${filename}`, beforeRaw),
      afterSrc: await assets.write(`after-${filename}`, afterRaw),
      diffSrc:
        comparison.diffPng === null
          ? null
          : await assets.write(`diff-${filename}`, comparison.diffPng),
    });
  }

  const reportPath = path.join(options.afterDir, REPORT_FILENAME);
  await fs.writeFile(
    reportPath,
    renderReport({
      beforeDir: options.beforeDir,
      afterDir: options.afterDir,
      beforeManifest,
      afterManifest,
      manifestWarnings: warnings,
      stories,
      unchangedCount,
      tolerance: options.tolerance,
    }),
  );

  const byStatus = (status: ReportStory['status']): ReportStory[] =>
    stories.filter((story) => story.status === status);

  for (const status of ['changed', 'added', 'removed'] as const) {
    const matching = byStatus(status);
    if (matching.length === 0) continue;
    console.info(`\n${status} (${matching.length}):`);
    for (const story of matching) {
      const detail =
        story.sizeNote ??
        (story.diffPixels === null
          ? ''
          : `${story.diffPixels.toLocaleString('en-US')} px`);
      console.info(`  ${story.id}${detail === '' ? '' : ` ${dim(detail)}`}`);
    }
  }

  console.info(
    `\n${byStatus('changed').length} changed · ${byStatus('added').length} added · ${byStatus('removed').length} removed · ${unchangedCount} unchanged`,
  );
  console.info(`Report: file://${reportPath}`);

  if (options.open) await openReport(reportPath);

  process.exit(stories.length === 0 ? 0 : 1);
}

try {
  await main();
} catch (error) {
  reportFatal(error);
  process.exit(2);
}
