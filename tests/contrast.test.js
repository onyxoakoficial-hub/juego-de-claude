'use strict';

/*
  Measures the contrast of every colour pair the stylesheets use, in both themes,
  straight from site/css/tokens.css. Run:  node --test
  To print the table only:               node tests/contrast.test.js
*/

const test = require('node:test');
const assert = require('node:assert');
const { readColorTokens } = require('./helpers/tokens');
const { parseOklch, parseSrgb, toHex, over, contrast } = require('./helpers/color');

const TEXT = 4.5; /* WCAG 2.2 AA, normal text */
const UI = 3; /* WCAG 2.2 AA, large text, icons, control edges, focus rings */

/* [foreground, background, minimum, where it is used] */
const PAIRS = [
  ['c-ink', 'c-surface', TEXT, 'body text on the page'],
  ['c-ink', 'c-surface-raised', TEXT, 'text on cards, preview and win card'],
  ['c-ink', 'c-surface-sunk', TEXT, 'the instruction line, code, hover states'],
  ['c-ink-muted', 'c-surface', TEXT, 'secondary text on the page'],
  ['c-ink-muted', 'c-surface-raised', TEXT, 'secondary text on cards'],
  ['c-ink-muted', 'c-surface-sunk', TEXT, 'labels in the instruction line, preview bar'],
  ['c-on-accent', 'c-accent', TEXT, 'primary button'],
  ['c-on-accent', 'c-accent-hover', TEXT, 'primary button, hover'],
  ['c-on-accent', 'c-accent-press', TEXT, 'primary button, pressed'],
  ['c-on-accent-soft', 'c-accent-soft', TEXT, 'selected word tile, permission prompt'],
  ['c-on-band', 'c-band', TEXT, 'text on the dark table and footer'],
  ['c-on-band-muted', 'c-band', TEXT, 'secondary text on the dark table and footer'],
  ['c-accent', 'c-surface', UI, 'check icons, wordmark piece'],
  ['c-accent', 'c-surface-raised', UI, 'current step dot, win mark, reply edge'],
  ['c-accent', 'c-accent-soft', UI, 'edge of a selected word tile and of the prompt'],
  ['c-line-strong', 'c-surface', UI, 'edges of word tiles and dividers'],
  ['c-line-strong', 'c-surface-raised', UI, 'edges of controls on cards'],
  ['c-on-accent-soft', 'c-accent-soft', UI, 'edge of the No button in the prompt'],
  ['c-warn', 'c-surface-raised', UI, 'edge of a hint from the assistant'],
  ['c-error', 'c-surface-raised', TEXT, 'error text (reserved)'],
  ['c-focus', 'c-surface', UI, 'focus ring on the page'],
  ['c-focus', 'c-surface-raised', UI, 'focus ring on cards'],
  ['c-focus', 'c-accent-soft', UI, 'focus ring inside the prompt'],
  ['c-focus-on-band', 'c-band', UI, 'focus ring on the dark table'],
  ['c-piece-light', 'c-square-dark', UI, 'light piece on a dark square'],
  ['c-piece-dark', 'c-square-light', UI, 'dark piece on a light square'],
  ['c-square-light', 'c-band', UI, 'board squares against the table'],
  ['c-on-band', 'c-band', UI, 'file name under the board']
];

const tokens = readColorTokens();

function solid(name, set, backdrop) {
  const colour = parseOklch(set[name]);
  assert.ok(colour, `--${name} is not an OKLCH colour`);
  return colour.a < 1 ? over(colour, backdrop) : colour;
}

for (const theme of ['light', 'dark']) {
  test(`contrast, ${theme} theme`, () => {
    const set = tokens.oklch[theme];
    const rows = [];
    const failures = [];

    for (const [fgName, bgName, min, where] of PAIRS) {
      const bg = solid(bgName, set, { r: 255, g: 255, b: 255, a: 1 });
      const fg = solid(fgName, set, bg);
      const ratio = contrast(fg, bg);
      const ok = ratio >= min;
      rows.push(
        `${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${toHex(fg)} on ${toHex(bg)}  --${fgName} on --${bgName}  [${where}]`
      );
      if (!ok) failures.push(`--${fgName} on --${bgName}: ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }

    console.log(`\nContrast, ${theme} theme\n` + rows.join('\n'));
    assert.deepStrictEqual(failures, []);
  });
}

test('sRGB fallback colours match the OKLCH colours', () => {
  const mismatches = [];
  for (const theme of ['light', 'dark']) {
    const names = Object.keys(tokens.oklch[theme]);
    assert.deepStrictEqual(Object.keys(tokens.fallback[theme]).sort(), names.slice().sort(), `${theme}: token lists differ`);
    for (const name of names) {
      const a = parseOklch(tokens.oklch[theme][name]);
      const b = parseSrgb(tokens.fallback[theme][name]);
      assert.ok(a && b, `--${name} (${theme}) could not be read`);
      const close = Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1 && Math.abs(a.a - b.a) < 0.005;
      if (!close) mismatches.push(`--${name} (${theme}): fallback ${tokens.fallback[theme][name]} should be ${toHex(a)}${a.a < 1 ? ' at alpha ' + a.a : ''}`);
    }
  }
  assert.deepStrictEqual(mismatches, []);
});
