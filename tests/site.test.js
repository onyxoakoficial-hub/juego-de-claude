'use strict';

/*
  Project rules that can be checked by reading the files in site/:
  nothing loaded from other websites, the unofficial notice on every page,
  one h1 per page, no emoji, dates in step with content/facts.js, the size budget.
*/

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(SITE);
const read = (file) => fs.readFileSync(file, 'utf8');
const rel = (file) => path.relative(SITE, file);
const pages = files.filter((file) => file.endsWith('.html'));

require(path.join(SITE, 'content', 'en.js'));
require(path.join(SITE, 'content', 'facts.js'));
const { facts } = globalThis.CHECKMATE;

test('nothing is loaded from another website', () => {
  const problems = [];
  for (const file of files.filter((f) => /\.(html|css|js|svg)$/.test(f))) {
    const text = read(file);
    const loads = [
      /<(?:script|img|iframe|video|audio|source|embed)\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\//gi,
      /<link\b[^>]*\bhref\s*=\s*["']?(?:https?:)?\/\//gi,
      /url\(\s*["']?(?:https?:)?\/\//gi,
      /@import\s+["'](?:https?:)?\/\//gi,
      /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\b/g
    ];
    for (const pattern of loads) {
      const hit = text.match(pattern);
      if (hit) problems.push(`${rel(file)}: ${hit[0]}`);
    }
  }
  assert.deepStrictEqual(problems, []);
});

test('only the progress store touches browser storage, and nothing else does', () => {
  const problems = [];
  for (const file of files.filter((f) => f.endsWith('.js') || f.endsWith('.html'))) {
    const text = read(file);
    const forbidden = text.match(/\b(?:sessionStorage|indexedDB|document\.cookie|caches\.open|serviceWorker)\b/);
    if (forbidden) problems.push(`${rel(file)}: ${forbidden[0]}`);
    if (/\blocalStorage\b/.test(text) && rel(file) !== path.join('js', 'engine.js')) problems.push(`${rel(file)}: localStorage outside js/engine.js`);
  }
  assert.deepStrictEqual(problems, []);
});

test('every storage call in the engine is inside a try block', () => {
  const code = read(path.join(SITE, 'js', 'engine.js')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const call of ['getItem', 'setItem', 'removeItem', 'root.localStorage']) {
    let at = code.indexOf(call);
    assert.ok(at !== -1, `${call} not found`);
    while (at !== -1) {
      const before = code.slice(0, at);
      const lastTry = before.lastIndexOf('try {');
      const lastCatch = before.lastIndexOf('} catch');
      assert.ok(lastTry > lastCatch, `${call} at offset ${at} is outside a try block`);
      at = code.indexOf(call, at + 1);
    }
  }
});

test('the chess pieces and icons are the same on every page', () => {
  const symbols = (html) => {
    const map = {};
    for (const m of html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)) map[m[1]] = m[0];
    return map;
  };
  const home = symbols(read(path.join(SITE, 'index.html')));
  const play = symbols(read(path.join(SITE, 'play.html')));
  assert.ok(Object.keys(home).length >= 11);
  assert.deepStrictEqual(Object.keys(play).sort(), Object.keys(home).sort(), 'the two pages carry different sets of symbols');
  for (const id of Object.keys(home)) assert.strictEqual(play[id], home[id], `symbol ${id} differs between pages`);
});

test('every icon uses the same 2px round stroke', () => {
  const html = read(path.join(SITE, 'index.html'));
  const icons = [...html.matchAll(/<symbol id="icon-[^"]+"[\s\S]*?<\/symbol>/g)].map((m) => m[0]);
  assert.ok(icons.length >= 5);
  for (const svg of icons) {
    assert.match(svg, /stroke-width="2"/, svg.slice(0, 40));
    assert.match(svg, /stroke-linecap="round"/, svg.slice(0, 40));
  }
});

test('every <use> points to a symbol that exists, and every script and style file exists', () => {
  const problems = [];
  for (const page of pages) {
    const html = read(page);
    const ids = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/<use href="#([^"]+)"/g)) if (!ids.has(m[1])) problems.push(`${rel(page)}: <use #${m[1]}>`);
    for (const m of html.matchAll(/(?:src|href)="((?!https?:|#|mailto:)[^"]+)"/g)) {
      const target = m[1].split('#')[0];
      if (target && !fs.existsSync(path.join(path.dirname(page), target))) problems.push(`${rel(page)}: missing ${m[1]}`);
    }
  }
  assert.deepStrictEqual(problems, []);
});

test('no straight apostrophes or quotes in the visible text', () => {
  const problems = [];
  for (const page of pages) {
    const html = read(page).slice(read(page).indexOf('<header'));
    const text = html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '\n');
    for (const line of text.split('\n')) if (/['"]/.test(line.trim())) problems.push(`${rel(page)}: ${line.trim().slice(0, 60)}`);
  }
  const content = read(path.join(SITE, 'content', 'en.js')).replace(/'(?:[^'\\\n]|\\.)*'/g, (m) => (/[\u2018-\u201D]/.test(m) ? m : m));
  const values = JSON.stringify(globalThis.CHECKMATE.content);
  if (/[a-z]'[a-z]/.test(values)) problems.push('content/en.js: straight apostrophe inside a word');
  assert.deepStrictEqual(problems, []);
});

test('every page carries the unofficial notice, a language and exactly one h1', () => {
  assert.ok(pages.length >= 2);
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<html lang="en">/, `${rel(page)}: missing lang`);
    assert.strictEqual((html.match(/<h1[\s>]/g) || []).length, 1, `${rel(page)}: needs exactly one h1`);
    assert.ok(
      html.includes('Independent, unofficial project. Not affiliated with or endorsed by Anthropic. Claude Code is a trademark of Anthropic, PBC.'),
      `${rel(page)}: missing the unofficial notice`
    );
    assert.match(html, /<title>[^<]{10,70}<\/title>/, `${rel(page)}: title missing or too long`);
    assert.match(html, /<a class="skip-link" href="#main">/, `${rel(page)}: missing skip link`);
  }
});

test('no inline scripts, inline styles or event attributes (keeps a strict security policy possible)', () => {
  for (const page of pages) {
    const html = read(page);
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${rel(page)}: inline script`);
    assert.ok(!/<style[\s>]/i.test(html), `${rel(page)}: inline style block`);
    assert.ok(!/\sstyle\s*=/i.test(html), `${rel(page)}: style attribute`);
    assert.ok(!/\son[a-z]+\s*=\s*["']/i.test(html), `${rel(page)}: event attribute`);
  }
});

test('no emoji anywhere', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const file of files.filter((f) => /\.(html|css|js)$/.test(f))) {
    assert.ok(!emoji.test(read(file)), `${rel(file)}: contains an emoji`);
  }
});

test('the "last checked" date on the landing page matches content/facts.js', () => {
  const html = read(path.join(SITE, 'index.html'));
  const m = /<time datetime="(\d{4}-\d{2}-\d{2})" data-checked-on>([^<]+)<\/time>/.exec(html);
  assert.ok(m, 'landing page: date not found');
  assert.strictEqual(m[1], facts.checkedOn);
  const shown = new Date(facts.checkedOn + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  assert.strictEqual(m[2], shown);
});

test('every fact names its official source, and unverified facts stay out of the game', () => {
  for (const group of ['access', 'permissionModes', 'rulebook', 'undo']) {
    assert.match(facts[group].source, /^https:\/\/code\.claude\.com\/docs\/en\//, `${group}: no source`);
  }
  assert.strictEqual(facts.undo.desktopControl, null, 'desktop undo is not verified: it must stay empty');
});

test('fonts ship with their licences', () => {
  const fonts = files.filter((f) => f.endsWith('.woff2'));
  assert.strictEqual(fonts.length, 2);
  for (const licence of ['OFL-Fraunces.txt', 'OFL-AtkinsonHyperlegibleNext.txt']) {
    assert.match(read(path.join(SITE, 'assets', 'fonts', licence)), /SIL OPEN FONT LICENSE/);
  }
});

test('size budget: every page loads under 100 KB of JavaScript and a light first load', () => {
  const zlib = require('zlib');
  const rows = [];
  for (const page of pages) {
    const html = read(page);
    const scripts = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => path.join(path.dirname(page), m[1]));
    const raw = scripts.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const packed = scripts.reduce((sum, f) => sum + zlib.gzipSync(fs.readFileSync(f), { level: 9 }).length, 0);
    const everything = [page, ...scripts, ...[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => path.join(path.dirname(page), m[1]))]
      .reduce((sum, f) => sum + fs.statSync(f).size, 0) + files.filter((f) => /\.(woff2|png)$/.test(f)).reduce((sum, f) => sum + fs.statSync(f).size, 0);
    rows.push(`${rel(page)}: JavaScript ${(raw / 1024).toFixed(1)} KB raw, ${(packed / 1024).toFixed(1)} KB compressed; whole page ${(everything / 1024).toFixed(0)} KB raw`);
    assert.ok(raw < 100 * 1024, `${rel(page)} loads ${raw} bytes of JavaScript`);
    assert.ok(everything < 1024 * 1024, `${rel(page)} loads ${everything} bytes in total`);
  }
  console.log(rows.join('\n'));
});

test('facts.js is data for the tests and for editing; no page needs to load it', () => {
  for (const page of pages) assert.ok(!read(page).includes('facts.js'), `${rel(page)} loads facts.js for nothing`);
});

test('the landing page promises only levels that exist', () => {
  const html = read(path.join(SITE, 'index.html'));
  const body = html.slice(html.indexOf('<header')).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const levels = globalThis.CHECKMATE.content.levels;
  const list = globalThis.CHECKMATE.content.levelList;
  const builtIds = Object.keys(levels).map(Number);

  assert.strictEqual((html.match(/class="rank__item"/g) || []).length, builtIds.length, 'the landing lists a different number of levels than are built');
  for (const meta of list) {
    const shown = new RegExp(`\\b${meta.name}\\b`).test(body);
    assert.strictEqual(shown, builtIds.includes(meta.id), `${meta.name}: ${shown ? 'is listed but not built' : 'is built but not listed'}`);
  }
  const numbers = ['one', 'two', 'three', 'four', 'five', 'six'];
  for (const word of numbers.filter((_, i) => i + 1 > builtIds.length && i + 1 <= 6)) {
    assert.ok(!new RegExp(`\\b${word}\\s+(?:short\\s+)?(?:levels|pieces|skills|lessons)\\b`, 'i').test(html), `the landing page says "${word}" levels, but only ${builtIds.length} exist`);
  }
  assert.ok(!/first real session|plan before anything/i.test(body), 'the landing page promises a part that does not exist yet');
});

test('the lessons that change a file say so: levels 2 to 4 show what is new and what is changed', () => {
  const levels = globalThis.CHECKMATE.content.levels;
  for (const n of [2, 3, 4]) assert.strictEqual(levels[n].showChanges, true, `level ${n}`);
  assert.ok(!levels[1].showChanges, 'level 1 stays as it was (owner decision)');
  for (const step of levels[2].steps.filter((s) => s.kind === 'build')) {
    const text = JSON.stringify(step.outcomes);
    if (/"ask"/.test(text)) assert.match(text, /existing file/, `level 2 step ${step.id} must say the assistant changes the existing file`);
  }
});
