/** Renders the `report.html` that a human reviews after `storybook:snap:diff`. */

import type { SnapManifest } from './snap-shared.ts';

type StoryStatus = 'changed' | 'added' | 'removed';

export interface ReportStory {
  id: string;
  status: StoryStatus;
  /** Differing pixels, or null when the two images had different dimensions. */
  diffPixels: number | null;
  diffRatio: number | null;
  /** Set only when the dimensions differ, e.g. `320x84 → 320x102`. */
  sizeNote: string | null;
  beforeSrc: string | null;
  afterSrc: string | null;
  diffSrc: string | null;
}

export interface ReportInput {
  beforeDir: string;
  afterDir: string;
  beforeManifest: SnapManifest;
  afterManifest: SnapManifest;
  manifestWarnings: string[];
  stories: ReportStory[];
  unchangedCount: number;
  tolerance: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const STYLES = `
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --panel: #f6f7f9;
  --border: #d8dce3;
  --text: #14161a;
  --muted: #676e7a;
  --accent: #2f6feb;
  --changed: #b3541e;
  --added: #1a7f45;
  --removed: #a32b2b;
  --warning: #8a6100;
  --warning-bg: #fdf6e3;
  --checker: #eceef1;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a;
    --panel: #1d2026;
    --border: #2f343d;
    --text: #e8eaed;
    --muted: #9aa2af;
    --accent: #6ea0ff;
    --changed: #e0913f;
    --added: #5cc98a;
    --removed: #f0787d;
    --warning: #e8c169;
    --warning-bg: #2a2416;
    --checker: #23262c;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 14px 20px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
h1 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
.meta { color: var(--muted); font-size: 12px; }
.meta code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.counts { display: flex; gap: 14px; margin: 8px 0; flex-wrap: wrap; font-size: 13px; }
.counts b { font-variant-numeric: tabular-nums; }
.controls { display: flex; gap: 8px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
button {
  font: inherit;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
}
button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); font-weight: 600; }
input[type="search"] {
  font: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  min-width: 220px;
}
.banner {
  margin: 10px 0 0;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--warning);
  background: var(--warning-bg);
  color: var(--warning);
  font-size: 13px;
}
.banner ul { margin: 4px 0 0; padding-left: 18px; }
main { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.story {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  scroll-margin-top: 150px;
}
.story.is-current { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.story > h2 {
  margin: 0;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
}
.story-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; font-weight: 700; }
.tag.changed { color: var(--changed); }
.tag.added { color: var(--added); }
.tag.removed { color: var(--removed); }
.stat { font-weight: 400; color: var(--muted); font-variant-numeric: tabular-nums; }
.frames { padding: 14px; display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-start; }
figure { margin: 0; }
figcaption { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.shot {
  background-color: var(--checker);
  background-image:
    linear-gradient(45deg, rgba(128,128,128,.16) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(128,128,128,.16) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(128,128,128,.16) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(128,128,128,.16) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  border: 1px solid var(--border);
  display: block;
  max-width: 100%;
}
.stack { position: relative; display: inline-block; }
.stack img { display: block; }
.stack .overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
.missing { padding: 24px; color: var(--muted); font-style: italic; }
.slider { display: flex; align-items: center; gap: 8px; padding: 0 14px 14px; font-size: 12px; color: var(--muted); }
.slider input { flex: 1; max-width: 320px; }
.hint { padding: 12px 20px 28px; color: var(--muted); font-size: 12px; }
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: 4px;
  padding: 0 4px;
}
[hidden] { display: none !important; }
`;

const SCRIPT = String.raw`
let mode = 'side';
let current = 0;

const cards = [...document.querySelectorAll('.story')];

function visibleCards() {
  return cards.filter((card) => !card.hidden);
}

function applyMode() {
  for (const button of document.querySelectorAll('[data-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
  for (const card of cards) {
    // Only a story whose two images share dimensions gets a stack. Size-changed,
    // added and removed cards have none, so they stay on side-by-side in every
    // mode rather than switching to an empty overlay.
    const stack = card.querySelector('[data-frames="stack"]');
    card.querySelector('[data-frames="side"]').hidden =
      stack !== null && mode !== 'side';
    if (stack) stack.hidden = mode === 'side';
    const slider = card.querySelector('[data-slider]');
    if (slider) slider.hidden = mode !== 'onion';
    const overlay = card.querySelector('.overlay');
    if (!overlay) continue;
    if (mode === 'overlay') {
      overlay.src = overlay.dataset.diff ?? overlay.dataset.after;
      overlay.style.opacity = '1';
    } else {
      overlay.src = overlay.dataset.after;
      overlay.style.opacity =
        mode === 'onion'
          ? String(Number(card.querySelector('[data-slider] input').value) / 100)
          : '1';
    }
  }
  stopBlink();
  if (mode === 'blink') startBlink();
}

let blinkTimer = null;
function startBlink() {
  let showAfter = true;
  blinkTimer = setInterval(() => {
    showAfter = !showAfter;
    for (const overlay of document.querySelectorAll('.overlay')) {
      overlay.style.opacity = showAfter ? '1' : '0';
    }
  }, 600);
}
function stopBlink() {
  if (blinkTimer !== null) clearInterval(blinkTimer);
  blinkTimer = null;
}

function setCurrent(index) {
  const visible = visibleCards();
  if (visible.length === 0) return;
  current = Math.max(0, Math.min(index, visible.length - 1));
  for (const card of cards) card.classList.remove('is-current');
  const card = visible[current];
  card.classList.add('is-current');
  card.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function applyFilter(term) {
  const needle = term.trim().toLowerCase();
  for (const card of cards) {
    card.hidden = needle !== '' && !card.dataset.id.toLowerCase().includes(needle);
  }
  current = 0;
}

for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    applyMode();
  });
}
for (const input of document.querySelectorAll('[data-slider] input')) {
  input.addEventListener('input', () => {
    if (mode === 'onion') applyMode();
  });
}
const filter = document.querySelector('#filter');
filter.addEventListener('input', () => applyFilter(filter.value));

document.addEventListener('keydown', (event) => {
  if (event.target === filter) {
    if (event.key === 'Escape') filter.blur();
    return;
  }
  if (event.key === '/') {
    event.preventDefault();
    filter.focus();
    return;
  }
  if (event.key === 'j' || event.key === 'ArrowDown') {
    event.preventDefault();
    setCurrent(current + 1);
  } else if (event.key === 'k' || event.key === 'ArrowUp') {
    event.preventDefault();
    setCurrent(current - 1);
  } else if (['1', '2', '3', '4'].includes(event.key)) {
    mode = ['side', 'overlay', 'onion', 'blink'][Number(event.key) - 1];
    applyMode();
  }
});

applyMode();
`;

function renderFrame(label: string, src: string | null): string {
  const body =
    src === null
      ? `<div class="missing">not present</div>`
      : `<img class="shot" src="${escapeHtml(src)}" alt="${escapeHtml(label)}" loading="lazy">`;
  return `<figure><figcaption>${escapeHtml(label)}</figcaption>${body}</figure>`;
}

function renderStat(story: ReportStory): string {
  if (story.sizeNote !== null) {
    return `<span class="stat">size ${escapeHtml(story.sizeNote)}</span>`;
  }
  if (story.diffPixels === null) return '';
  const ratio =
    story.diffRatio === null ? '' : ` (${(story.diffRatio * 100).toFixed(2)}%)`;
  return `<span class="stat">${story.diffPixels.toLocaleString('en-US')} px${ratio}</span>`;
}

function renderStory(story: ReportStory): string {
  const sideFrames = [
    renderFrame('before', story.beforeSrc),
    renderFrame('after', story.afterSrc),
    ...(story.diffSrc === null ? [] : [renderFrame('diff', story.diffSrc)]),
  ].join('');

  // Onion skin and blink need before and after stacked on the same origin,
  // which only works when the two images actually share dimensions.
  const stack =
    story.status === 'changed' &&
    story.beforeSrc !== null &&
    story.afterSrc !== null &&
    story.sizeNote === null
      ? `<div class="frames" data-frames="stack" hidden><div class="stack">
      <img class="shot" src="${escapeHtml(story.beforeSrc)}" alt="before" loading="lazy">
      <img class="overlay" src="${escapeHtml(story.afterSrc)}" alt="after"
        data-after="${escapeHtml(story.afterSrc)}"
        ${story.diffSrc === null ? '' : `data-diff="${escapeHtml(story.diffSrc)}"`}>
    </div></div>
    <div class="slider" data-slider hidden>
      <label for="onion-${escapeHtml(story.id)}">after opacity</label>
      <input id="onion-${escapeHtml(story.id)}" type="range" min="0" max="100" value="50">
    </div>`
      : '';

  return `<section class="story" data-id="${escapeHtml(story.id)}" data-status="${story.status}">
    <h2>
      <span class="tag ${story.status}">${story.status}</span>
      <span class="story-id">${escapeHtml(story.id)}</span>
      ${renderStat(story)}
    </h2>
    <div class="frames" data-frames="side">${sideFrames}</div>
    ${stack}
  </section>`;
}

export function renderReport(input: ReportInput): string {
  const counts = {
    changed: input.stories.filter((story) => story.status === 'changed').length,
    added: input.stories.filter((story) => story.status === 'added').length,
    removed: input.stories.filter((story) => story.status === 'removed').length,
  };

  const banner =
    input.manifestWarnings.length === 0
      ? ''
      : `<div class="banner"><strong>Worth knowing before you read this:</strong>
        <ul>${input.manifestWarnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul></div>`;

  const body =
    input.stories.length === 0
      ? `<p class="hint">No differences. All ${input.unchangedCount} stories are pixel-identical within the ${input.tolerance}px tolerance.</p>`
      : input.stories.map(renderStory).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Storybook snapshot diff</title>
<style>${STYLES}</style>
</head>
<body>
<header>
  <h1>Storybook snapshot diff</h1>
  <div class="meta">
    before <code>${escapeHtml(input.beforeDir)}</code> (${escapeHtml(input.beforeManifest.gitBranch ?? 'unknown')} @ ${escapeHtml(input.beforeManifest.gitSha ?? 'unknown')})<br>
    after <code>${escapeHtml(input.afterDir)}</code> (${escapeHtml(input.afterManifest.gitBranch ?? 'unknown')} @ ${escapeHtml(input.afterManifest.gitSha ?? 'unknown')})<br>
    ${escapeHtml(input.afterManifest.theme)} theme · ${input.afterManifest.viewport.width}x${input.afterManifest.viewport.height} @${input.afterManifest.deviceScaleFactor}x · tolerance ${input.tolerance}px
  </div>
  <div class="counts">
    <span><b>${counts.changed}</b> changed</span>
    <span><b>${counts.added}</b> added</span>
    <span><b>${counts.removed}</b> removed</span>
    <span><b>${input.unchangedCount}</b> unchanged</span>
  </div>
  <div class="controls">
    <button data-mode="side" aria-pressed="true">Side by side</button>
    <button data-mode="overlay" aria-pressed="false">Diff overlay</button>
    <button data-mode="onion" aria-pressed="false">Onion skin</button>
    <button data-mode="blink" aria-pressed="false">Blink</button>
    <input id="filter" type="search" placeholder="Filter by story id…" autocomplete="off">
  </div>
  ${banner}
</header>
<main>
${body}
</main>
<p class="hint">
  <kbd>j</kbd>/<kbd>k</kbd> next and previous story ·
  <kbd>1</kbd>–<kbd>4</kbd> switch view mode ·
  <kbd>/</kbd> filter.
  Onion skin and blink are the modes that reveal small shifts; the diff mask only shows where they are.
  Overlays are captured when a story opens them &mdash; a story that only renders a trigger shows the trigger.
</p>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
