'use strict';

/*
  The lesson data in content/en.js: every level is complete, consistent and honest.
  Written so that levels 2 to 6 are checked automatically as soon as they are added.
*/

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
require(path.join(SITE, 'content', 'en.js'));
require(path.join(SITE, 'content', 'facts.js'));
require(path.join(SITE, 'js', 'engine.js'));

const { content: C, facts, engine: E } = globalThis.CHECKMATE;
const built = Object.keys(C.levels).map(Number);

test('the six levels are listed, in order, one piece each', () => {
  assert.deepStrictEqual(C.levelList.map((l) => l.name), ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);
  assert.deepStrictEqual(C.levelList.map((l) => l.id), [1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(C.levelList.map((l) => l.piece), ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']);
});

test('level 1 is built, and it ends with a check and a question', () => {
  assert.ok(built.includes(1));
  const steps = C.levels[1].steps;
  assert.ok(steps.some((s) => s.check), 'a level needs a mastery check');
  assert.strictEqual(steps[steps.length - 1].kind, 'question', 'the last step is "what did the assistant just do, and why?"');
});

for (const n of built) {
  test(`level ${n}: every step is complete and every rule points to a real answer`, () => {
    for (const step of C.levels[n].steps) {
      assert.ok(step.id && step.name && step.task, `${step.id}: needs id, name and task`);
      if (step.kind === 'question') {
        assert.strictEqual(step.options.filter((o) => o.right).length, 1, `${step.id}: exactly one right answer`);
        for (const o of step.options.filter((x) => !x.right)) assert.ok(o.why, `${step.id}.${o.id}: a wrong answer needs an explanation`);
        continue;
      }
      assert.ok(step.hints && step.hints.length >= 2, `${step.id}: at least two hints, from gentle to direct`);
      assert.ok(step.variants && step.variants.length >= 1);
      if (step.check) assert.ok(step.variants.length >= 3, `${step.id}: a check needs 3 or more variants`);

      const groups = {};
      for (const g of step.groups) groups[g.id] = g.options.map((o) => o.id);
      for (const rule of step.rules) {
        assert.ok(step.outcomes[rule.outcome], `${step.id}: rule points to missing outcome "${rule.outcome}"`);
        for (const [group, wanted] of Object.entries(rule.when)) {
          assert.ok(groups[group], `${step.id}: rule uses unknown group "${group}"`);
          if (wanted !== null) assert.ok(groups[group].includes(wanted), `${step.id}: rule uses unknown tile "${group}.${wanted}"`);
        }
      }
      assert.ok(step.rules.some((r) => Object.keys(r.when).length === 0) || step.outcomes.vague || step.outcomes.good, `${step.id}: has a way to succeed`);
      assert.ok(Object.values(step.outcomes).some((o) => o.completes), `${step.id}: has an outcome that completes the step`);
    }
  });

  test(`level ${n}: nothing the learner reads still has a {placeholder}`, () => {
    for (const step of C.levels[n].steps) {
      if (step.kind === 'question') continue;
      for (const variant of step.variants) {
        const text = [E.fill(step.task, variant)];
        for (const g of E.groupsFor(step, variant)) for (const o of g.options) text.push(o.text);
        for (const spec of Object.values(step.outcomes)) {
          text.push(E.fill(spec.reply, variant), E.fill(spec.verdict, variant));
          if (spec.ask) text.push(E.fill(spec.ask.question, variant), E.fill(spec.ask.file, variant));
          if (spec.effect) text.push(E.fill(spec.effect.text, variant), E.fill(spec.effect.file, variant));
        }
        for (const t of text) assert.ok(!/[{}]/.test(t), `${step.id}: "${t}"`);
      }
    }
  });

  test(`level ${n}: the recap names a concept, a file and the real way to start`, () => {
    const recap = C.levels[n].recap;
    for (const key of ['concept', 'file', 'fileNote', 'realStart', 'next']) assert.ok(recap[key] && recap[key].length > 3, `recap.${key}`);
  });
}

test('the reading level stays plain: short sentences, short words', () => {
  const texts = [];
  const walk = (value) => {
    if (typeof value === 'string') texts.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(C.levels);
  walk(C.ui);
  walk(C.firstWin);
  const long = [];
  for (const t of texts) {
    for (const sentence of t.split(/(?<=[.!?])\s+/)) {
      if (sentence.split(/\s+/).length > 28) long.push(sentence.slice(0, 60));
    }
  }
  assert.deepStrictEqual(long, [], 'sentences over 28 words');
});

test('the real tool is named only with facts that have a documented source', () => {
  const all = JSON.stringify(C.levels);
  assert.ok(!/\/rewind|Shift\+Tab|\/init|Esc/.test(all), 'level 1 must not teach commands that belong to later levels');
  assert.match(C.levels[1].recap.realStart, new RegExp(facts.start.terminalCommand));
  assert.match(C.levels[1].recap.realStart, new RegExp(facts.start.desktopTab));
  assert.match(facts.start.source, /^https:\/\/code\.claude\.com\/docs\/en\//);
  assert.match(facts.start.sourceDesktop, /^https:\/\/code\.claude\.com\/docs\/en\//);
});

test('desktop undo stays out of the game until the owner confirms it', () => {
  assert.strictEqual(facts.undo.desktopControl, null);
  assert.ok(!/desktop/i.test(JSON.stringify(C.levels)) || /Code tab/.test(JSON.stringify(C.levels)), 'desktop may be named only to say how to start');
});
