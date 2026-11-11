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

test('no cookies and no browser storage yet (progress saving arrives in a later milestone)', () => {
  const problems = [];
  for (const file of files.filter((f) => f.endsWith('.js') || f.endsWith('.html'))) {
    const hit = read(file).match(/\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
    if (hit) problems.push(`${rel(file)}: ${hit[0]}`);
  }
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

test('size budget: under 100 KB of JavaScript, and a light first load', () => {
  const size = (filter) => files.filter(filter).reduce((sum, f) => sum + fs.statSync(f).size, 0);
  const js = size((f) => f.endsWith('.js'));
  const landing = size((f) => /index\.html$|\.css$|\.js$|\.woff2$|grain\.png$|favicon\.svg$/.test(f));
  console.log(`JavaScript: ${(js / 1024).toFixed(1)} KB.  Landing page, everything it loads: ${(landing / 1024).toFixed(1)} KB (uncompressed).`);
  assert.ok(js < 100 * 1024, `JavaScript is ${js} bytes`);
  assert.ok(landing < 1024 * 1024, `landing page is ${landing} bytes`);
});
