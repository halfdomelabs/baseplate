#!/usr/bin/env node

/**
 * Captures a PNG of every Storybook story into a folder, for use with
 * `storybook:snap:diff`. Local-only; nothing here runs in CI.
 *
 *   pnpm --filter @baseplate-dev/ui-components storybook:snap -- --out /tmp/before
 */

import type { Browser, Page } from 'playwright';

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { chromium } from 'playwright';
import playwrightPackage from 'playwright/package.json' with { type: 'json' };

import type { SnapManifest } from './snap-shared.ts';

import {
  dim,
  fail,
  MANIFEST_FILENAME,
  MANIFEST_VERSION,
  readGitState,
  reportFatal,
  serveDirectory,
  storyIdToFilename,
} from './snap-shared.ts';

const execFileAsync = promisify(execFile);

const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..');

// Outside the package tree on purpose: a build inside it would be picked up by
// eslint, prettier and knip, none of which should see generated Storybook output.
const BUILD_DIR = path.join(os.tmpdir(), 'baseplate-storybook-snap-build');

const VIEWPORT = { width: 900, height: 700 };
const DEVICE_SCALE_FACTOR = 2;

/**
 * Every `new Date()` in a story resolves here. Date pickers render "today", so
 * without this a before/after pair captured either side of midnight would
 * report every calendar story as changed.
 */
const FIXED_TIME = Date.UTC(2026, 0, 15, 12, 0, 0);

/**
 * Opt-out for stories that never hold still. A story driving itself from a
 * timer (`CircularProgress`'s `AnimatedProgress` cycles every 500ms) renders a
 * different frame on every run without ever changing size, so no amount of
 * settling makes it comparable — the story has to declare itself unsnapshottable.
 */
const SKIP_TAG = 'no-snapshot';

const SETTLE_POLL_MS = 50;
/** 400ms of no movement, which clears `Loader`'s 300ms reveal. */
const SETTLE_STABLE_READS = 8;
const SETTLE_MAX_READS = 60;

/**
 * Kills anything that would make two captures of the same commit disagree:
 * in-flight transitions, the text caret, and the focus ring left behind by
 * Storybook's own autofocus.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
  .cm-cursor, .cm-dropCursor { visibility: hidden !important; }
`;

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  type?: string;
  tags?: string[];
}

interface StorybookIndex {
  entries?: Record<string, StoryEntry>;
}

function parseCliArgs(): {
  out: string;
  grep: string | null;
  theme: 'light' | 'dark';
  concurrency: number;
  reuseBuild: boolean;
} {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      grep: { type: 'string' },
      theme: { type: 'string', default: 'light' },
      concurrency: { type: 'string', default: '4' },
      'reuse-build': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.info(
      [
        'Usage: storybook:snap -- --out <dir> [options]',
        '',
        '  --out <dir>          where to write the PNGs (required)',
        '  --grep <pattern>     only stories whose id or title matches (regex)',
        '  --theme light|dark   theme global to capture under (default: light)',
        '  --concurrency <n>    parallel pages (default: 4)',
        '  --reuse-build        skip `storybook build` and reuse the last one',
      ].join('\n'),
    );
    process.exit(0);
  }

  if (values.out === undefined || values.out === '') {
    fail(
      '--out <dir> is required. Pass it after `--`, e.g. `-- --out /tmp/before`.',
    );
  }
  if (values.theme !== 'light' && values.theme !== 'dark') {
    fail(`--theme must be "light" or "dark", got "${values.theme}"`);
  }

  const concurrency = Number.parseInt(values.concurrency, 10);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    fail(
      `--concurrency must be a positive integer, got "${values.concurrency}"`,
    );
  }

  return {
    out: path.resolve(values.out),
    grep: values.grep ?? null,
    theme: values.theme,
    concurrency,
    reuseBuild: values['reuse-build'],
  };
}

async function buildStorybook(reuseBuild: boolean): Promise<void> {
  if (reuseBuild) {
    const exists = await fs
      .access(path.join(BUILD_DIR, 'index.json'))
      .then(() => true)
      .catch(() => false);
    if (exists) {
      console.info(dim(`Reusing existing build at ${BUILD_DIR}`));
      return;
    }
    console.info(dim('No existing build to reuse; building.'));
  }

  console.info('Building Storybook…');
  await execFileAsync(
    'pnpm',
    ['exec', 'storybook', 'build', '--output-dir', BUILD_DIR, '--quiet'],
    { cwd: PACKAGE_ROOT, maxBuffer: 32 * 1024 * 1024 },
  );
}

async function readStories(
  origin: string,
  grep: string | null,
): Promise<StoryEntry[]> {
  const response = await fetch(`${origin}/index.json`);
  if (!response.ok) {
    fail(
      `Could not read index.json from the built Storybook (${response.status})`,
    );
  }
  const index = (await response.json()) as StorybookIndex;
  const stories = Object.values(index.entries ?? {}).filter(
    (entry) => entry.type !== 'docs' && !(entry.tags ?? []).includes(SKIP_TAG),
  );

  if (grep === null) return stories;

  let pattern: RegExp;
  try {
    pattern = new RegExp(grep, 'i');
  } catch {
    fail(`--grep is not a valid regular expression: ${grep}`);
  }
  return stories.filter(
    (story) =>
      pattern.test(story.id) || pattern.test(`${story.title}/${story.name}`),
  );
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CaptureRegion {
  /** `#storybook-root`, or null when the story renders nothing into it. */
  root: Rect | null;
  /** Root unioned with any portalled content, or null when neither has a box. */
  union: Rect | null;
  /** Direct children of `body` outside the root that painted something. */
  portalCount: number;
}

/**
 * Measures what actually needs to be in the screenshot.
 *
 * Dialogs, popovers, sheets and tooltips render into `document.body`, outside
 * `#storybook-root`, so an open overlay is invisible to a root-only capture.
 * The union covers both.
 *
 * Only positioned elements count as overlay content. Two things parented to
 * `body` would otherwise corrupt the region: the toaster viewport, mounted on
 * every story (excluded by having no area when empty), and an empty in-flow
 * div that `@uiw/react-codemirror` leaves behind, which paints nothing but
 * inherits a height from CodeMirror's theme class. An overlay is always taken
 * out of flow; an in-flow sibling of the root is an artifact, not content.
 */
async function measureCaptureRegion(page: Page): Promise<CaptureRegion> {
  return page.evaluate(() => {
    const areaOf = (element: Element): DOMRect | null => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0.5 && rect.height > 0.5 ? rect : null;
    };

    const isOverlay = (element: Element, rect: DOMRect): boolean => {
      const style = getComputedStyle(element);
      if (style.position !== 'fixed' && style.position !== 'absolute') {
        return false;
      }
      if (style.visibility === 'hidden' || style.opacity === '0') return false;
      // An overlay parked off-screen would otherwise blow the region open.
      return (
        rect.right > 0 &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.top < window.innerHeight
      );
    };

    const root = document.querySelector('#storybook-root');
    const rootHost = root?.closest('body > *') ?? null;
    const rootRect = root === null ? null : areaOf(root);

    let left = rootRect?.left ?? Number.POSITIVE_INFINITY;
    let top = rootRect?.top ?? Number.POSITIVE_INFINITY;
    let right = rootRect?.right ?? Number.NEGATIVE_INFINITY;
    let bottom = rootRect?.bottom ?? Number.NEGATIVE_INFINITY;
    let portalCount = 0;

    for (const child of document.body.children) {
      if (child === rootHost || !(child instanceof HTMLElement)) continue;
      // A portal wrapper is often a bare div with no box of its own, so the
      // subtree is what has to be measured, not the container. A positioned
      // element's rect already encloses its in-flow descendants.
      let painted = false;
      for (const element of [child, ...child.querySelectorAll('*')]) {
        const rect = areaOf(element);
        if (rect === null || !isOverlay(element, rect)) continue;
        painted = true;
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
      }
      if (painted) portalCount += 1;
    }

    const toRect = (rect: DOMRect): Rect => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });

    return {
      root: rootRect === null ? null : toRect(rootRect),
      union:
        right <= left || bottom <= top
          ? null
          : { x: left, y: top, width: right - left, height: bottom - top },
      portalCount,
    };
  });
}

/**
 * Waits until the story has stopped moving. Fonts, images and a couple of
 * frames cover the common case; the box-stability poll catches the components
 * that lay themselves out asynchronously (CodeMirror, the calendar grid) and
 * the popovers that floating-ui positions a frame or two after mount.
 */
async function waitForStorySettled(page: Page): Promise<CaptureRegion> {
  const root = page.locator('#storybook-root');
  await root.waitFor({ state: 'attached', timeout: 30_000 });

  // The root element is in the HTML shell before the story mounts into it, so
  // an empty root means "not rendered yet", not "this story renders nothing".
  // Without this gate the poll below settles on an empty box and the capture
  // silently falls back to a full-viewport screenshot.
  await page
    .waitForFunction(
      () =>
        (document.querySelector('#storybook-root')?.childElementCount ?? 0) > 0,
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => {
      // Portal-only stories legitimately leave the root empty.
    });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (image) => {
        if (image.complete) return;
        await image.decode().catch(() => undefined);
      }),
    );
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            resolve();
          }),
        );
      }),
  );

  // The box must hold still for a window, not merely for a couple of reads.
  // `Loader` renders an empty zero-height div for its first 300ms before
  // swapping in the dots, and a shorter check settles on the empty one often
  // enough to make the same story disagree between two runs.
  // The union is polled rather than the root alone, so an overlay still being
  // positioned counts as movement.
  let previous: string | null = null;
  let stableReads = 0;
  let region = await measureCaptureRegion(page);
  for (let attempt = 0; attempt < SETTLE_MAX_READS; attempt++) {
    const current = JSON.stringify(region);
    stableReads = current === previous ? stableReads + 1 : 0;
    if (stableReads >= SETTLE_STABLE_READS) return region;
    previous = current;
    await page.waitForTimeout(SETTLE_POLL_MS);
    region = await measureCaptureRegion(page);
  }
  return region;
}

/** Playwright rejects a clip that leaves the viewport, so trim it to fit. */
function clampToViewport(rect: Rect): Rect | null {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const right = Math.min(VIEWPORT.width, Math.ceil(rect.x + rect.width));
  const bottom = Math.min(VIEWPORT.height, Math.ceil(rect.y + rect.height));
  if (right - x < 1 || bottom - y < 1) return null;
  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Storybook mounts the story asynchronously after `load`, so a render error can
 * surface either side of the settle wait. Its display is positioned, which the
 * capture region would otherwise measure as story content.
 */
async function throwIfStoryErrored(page: Page): Promise<void> {
  const errorText = await page
    .locator('#error-message')
    .textContent({ timeout: 500 })
    .catch(() => null);
  if (errorText !== null && errorText.trim() !== '') {
    throw new Error(
      `story failed to render: ${errorText.trim().split('\n')[0]}`,
    );
  }
}

async function captureStory(
  page: Page,
  origin: string,
  theme: 'light' | 'dark',
  story: StoryEntry,
  outDir: string,
): Promise<void> {
  const url = `${origin}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story&globals=theme:${theme}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await throwIfStoryErrored(page);

  await page.addStyleTag({ content: FREEZE_CSS });
  const region = await waitForStorySettled(page);
  await throwIfStoryErrored(page);
  const target = path.join(outDir, storyIdToFilename(story.id));

  // Portalled content is clipped in viewport coordinates, since overlays are
  // positioned relative to the viewport rather than the document.
  if (region.portalCount > 0 && region.union !== null) {
    const clip = clampToViewport(region.union);
    if (clip !== null) {
      await page.screenshot({ path: target, clip });
      return;
    }
  }

  // No portal: screenshot the element itself, which unlike a clip still
  // captures a story taller than the viewport.
  if (region.root !== null) {
    await page.locator('#storybook-root').screenshot({ path: target });
    return;
  }

  await page.screenshot({ path: target });
}

async function captureAll(
  browser: Browser,
  origin: string,
  options: { theme: 'light' | 'dark'; concurrency: number; out: string },
  stories: StoryEntry[],
): Promise<string[]> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    reducedMotion: 'reduce',
    colorScheme: options.theme,
  });
  await context.addInitScript((fixedTime: number) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        if (args.length === 0) super(fixedTime);
        else super(...args);
      }
      static override now(): number {
        return fixedTime;
      }
    }
    globalThis.Date = FixedDate as DateConstructor;
  }, FIXED_TIME);

  const failures: string[] = [];
  const queue = [...stories];
  let done = 0;

  const worker = async (): Promise<void> => {
    const page = await context.newPage();
    for (
      let story = queue.shift();
      story !== undefined;
      story = queue.shift()
    ) {
      try {
        await captureStory(page, origin, options.theme, story, options.out);
      } catch (error) {
        failures.push(
          `${story.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      done += 1;
      process.stdout.write(`\r  captured ${done}/${stories.length}`);
    }
    await page.close();
  };

  await Promise.all(
    Array.from(
      { length: Math.min(options.concurrency, stories.length) },
      worker,
    ),
  );
  process.stdout.write('\n');
  await context.close();

  return failures;
}

async function main(): Promise<void> {
  const options = parseCliArgs();

  await buildStorybook(options.reuseBuild);
  await fs.rm(options.out, { recursive: true, force: true });
  await fs.mkdir(options.out, { recursive: true });

  const server = await serveDirectory(BUILD_DIR);
  const browser = await chromium.launch();
  let failures: string[] = [];
  let stories: StoryEntry[] = [];

  try {
    stories = await readStories(server.origin, options.grep);
    if (stories.length === 0) {
      fail(
        options.grep === null
          ? 'The built Storybook contains no stories.'
          : `No stories matched --grep "${options.grep}".`,
      );
    }
    console.info(
      `Capturing ${stories.length} stories (${options.theme} theme) to ${options.out}`,
    );
    failures = await captureAll(browser, server.origin, options, stories);
  } finally {
    await browser.close();
    await server.close();
  }

  const git = await readGitState();
  const manifest: SnapManifest = {
    manifestVersion: MANIFEST_VERSION,
    theme: options.theme,
    grep: options.grep,
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    playwrightVersion: playwrightPackage.version,
    storyCount: stories.length - failures.length,
    gitSha: git.sha,
    gitBranch: git.branch,
    capturedAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(options.out, MANIFEST_FILENAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  if (failures.length > 0) {
    console.error(`\n${failures.length} stories failed to capture:`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }

  console.info(`Done. ${manifest.storyCount} PNGs in ${options.out}`);
}

try {
  await main();
} catch (error) {
  reportFatal(error);
  process.exit(2);
}
