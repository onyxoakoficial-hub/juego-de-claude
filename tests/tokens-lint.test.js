'use strict';

/*
  Design rule: every colour, size, space, radius, shadow and duration is a token.
  This test reads every stylesheet except tokens.css and fails on a raw value.
*/

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'site', 'css');

/* Values that are not design decisions. */
const ALLOWED = new Set(['0', '100%', '50%', '-100%', '0%']);

function withoutIgnoredParts(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') /* comments */
    .replace(/@font-face\s*\{[^}]*\}/g, '') /* font metrics are not design values */
    .replace(/@media[^{]*\{/g, '@media {') /* breakpoints cannot be custom properties */
    .replace(/env\([^)]*\)/g, 'env()'); /* safe-area fallbacks */
}

function rawValues(css) {
  const found = [];
  const clean = withoutIgnoredParts(css);
  const declaration = /([a-z-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = declaration.exec(clean))) {
    const property = m[1];
    const value = m[2];

    if (/#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/i.test(value)) {
      found.push(`${property}: ${value.trim()}  (raw colour)`);
      continue;
    }

    const numbers = value.match(/-?\d*\.?\d+(?:px|rem|em|ch|vw|vh|dvh|svh|ms|s|deg|%)(?![\w-])/g) || [];
    for (const number of numbers) {
      if (!ALLOWED.has(number)) found.push(`${property}: ${value.trim()}  (raw ${number})`);
    }
  }
  return found;
}

test('stylesheets use tokens only', () => {
  const problems = [];
  for (const file of fs.readdirSync(CSS_DIR)) {
    if (!file.endsWith('.css') || file === 'tokens.css') continue;
    for (const problem of rawValues(fs.readFileSync(path.join(CSS_DIR, file), 'utf8'))) {
      problems.push(`${file}: ${problem}`);
    }
  }
  assert.deepStrictEqual(problems, []);
});

test('the lint itself catches raw values', () => {
  assert.strictEqual(rawValues('.a { color: #fff; }').length, 1);
  assert.strictEqual(rawValues('.a { margin: 12px; }').length, 1);
  assert.strictEqual(rawValues('.a { transition: opacity 200ms; }').length, 1);
  assert.strictEqual(rawValues('.a { margin: var(--sp-3); width: 100%; inset: 0; }').length, 0);
});
