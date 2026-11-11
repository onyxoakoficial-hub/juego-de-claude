'use strict';

/*
  The session engine: matching, outcomes, the mastery rule and the progress store.
  Loads the same plain scripts the browser loads.
*/

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
require('./helpers/content').loadContent();
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

/* ---------- Free text ---------- */

const [l2vague, l2exact, l2check] = C.levels[2].steps;
const [l3plain, l3rule, l3watch, l3check] = C.levels[3].steps;
const [l4mode, l4yes, l4no, l4undo, l4check] = C.levels[4].steps;

const say = (step, text, variant) => E.announce(step, variant || E.variantFor(step, 0), text, { rules: [] });

test('typed words are matched forgivingly: case, punctuation, order, extra words', () => {
  for (const text of ['Make a web page', 'make a web page!!', 'PLEASE CREATE ME A WEBSITE', 'I want you to build a page for my club', 'web page: make it']) {
    assert.strictEqual(say(l3plain, text).outcome, 'good', text);
  }
});

test('typos of five letters or more are forgiven; short words must be exact', () => {
  assert.strictEqual(say(l3plain, 'Make a wesite').outcome, 'good', 'one letter missing');
  assert.strictEqual(say(l3plain, 'Mkae a web page').outcome, 'needAction', 'a short word is not guessed');
  assert.strictEqual(say(l3plain, 'Creaet a webpgae').outcome, 'good', 'two typos, each forgiven');
});

test('typed steps say what is missing instead of failing', () => {
  assert.strictEqual(say(l3plain, '').outcome, 'empty');
  assert.strictEqual(say(l3plain, '   \n ').outcome, 'empty');
  assert.strictEqual(say(l3plain, 'Make something').outcome, 'needObject');
  assert.strictEqual(say(l3plain, 'a web page').outcome, 'needAction');
  assert.strictEqual(say(l3plain, 'hello there').outcome, 'notUnderstood');
});

test('the typed instruction in level 4: the title, the color, or both', () => {
  assert.strictEqual(say(l4yes, 'Make the title green').outcome, 'good');
  assert.strictEqual(say(l4yes, 'turn the heading green please').outcome, 'good');
  assert.strictEqual(say(l4yes, 'Make the title bigger').outcome, 'needColor');
  assert.strictEqual(say(l4yes, 'green').outcome, 'needPart');
  assert.strictEqual(say(l4yes, 'Make the background green').outcome, 'notUnderstood');
});

test('every way to say "take that back" is understood, and "keep it" is not', () => {
  for (const text of ['undo that', 'Undo', 'take that back', 'go back', '/rewind', 'revert the change', 'Please restore it', 'rewind']) {
    assert.strictEqual(say(l4undo, text).outcome, 'good', text);
  }
  for (const text of ['keep it', 'I like it', 'make it blue', '']) {
    assert.notStrictEqual(say(l4undo, text).outcome, 'good', text);
  }
});

test('"mode" tiles: only Manual finishes, and the others explain themselves', () => {
  assert.strictEqual(E.announce(l4mode, {}, { mode: 'manual' }).type, 'done');
  assert.strictEqual(E.announce(l4mode, {}, { mode: 'manual' }).completes, true);
  for (const mode of ['acceptEdits', 'plan', 'auto']) {
    const result = E.announce(l4mode, {}, { mode });
    assert.strictEqual(result.type, 'hint', mode);
    assert.strictEqual(result.completes, false, mode);
  }
  assert.strictEqual(E.announce(l4mode, {}, { mode: null }).outcome, 'empty');
});

/* ---------- Level 2: the title, the background, the color ---------- */

const pick2 = (action, target, how) => ({ action, target, how });

test('level 2: "make it better" gets a fixed guess, an exact instruction is sent back', () => {
  assert.strictEqual(E.evaluate(l2vague, pick2('make', 'it', 'better')), 'vague');
  assert.strictEqual(E.evaluate(l2vague, pick2('make', 'title', 'green')), 'notVague');
  assert.strictEqual(E.evaluate(l2vague, pick2('make', null, 'better')), 'needTarget');
});

test('level 2: only the title in green completes the exact step; vague words are named', () => {
  assert.strictEqual(E.evaluate(l2exact, pick2('make', 'title', 'green')), 'good');
  assert.strictEqual(E.evaluate(l2exact, pick2('make', 'it', 'green')), 'itVague');
  assert.strictEqual(E.evaluate(l2exact, pick2('make', 'title', 'better')), 'betterVague');
  assert.strictEqual(E.evaluate(l2exact, pick2('make', 'background', 'bigger')), 'noSense');
  assert.strictEqual(E.evaluate(l2exact, pick2('make', 'background', 'blue')), 'notThisOne');
});

test('level 2 check: each variant accepts exactly its own change and applies it to the page', () => {
  l2check.variants.forEach((variant) => {
    const good = E.announce(l2check, variant, pick2('make', variant.part, variant.how));
    assert.strictEqual(good.outcome, 'good');
    const world = E.replay([...E.fillDeep(l2check.board, variant), ...good.effects]);
    assert.deepStrictEqual(Object.entries(variant.set).every(([k, v]) => world.view.page[k] === v), true, variant.words);
    assert.ok(world.view.before, 'there is a Before to compare with');
    for (const other of l2check.variants.filter((v) => v !== variant)) {
      if (other.part === variant.part && other.how === variant.how) continue;
      assert.strictEqual(E.announce(l2check, variant, pick2('make', other.part, other.how)).outcome, 'notThisOne');
    }
  });
});

/* ---------- Level 3: the rulebook ---------- */

const lines = (...text) => text.join('\n');
const rb = (step, text, variant) => E.announce(step, variant || E.variantFor(step, 0), text, { rules: [] });

test('level 3: a concrete rule is understood, with its value', () => {
  const read = (text) => E.readRulebook(l3rule, {}, text);
  assert.deepStrictEqual(read('Headings are green.').rules, [{ cat: 'color', value: 'green' }]);
  assert.deepStrictEqual(read('The background is blue').rules, [{ cat: 'background', value: 'blue' }]);
  assert.deepStrictEqual(read('Make the heading bigger').rules, [{ cat: 'size', value: 'large' }]);
  assert.deepStrictEqual(read('Add a footer that says “Made by Sam”').rules, [{ cat: 'footer', value: 'Made by Sam' }]);
  assert.deepStrictEqual(read('Add a footer').rules, [{ cat: 'footer', value: 'Made by the chess club' }]);
  assert.deepStrictEqual(read('Add a footer that says Made by Sam.').rules, [{ cat: 'footer', value: 'Made by Sam' }], 'the full stop is not part of the footer');
});

test('level 3: a color belongs to the part it follows, not to the first color mentioned', () => {
  const read = (text) => E.readRulebook(l3rule, {}, text).rules[0];
  assert.deepStrictEqual(read('Headings are red on a green background'), { cat: 'background', value: 'green' });
});

test('level 3: vague rules are refused, and the line is named', () => {
  for (const text of ['Make it nice', 'Be good', 'Use green', 'Do your best']) {
    const result = rb(l3rule, text);
    assert.strictEqual(result.outcome, 'vague', text);
    assert.match(result.reply, /Rule 1 is too vague/);
    assert.ok(result.reply.includes(text), 'the reply quotes the line');
  }
  const second = rb(l3check, lines('Headings are blue.', 'Make it pretty', 'Footer says hi'));
  assert.match(second.reply, /Rule 2 is too vague/);
});

test('level 3: a missing topic is named, and an empty rulebook is refused', () => {
  assert.strictEqual(rb(l3rule, '').outcome, 'empty');
  const v0 = l3check.variants[0];
  const missing = E.announce(l3check, v0, lines('Headings are blue.', 'The background is green.'), { rules: [] });
  assert.strictEqual(missing.outcome, 'missing');
  assert.match(missing.reply, /a footer line/);
});

test('level 3 check: each variant is solved by rules on separate lines, and also by semicolons or bullets', () => {
  const solutions = [
    lines('Headings are blue.', 'Add a footer that says "Made by the club".', 'The background is green.'),
    lines('- Add a footer that says Made by the club.', '- The background is blue.', '- Make the heading bigger.'),
    'Headings are red; Headings are large; Add a footer saying hello'
  ];
  l3check.variants.forEach((variant, i) => {
    const result = E.announce(l3check, variant, solutions[i], { rules: [] });
    assert.strictEqual(result.outcome, 'good', `variant ${i}: ${result.reply}`);
    assert.strictEqual(result.effects.length, 2);
    assert.strictEqual(result.effects[0].kind, 'rulebook');
    assert.strictEqual(result.effects[0].lines.length, 3);
  });
});

test('level 3: the page follows the rulebook, and shows Before and After', () => {
  const written = E.announce(l3rule, {}, 'Headings are green.', { rules: [] });
  const board = E.fillDeep(l3rule.board, {});
  const afterRule = E.replay([...board, ...written.effects]);
  assert.deepStrictEqual(afterRule.rules, [{ cat: 'color', value: 'green' }]);
  assert.deepStrictEqual(afterRule.files, ['index.html', 'CLAUDE.md']);

  const again = E.announce(l3watch, {}, 'make a web page', { rules: afterRule.rules });
  const world = E.replay([...afterRule.files.length ? [...board, ...written.effects] : [], ...again.effects]);
  assert.strictEqual(world.view.page.color, 'green');
  assert.strictEqual(world.view.before.color, 'ink', 'Before is the plain page');
});

test('level 3: with no rules in the rulebook, the page stays plain', () => {
  const plain = E.announce(l3watch, {}, 'make a web page', { rules: [] });
  assert.deepStrictEqual(plain.effects[0].set, {});
});

/* ---------- Level 4: permission and undo ---------- */

test('level 4: a request is answered yes or no, and a wrong answer says why and changes nothing', () => {
  const event = E.reviewEvent(l4no, {}, 0);
  assert.strictEqual(event.correct, 'no');
  const wrong = E.reviewAnswer(event, 'yes');
  assert.strictEqual(wrong.right, false);
  assert.deepStrictEqual(wrong.effects, []);
  assert.match(wrong.reply, /not for notes\.txt to be deleted/);
  assert.strictEqual(E.reviewAnswer(event, 'no').right, true);
  assert.strictEqual(E.reviewEvent(l4no, {}, 1), null, 'one request only');
});

test('level 4 check: the requests come in a fixed order with the variant\'s words', () => {
  l4check.variants.forEach((variant) => {
    const [first, second, third] = [0, 1, 2].map((i) => E.reviewEvent(l4check, variant, i));
    assert.strictEqual(first.correct, 'no');
    assert.strictEqual(first.ask.file, variant.junk);
    assert.strictEqual(second.correct, 'yes');
    assert.match(second.ask.question, new RegExp(variant.color));
    assert.strictEqual(third.kind, 'type');
    assert.strictEqual(E.reviewEvent(l4check, variant, 3), null);
  });
});

test('level 4: saying no keeps every file; saying yes then undo restores the title', () => {
  const variant = l4check.variants[0];
  const board = E.fillDeep(l4check.board, variant);
  const before = E.replay(board);
  assert.deepStrictEqual(before.files, ['index.html', 'draft.txt']);

  const yes = E.reviewAnswer(E.reviewEvent(l4check, variant, 1), 'yes');
  const changed = E.replay([...board, ...yes.effects]);
  assert.strictEqual(changed.view.page.color, 'blue');

  const undo = E.announce(E.reviewEvent(l4check, variant, 2), variant, 'take that back', { rules: [] });
  assert.strictEqual(undo.outcome, 'good');
  const restored = E.replay([...board, ...yes.effects, ...undo.effects]);
  assert.strictEqual(restored.view.page.color, 'ink', 'the color is back to how it was');
  assert.strictEqual(restored.view.before.color, 'blue', 'Before now shows the undone change');
  assert.deepStrictEqual(restored.files, ['index.html', 'draft.txt'], 'no file was lost');
});

test('undo with nothing to undo changes nothing', () => {
  const world = E.replay([{ kind: 'page', file: 'index.html', text: 'Chess Club' }, { kind: 'undo', file: 'index.html' }]);
  assert.strictEqual(world.view.page.color, 'ink');
  assert.deepStrictEqual(world.files, ['index.html']);
});

test('a deleted file leaves the board, and the preview forgets it', () => {
  const world = E.replay([{ kind: 'page', file: 'a.html', text: 'A' }, { kind: 'note', file: 'b.txt', text: 'B' }, { kind: 'delete', file: 'b.txt' }]);
  assert.deepStrictEqual(world.files, ['a.html']);
  assert.strictEqual(world.view.kind, 'none');
});

/* ---------- Level 5: Plan mode ---------- */

const [l5mode, l5ask, l5edit, l5approve, l5check] = C.levels[5].steps;

test('level 5: only Plan mode finishes the mode step, and every other mode explains itself', () => {
  assert.strictEqual(E.announce(l5mode, {}, { mode: 'plan' }).completes, true);
  for (const mode of ['manual', 'acceptEdits', 'auto']) assert.strictEqual(E.announce(l5mode, {}, { mode }).completes, false, mode);
  assert.match(E.announce(l5mode, {}, { mode: 'auto' }).reply, /background checker/);
});

test('level 5: asking for a plan gives a plan and changes nothing', () => {
  for (const text of ['Plan a schedule page', 'make me a schedule', 'Can you draft a timetable page?', 'build a web page']) {
    const result = say(l5ask, text);
    assert.strictEqual(result.outcome, 'good', text);
    assert.strictEqual(result.type, 'plan');
    assert.deepStrictEqual(result.effects, [], 'a plan must not change a file');
    assert.strictEqual(result.plan.items.length, 4);
  }
  assert.strictEqual(say(l5ask, 'make something').outcome, 'needObject');
  assert.strictEqual(say(l5ask, 'a schedule page').outcome, 'needAction');
  assert.strictEqual(say(l5ask, '').outcome, 'empty');
});

test('level 5: the learner can change the plan in their own words', () => {
  const variant = E.variantFor(l5edit, 0);
  const event = E.reviewEvent(l5edit, variant, 0);
  const edit = (text) => E.announce(event, variant, text, { rules: [] });
  for (const text of ['remove step 4', 'Drop the gallery', 'I do not want the photo gallery', 'take out the last step', 'delete the pictures', 'without photos']) {
    const result = edit(text);
    assert.strictEqual(result.outcome, 'good', text);
    assert.strictEqual(result.plan.items.length, 3);
    assert.ok(!result.plan.items.join(' ').includes('gallery'), 'the unwanted step is gone');
  }
  assert.strictEqual(edit('the gallery').outcome, 'needAction');
  assert.strictEqual(edit('remove step 2').outcome, 'needTarget');
  assert.strictEqual(edit('looks good').outcome, 'notUnderstood');
  assert.strictEqual(edit('').outcome, 'empty');
});

test('level 5: approving a plan still asks before the first edit', () => {
  const [approve, create] = [0, 1].map((i) => E.reviewEvent(l5approve, {}, i));
  assert.strictEqual(approve.ask.yesLabel, 'Yes, manually approve edits');
  assert.strictEqual(approve.ask.noLabel, 'No, keep planning');
  assert.strictEqual(E.reviewAnswer(approve, 'yes').right, true);
  assert.deepStrictEqual(E.reviewAnswer(approve, 'yes').effects, [], 'approving the plan changes no file');
  assert.strictEqual(E.reviewAnswer(approve, 'no').right, false);
  const made = E.reviewAnswer(create, 'yes');
  assert.strictEqual(made.effects[0].file, 'schedule.html');
  assert.strictEqual(E.replay(made.effects).files[0], 'schedule.html');
});

test('level 5 check: each variant has its own plan, its own unwanted step and its own file', () => {
  l5check.variants.forEach((variant) => {
    const [ask, edit, approve, create] = [0, 1, 2, 3].map((i) => E.reviewEvent(l5check, variant, i));
    const plan = E.announce(ask, variant, `plan a ${variant.job}`, { rules: [] });
    assert.strictEqual(plan.outcome, 'good');
    assert.strictEqual(plan.plan.items[0], `Create ${variant.file}`);
    const unwanted = E.announce(edit, variant, `remove the ${variant.extra}`, { rules: [] });
    assert.strictEqual(unwanted.outcome, 'good', variant.job);
    assert.strictEqual(unwanted.plan.items.length, 3);
    assert.strictEqual(E.announce(edit, variant, 'remove step 2', { rules: [] }).outcome, 'needTarget');
    assert.strictEqual(approve.correct, 'yes');
    assert.strictEqual(E.reviewAnswer(create, 'yes').effects[0].file, variant.file);
    assert.strictEqual(E.reviewEvent(l5check, variant, 4), null);
  });
});

/* ---------- Level 6: the final project ---------- */

const cap = C.levels[6].steps[0];

/*
  A small stand-in for the page: it keeps the board, the goals log and the mode, and answers each
  typed line or yes/no the way js/play.js does. Used to play the whole final level with the engine alone.
*/
function playCapstone(step, script, startEffects) {
  const state = { effects: (startEffects && startEffects.length ? startEffects : E.fillDeep(step.board, {})).slice(), log: [], mode: 'manual', pending: null, replies: [] };
  const goalIds = step.goals.map((g) => g.id);
  const context = () => {
    const world = E.replay(state.effects);
    const goals = E.capstoneGoals(state.log, goalIds);
    return { mode: state.mode, files: world.files, hasPage: world.files.includes('index.html'), undoable: world.undoable, rules: world.rules, ruleLines: world.ruleLines, denied: Boolean(goals.deny) };
  };
  const ask = (move, text) => { state.pending = move; state.replies.push(text); };
  const answer = (yes) => {
    const branch = yes ? state.pending.yes : state.pending.no;
    state.pending = null;
    state.effects.push(...(branch.effects || []));
    state.log.push({ goals: branch.goals || [], improveKey: branch.improveKey || null });
    if (branch.setMode) state.mode = branch.setMode;
    state.replies.push(branch.reply);
    if (branch.then) ask(branch.then, branch.reply);
  };
  let index = 0;
  for (const action of script) {
    index += 1;
    if (action.mode) { state.mode = action.mode; continue; }
    if ('yes' in action) { assert.ok(state.pending, `a yes or no needs a request to answer (action ${index}; last replies: ${state.replies.slice(-2).join(' / ')})`); answer(action.yes); continue; }
    assert.ok(!state.pending, `typed "${action.say}" while a request was waiting`);
    const move = E.capstone(step, action.say, context());
    state.replies.push(move.reply);
    if (move.type === 'ask') ask(move, move.reply);
    else if (move.type === 'done') { state.effects.push(...move.effects); state.log.push({ goals: move.goals }); }
  }
  const goals = E.capstoneGoals(state.log, goalIds);
  return { effects: state.effects, goals, all: Object.values(goals).every(Boolean), replies: state.replies, state, context };
}

const CAPSTONE_SOLUTION = [
  { say: 'Make a web page' },
  { yes: true },
  { yes: false },
  { say: 'Make the title green' },
  { yes: true },
  { say: 'Make the background blue' },
  { yes: true },
  { say: 'Add these rules to CLAUDE.md:\nHeadings are red.\nThe background is blue.\nAdd a footer that says Made by the club.' },
  { yes: true },
  { say: 'undo that' },
  { mode: 'plan' },
  { say: 'make the title bigger' },
  { yes: true },
  { yes: true }
];

test('level 6: the whole project can be done, and every goal is reached by the end', () => {
  const played = playCapstone(cap, CAPSTONE_SOLUTION);
  assert.deepStrictEqual(played.goals, { page: true, improve: true, rules: true, deny: true, undo: true, plan: true });
  const world = E.replay(played.effects);
  assert.ok(world.files.includes('index.html') && world.files.includes('CLAUDE.md'));
  assert.deepStrictEqual(world.files.filter((f) => ['notes.txt', 'draft.txt', 'old.html'].includes(f)).length, 3, 'the old files were not deleted: the learner said no');
});

test('level 6: the goals can be done in a different order', () => {
  const shuffled = [
    { say: 'make a page' }, { yes: true }, { yes: false },
    { say: 'Add these rules to CLAUDE.md: Headings are red; The background is blue; Add a footer that says Made by the club' }, { yes: true },
    { mode: 'plan' }, { say: 'make the background green' }, { yes: true }, { yes: true },
    { say: 'Make the title bigger' }, { yes: true },
    { say: 'take that back' }
  ];
  const played = playCapstone(cap, shuffled);
  assert.ok(played.all, JSON.stringify(played.goals));
});

test('level 6: nothing is checked by accident, and the order of goals is free', () => {
  const none = playCapstone(cap, []);
  assert.deepStrictEqual(Object.values(none.goals), [false, false, false, false, false, false]);
  const onlyPage = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }]);
  assert.deepStrictEqual(onlyPage.goals, { page: true, improve: false, rules: false, deny: true, undo: false, plan: false });
});

test('level 6: saying yes to something you did not ask for really does it, and the question comes back', () => {
  const start = [{ say: 'make a web page' }, { yes: true }, { yes: true }];
  const first = playCapstone(cap, start);
  assert.ok(!E.replay(first.effects).files.includes('notes.txt'), 'notes.txt was deleted because the learner said yes');
  assert.strictEqual(first.goals.deny, false, 'saying yes is not saying no');
  assert.strictEqual(first.state.pending, null, 'the question comes back after the next edit, not at once');

  const second = playCapstone(cap, [...start, { say: 'make the title green' }, { yes: true }]);
  assert.match(second.state.pending.ask.question, /draft\.txt/, 'the next unwanted request is about the next old file');

  const all = playCapstone(cap, [
    ...start,
    { say: 'make the title green' }, { yes: true }, { yes: true },
    { say: 'make the title blue' }, { yes: true }, { yes: true },
    { say: 'make the title bigger' }, { yes: true }
  ]);
  const files = E.replay(all.effects).files;
  assert.ok(!files.includes('draft.txt') && !files.includes('old.html'), 'every old file was deleted by yes answers');
  assert.match(all.state.pending.ask.question, /index\.html/, 'when the old files are gone, it asks about the learner\'s own file');
  const refused = playCapstone(cap, [
    ...start,
    { say: 'make the title green' }, { yes: true }, { yes: true },
    { say: 'make the title blue' }, { yes: true }, { yes: true },
    { say: 'make the title bigger' }, { yes: true }, { yes: false }
  ]);
  assert.strictEqual(refused.goals.deny, true, 'it is always possible to say no');
  assert.ok(E.replay(refused.effects).files.includes('index.html'), 'and the learner\'s page is still there');
});

test('level 6: two changes count only when they are different', () => {
  const sameTwice = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }, { say: 'make the title green' }, { yes: true }, { say: 'make the title blue' }, { yes: true }]);
  assert.strictEqual(sameTwice.goals.improve, false, 'the title color twice is one improvement');
  const different = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }, { say: 'make the title green' }, { yes: true }, { say: 'make the title bigger' }, { yes: true }]);
  assert.strictEqual(different.goals.improve, true);
});

test('level 6: three rules are needed, and they can be saved a line at a time', () => {
  const slow = playCapstone(cap, [
    { say: 'make a web page' }, { yes: true }, { yes: false },
    { say: 'Rule: headings are green' }, { yes: true },
    { say: 'Rule: the background is blue' }, { yes: true }
  ]);
  assert.strictEqual(slow.goals.rules, false, 'two rules are not enough');
  const third = playCapstone(cap, [
    { say: 'make a web page' }, { yes: true }, { yes: false },
    { say: 'Rule: headings are green' }, { yes: true },
    { say: 'Rule: the background is blue' }, { yes: true },
    { say: 'Rule: add a footer that says Made by the club' }, { yes: true }
  ]);
  assert.strictEqual(third.goals.rules, true);
  assert.deepStrictEqual(E.replay(third.effects).ruleLines.length, 3, 'the rulebook keeps every line');
  const same = playCapstone(cap, [
    { say: 'make a web page' }, { yes: true }, { yes: false },
    { say: 'Rule: headings are green' }, { yes: true },
    { say: 'Rule: headings are red' }, { yes: true },
    { say: 'Rule: headings are blue' }, { yes: true }
  ]);
  assert.strictEqual(same.goals.rules, false, 'three rules about the same thing are one topic');
});

test('level 6: every mistake gets an answer that says what to try, and changes nothing', () => {
  const reply = (text, mode, setup) => {
    const played = playCapstone(cap, [...(setup || []), { mode: mode || 'manual' }]);
    const move = E.capstone(cap, text, played.context());
    return move;
  };
  const withPage = [{ say: 'make a web page' }, { yes: true }, { yes: false }];
  const cases = [
    ['', null, [], 'empty'],
    ['make the title green', null, [], 'noPageYet'],
    ['undo that', null, [], 'nothingToUndo'],
    ['make a web page', null, withPage, 'pageExists'],
    ['make it better', null, withPage, 'vague'],
    ['change the title', null, withPage, 'needHow'],
    ['make it green', null, withPage, 'needPart'],
    ['make the background bigger', null, withPage, 'badCombo'],
    ['Rule: make it nice', null, withPage, 'vagueRule'],
    ['xyzzy plugh', null, withPage, 'notUnderstood'],
    ['Rule: headings are green', 'plan', withPage, 'planNoEdit'],
    ['undo that', 'plan', withPage, 'planNoEdit']
  ];
  for (const [text, mode, setup, key] of cases) {
    const move = reply(text, mode, setup);
    assert.strictEqual(move.type, 'hint', `"${text}" (${mode || 'manual'})`);
    const expected = cap.messages[key].replace('{line}', '1').replace('{text}', text).replace('{part}', 'title');
    assert.strictEqual(move.reply, expected, `"${text}" should give "${key}"`);
    assert.ok(!move.effects && !move.ask, 'a mistake changes nothing and asks nothing');
  }
});

test('level 6: in Plan mode every request becomes a plan first, and nothing changes until approved', () => {
  const played = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }, { mode: 'plan' }, { say: 'make the title green' }]);
  const move = played.state.pending;
  assert.ok(move.plan && move.plan.items.length === 3);
  assert.strictEqual(move.ask.yesLabel, 'Yes, manually approve edits');
  assert.strictEqual(E.replay(played.effects).view.page.color, 'ink', 'the plan has not changed the page');
  const no = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }, { mode: 'plan' }, { say: 'make the title green' }, { yes: false }]);
  assert.strictEqual(no.goals.plan, false, 'discarding a plan is not approving it');
  assert.strictEqual(E.replay(no.effects).view.page.color, 'ink');
  const yes = playCapstone(cap, [{ say: 'make a web page' }, { yes: true }, { yes: false }, { mode: 'plan' }, { say: 'make the title green' }, { yes: true }]);
  assert.strictEqual(yes.state.mode, 'manual', 'approving a plan leaves Plan mode');
  assert.match(yes.state.pending.ask.question, /May I change/, 'and the first edit is still asked');
});

test('level 6: the same typing on the same board always gives the same answer', () => {
  const a = playCapstone(cap, CAPSTONE_SOLUTION);
  const b = playCapstone(cap, CAPSTONE_SOLUTION);
  assert.deepStrictEqual(a.replies, b.replies);
  assert.deepStrictEqual(a.effects, b.effects);
});

/* ---------- A whole game, played by the engine ---------- */

test('every level can be finished from start to end, step by step, by the engine alone', () => {
  const solved = [];
  const run = (n, answers) => {
    const level = C.levels[n];
    let effects = [];
    level.steps.forEach((step, index) => {
      const variant = E.variantFor(step, 0);
      const key = `${n}.${step.id}`;
      if (step.board) effects = E.fillDeep(step.board, variant).slice();
      const world = () => E.replay(effects);
      if (step.kind === 'question') {
        assert.strictEqual(E.answer(step, answers[key]).right, true, key);
      } else if (step.kind === 'capstone') {
        const played = playCapstone(step, answers[key], effects);
        assert.ok(played.all, `${key}: not every goal was reached: ${JSON.stringify(played.goals)}`);
        effects = played.effects;
      } else if (step.kind === 'review') {
        step.events.forEach((_, i) => {
          const event = E.reviewEvent(step, variant, i);
          if (event.kind === 'ask') {
            const res = E.reviewAnswer(event, answers[key][i]);
            assert.strictEqual(res.right, true, `${key} request ${i + 1}`);
            effects.push(...res.effects);
          } else {
            const res = E.announce(event, variant, answers[key][i], { rules: world().rules });
            assert.strictEqual(res.completes, true, `${key} request ${i + 1}`);
            effects.push(...res.effects);
          }
        });
      } else {
        const res = E.announce(step, variant, answers[key], { rules: world().rules });
        assert.ok(['ask', 'done', 'plan'].includes(res.type), `${key}: ${res.outcome}`);
        assert.strictEqual(res.completes, true, key);
        effects.push(...res.effects);
      }
      solved.push(key);
      assert.ok(index >= 0);
    });
    return E.replay(effects);
  };

  const t = (action, object, text) => ({ action, object, text });
  const c = (action, target, how) => ({ action, target, how });

  run(1, { '1.first': t('make', 'page', 'words'), '1.vague': t('make', 'something', null), '1.check': t('make', 'page', 'words'), '1.why': 'a' });
  run(2, { '2.vague': c('make', 'it', 'better'), '2.exact': c('make', 'title', 'green'), '2.check': c('make', 'title', 'blue'), '2.why': 'a' });
  const l3 = run(3, {
    '3.plain': 'Make a web page',
    '3.first-rule': 'Headings are green.',
    '3.watch': 'make a web page again',
    '3.check': lines('Headings are blue.', 'Add a footer that says "Made by the club".', 'The background is green.'),
    '3.why': 'a'
  });
  assert.strictEqual(l3.view.page.color, 'blue');
  assert.strictEqual(l3.view.page.bg, 'green');
  assert.strictEqual(l3.view.page.footer, 'Made by the club');
  const l4 = run(4, {
    '4.mode': { mode: 'manual' },
    '4.yes': 'Make the title green',
    '4.no': ['no'],
    '4.undo': 'undo that',
    '4.check': ['no', 'yes', 'take that back'],
    '4.why': 'a'
  });
  assert.strictEqual(l4.view.page.color, 'ink');
  const l5 = run(5, {
    '5.mode': { mode: 'plan' },
    '5.ask': 'Plan a schedule page',
    '5.edit': ['remove step 4'],
    '5.approve': ['yes', 'yes'],
    '5.check': ['plan a contact page', 'I do not want the map', 'yes', 'yes'],
    '5.why': 'a'
  });
  assert.deepStrictEqual(l5.files, ['index.html', 'schedule.html', 'contact.html'].filter((f) => l5.files.includes(f)));
  const l6 = run(6, { '6.build': CAPSTONE_SOLUTION, '6.why': 'a' });
  assert.ok(l6.files.includes('CLAUDE.md') && l6.files.includes('index.html'));
  assert.strictEqual(solved.length, 4 + 4 + 5 + 6 + 6 + 2, 'every step of every level was played');
});

test('replay tells which files a move made new and which it changed', () => {
  const seed = [{ kind: 'page', file: 'index.html', text: 'Chess Club' }, { kind: 'note', file: 'notes.txt', text: 'x' }];
  const moves = [
    { kind: 'page', file: 'index.html', set: { color: 'green' } },
    { kind: 'rulebook', file: 'CLAUDE.md', lines: [], rules: [] },
    { kind: 'page', file: 'rules.html', text: 'Chess Club' },
    { kind: 'page', file: 'rules.html', set: { bg: 'blue' } }
  ];
  const world = E.replay([...seed, ...moves], seed.length);
  assert.deepStrictEqual(world.edited, ['index.html']);
  assert.deepStrictEqual(world.created.sort(), ['CLAUDE.md', 'rules.html']);
  const none = E.replay(seed, seed.length);
  assert.deepStrictEqual([none.created, none.edited], [[], []], 'the starting board has nothing marked');
  const undone = E.replay([...seed, { kind: 'page', file: 'index.html', set: { color: 'red' } }, { kind: 'undo', file: 'index.html' }], seed.length);
  assert.deepStrictEqual(undone.edited, ['index.html']);
});
