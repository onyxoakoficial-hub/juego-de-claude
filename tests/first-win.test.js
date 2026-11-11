'use strict';

/*
  The first move on the landing page: every combination of word tiles has one fixed outcome.
  Loads the same plain scripts the browser loads.
*/

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
require(path.join(SITE, 'content', 'en.js'));
require(path.join(SITE, 'js', 'first-win.js'));

const { firstWin, content } = globalThis.CHECKMATE;

test('every combination of tiles gives one fixed outcome', () => {
  const expected = [
    /* action, object, text -> outcome */
    [false, false, false, 'empty'],
    [false, false, true, 'needAction'],
    [false, true, false, 'needAction'],
    [false, true, true, 'needAction'],
    [true, false, false, 'needObject'],
    [true, false, true, 'needObject'],
    [true, true, false, 'askNoText'],
    [true, true, true, 'askWithText']
  ];
  for (const [action, object, text, outcome] of expected) {
    assert.strictEqual(firstWin.evaluate({ action, object, text }), outcome, JSON.stringify({ action, object, text }));
  }
});

test('the same input always gives the same result', () => {
  const slots = { action: true, object: true, text: false };
  const first = firstWin.evaluate(slots);
  for (let i = 0; i < 50; i += 1) assert.strictEqual(firstWin.evaluate(slots), first);
});

test('missing or odd input is treated as no words', () => {
  assert.strictEqual(firstWin.evaluate(undefined), 'empty');
  assert.strictEqual(firstWin.evaluate({}), 'empty');
});

test('every outcome has a written answer', () => {
  for (const outcome of ['empty', 'needAction', 'needObject', 'askWithText', 'askNoText', 'denied', 'done']) {
    const answer = content.firstWin.reply[outcome];
    assert.ok(typeof answer === 'string' && answer.length > 10, `no answer for "${outcome}"`);
  }
});

test('answers that describe the page name its words', () => {
  assert.ok(content.firstWin.reply.askWithText.includes('{text}'));
  assert.ok(content.firstWin.reply.askNoText.includes('{text}'));
  assert.strictEqual(firstWin.fill('It says “{text}”.', 'Hello'), 'It says “Hello”.');
});

test('wrong moves say what to try next', () => {
  for (const outcome of ['empty', 'needAction', 'needObject']) {
    assert.match(content.firstWin.reply[outcome], /Tap /, `"${outcome}" does not say what to do`);
  }
});
