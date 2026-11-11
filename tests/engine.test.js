'use strict';

/*
  The session engine: matching, outcomes, the mastery rule and the progress store.
  Loads the same plain scripts the browser loads.
*/

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
require(path.join(SITE, 'content', 'en.js'));
require(path.join(SITE, 'js', 'engine.js'));

const { engine: E, content: C } = globalThis.CHECKMATE;
const level1 = C.levels[1];
const [first, vague, check, why] = level1.steps;

const pick = (action, object, text) => ({ action, object, text });

test('every combination of tiles in a build step has one fixed outcome', () => {
  for (const step of [first, vague, check]) {
    for (const action of [null, 'make', 'think']) {
      for (const object of [null, 'page', 'something']) {
        for (const text of [null, 'words']) {
          const selection = pick(action, object, text);
          const a = E.evaluate(step, selection);
          const b = E.evaluate(step, selection);
          assert.strictEqual(a, b);
          assert.ok(step.outcomes[a], `${step.id}: outcome "${a}" has no answer for ${JSON.stringify(selection)}`);
        }
      }
    }
  }
});

test('the guided step: only Make + a web page + the words earns a permission request', () => {
  assert.strictEqual(E.evaluate(first, pick(null, null, null)), 'empty');
  assert.strictEqual(E.evaluate(first, pick('think', 'page', 'words')), 'thinkOnly');
  assert.strictEqual(E.evaluate(first, pick(null, 'page', 'words')), 'needAction');
  assert.strictEqual(E.evaluate(first, pick('make', null, 'words')), 'needObject');
  assert.strictEqual(E.evaluate(first, pick('make', 'something', 'words')), 'vagueHere');
  assert.strictEqual(E.evaluate(first, pick('make', 'page', null)), 'needText');
  assert.strictEqual(E.evaluate(first, pick('make', 'page', 'words')), 'good');
});

test('the vague step: "something" gets a guess, an exact instruction is sent back', () => {
  assert.strictEqual(E.evaluate(vague, pick('make', 'something', null)), 'vague');
  assert.strictEqual(E.evaluate(vague, pick('make', 'something', 'words')), 'vague');
  assert.strictEqual(E.evaluate(vague, pick('make', 'page', 'words')), 'tooClear');
  assert.strictEqual(E.evaluate(vague, pick('make', null, null)), 'needObject');
});

test('announce returns the answer, the permission request and the effect, with the words filled in', () => {
  const variant = E.variantFor(check, 0);
  const result = E.announce(check, variant, pick('make', 'page', 'words'));
  assert.strictEqual(result.type, 'ask');
  assert.strictEqual(result.completes, true);
  assert.strictEqual(result.ask.question, 'May I create check.html?');
  assert.strictEqual(result.effect.file, 'check.html');
  assert.strictEqual(result.effect.text, variant.words);
  assert.ok(result.reply.includes(variant.words));
  const strings = [result.reply, result.verdict, result.ask.question, result.ask.file, result.effect.file, result.effect.text];
  for (const text of strings) assert.ok(!/[{}]/.test(text), `a placeholder was left unfilled: ${text}`);
});

test('coaching answers never ask permission and never complete the step', () => {
  for (const step of [first, vague, check]) {
    for (const key of Object.keys(step.outcomes)) {
      const spec = step.outcomes[key];
      if (spec.type === 'hint') {
        assert.ok(!spec.ask && !spec.effect && !spec.completes, `${step.id}.${key} must only coach`);
        assert.ok(spec.reply.length > 20, `${step.id}.${key} needs a real answer`);
      }
    }
  }
});

test('every wrong move says what to try next (never just "incorrect")', () => {
  for (const step of [first, vague, check]) {
    for (const key of Object.keys(step.outcomes)) {
      const spec = step.outcomes[key];
      if (spec.type !== 'hint') continue;
      assert.match(spec.reply, /Tap |tap /, `${step.id}.${key} does not say what to do`);
      assert.ok(!/\bincorrect\b|\bwrong\b/i.test(spec.reply), `${step.id}.${key} just says wrong`);
    }
  }
});

test('check variants come in a fixed order and wrap around', () => {
  const words = [0, 1, 2, 3, 4].map((n) => E.variantFor(check, n).words);
  assert.deepStrictEqual(words, ['Open on Saturday', 'Bring a friend', 'Chess at six', 'Open on Saturday', 'Bring a friend']);
  assert.strictEqual(E.variantFor(first, 7).words, 'Welcome to the club');
});

test('the mastery rule: a hint during a check means the check is repeated', () => {
  assert.strictEqual(E.checkResult(0), 'clean');
  assert.strictEqual(E.checkResult(1), 'repeat');
  assert.strictEqual(E.checkResult(2), 'repeat');
});

test('the question: one right answer, and each wrong one explains itself', () => {
  assert.strictEqual(E.answer(why, 'a').right, true);
  assert.ok(E.answer(why, 'a').why.length > 20);
  for (const id of ['b', 'c']) {
    const result = E.answer(why, id);
    assert.strictEqual(result.right, false);
    assert.ok(result.why.length > 20, `answer ${id} needs an explanation`);
  }
  assert.strictEqual(E.answer(why, 'zzz').right, false);
});

test('sentence follows tile order, whatever order the tiles were tapped in', () => {
  const variant = E.variantFor(first, 0);
  assert.strictEqual(E.sentence(first, variant, pick('make', 'page', 'words')), 'Make a web page that says “Welcome to the club”');
  assert.strictEqual(E.sentence(first, variant, pick(null, null, null)), '');
  assert.strictEqual(E.sentence(first, variant, pick(null, 'page', null)), 'a web page');
});

test('boardFiles lists each file once, in the order it was made', () => {
  assert.deepStrictEqual(
    E.boardFiles([{ file: 'index.html' }, { file: 'note.txt' }, { file: 'index.html' }, null]),
    ['index.html', 'note.txt']
  );
});

/* ---------- Progress store ---------- */

function fakeStorage(initial) {
  const data = Object.assign({}, initial);
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; }
  };
}

test('the mastery rule unlocks levels in order, and only after the one before is passed', () => {
  const store = E.createStore(fakeStorage());
  assert.strictEqual(store.isUnlocked(1), true);
  for (let n = 2; n <= 6; n += 1) assert.strictEqual(store.isUnlocked(n), false, `level ${n} must start locked`);
  store.markPassed(1);
  assert.strictEqual(store.isUnlocked(2), true);
  assert.strictEqual(store.isUnlocked(3), false, 'passing 1 must not open 3');
  assert.strictEqual(store.isPassed(1), true);
});

test('finishing steps alone never passes a level', () => {
  const store = E.createStore(fakeStorage());
  store.setStepsDone(1, 3);
  assert.strictEqual(store.isPassed(1), false);
  assert.strictEqual(store.isUnlocked(2), false);
});

test('progress survives a reload and can only grow', () => {
  const storage = fakeStorage();
  const a = E.createStore(storage);
  a.setStepsDone(1, 2);
  a.setStepsDone(1, 1);
  a.markPassed(1);
  const b = E.createStore(storage);
  assert.strictEqual(b.stepsDone(1), 2);
  assert.strictEqual(b.isPassed(1), true);
});

test('reset erases everything, and leaves nothing in storage', () => {
  const storage = fakeStorage();
  const store = E.createStore(storage);
  store.markPassed(1);
  store.setStepsDone(2, 2);
  store.reset();
  assert.strictEqual(store.isPassed(1), false);
  assert.strictEqual(store.stepsDone(2), 0);
  assert.strictEqual(store.isUnlocked(2), false);
  assert.deepStrictEqual(storage.data, {});
});

test('a blocked or broken storage never stops the game', () => {
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('blocked'); } };
  const store = E.createStore(throwing);
  assert.strictEqual(store.canSave(), false);
  store.markPassed(1);
  assert.strictEqual(store.isPassed(1), true, 'progress still lives in memory');
  store.reset();
  assert.strictEqual(store.isPassed(1), false);
  const none = E.createStore(null);
  assert.strictEqual(none.canSave(), false);
  none.setStepsDone(1, 1);
  assert.strictEqual(none.stepsDone(1), 1);
});

test('saved data that was tampered with is ignored, never trusted', () => {
  const bad = [
    'not json',
    '[]',
    JSON.stringify({ v: 99, passed: { 1: true } }),
    JSON.stringify({ v: 1, passed: { 1: 'yes', 9: true, '__proto__': true }, stepsDone: { 1: -5, 2: 'x', 3: 1e9 } })
  ];
  for (const text of bad) {
    const store = E.createStore(fakeStorage({ [E.STORAGE_KEY]: text }));
    for (let n = 1; n <= 6; n += 1) {
      assert.strictEqual(store.isPassed(n), false);
      assert.strictEqual(store.stepsDone(n), 0);
    }
  }
});
