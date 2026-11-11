'use strict';

/*
  The lesson data in content/en.js: every level is complete, consistent and honest.
  Written so that levels 5 and 6 are checked automatically as soon as they are added.
*/

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
require('./helpers/content').loadContent();
require(path.join(SITE, 'content', 'facts.js'));
require(path.join(SITE, 'js', 'engine.js'));

require('../site/content/en-finale.js');

const { content: C, facts, engine: E } = globalThis.CHECKMATE;
const built = Object.keys(C.levels).map(Number);

/* Words filled in at run time, besides the variant's own. */
const RUNTIME = { line: 2, text: 'x', topic: 'x' };

const leftover = (text) => /[{}]/.test(text);

function allStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}

test('the six levels are listed, in order, one piece each', () => {
  assert.deepStrictEqual(C.levelList.map((l) => l.name), ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);
  assert.deepStrictEqual(C.levelList.map((l) => l.id), [1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(C.levelList.map((l) => l.piece), ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']);
});

test('all six levels are built, and each ends with a check followed by a question', () => {
  assert.deepStrictEqual(built, [1, 2, 3, 4, 5, 6]);
  for (const n of built) {
    const steps = C.levels[n].steps;
    assert.ok(steps.some((s) => s.check), `level ${n} needs a mastery check`);
    assert.strictEqual(steps[steps.length - 1].kind, 'question', `level ${n} must end with "what did the assistant just do, and why?"`);
    assert.ok(steps[steps.length - 2].check, `level ${n}: the check comes right before the question`);
  }
});

test('the level list agrees with the level data: file, step count, and the files exist', () => {
  const fs = require('fs');
  for (const meta of C.levelList) {
    assert.ok(meta.files && meta.files.length, `level ${meta.id} lists no files`);
    assert.ok(meta.files.includes(`content/en-level-${meta.id}.js`), `level ${meta.id} must list its own data file`);
    for (const file of meta.files) assert.ok(fs.existsSync(path.join(SITE, file)), `${file} does not exist`);
    assert.strictEqual(meta.steps, C.levels[meta.id].steps.length, `level ${meta.id}: the list says ${meta.steps} steps`);
  }
});

const CAPSTONE_HINT_MESSAGES = ['empty', 'planNoEdit', 'vagueRule', 'unsupportedRule', 'unsupported', 'nothingToUndo', 'pageExists', 'noPageYet', 'badCombo', 'needHow', 'needPart', 'vague', 'notUnderstood'];
const CAPSTONE_KEYS = [...CAPSTONE_HINT_MESSAGES, 'createRulebook', 'updateRulebook', 'askCreateRulebook', 'askUpdateRulebook', 'savedRulebook', 'noRulebook', 'undone', 'createPage', 'askCreatePage', 'createdPage', 'noPage', 'changeReply', 'askChange', 'changedPage', 'noChange', 'whatTitleColor', 'whatTitleSize', 'whatBackground', 'whatFooter', 'partTitle', 'partBackground', 'planReply', 'approvePlan', 'approveYes', 'approveNo', 'planApproved', 'planDiscarded', 'unwantedReply', 'unwantedAsk', 'unwantedYes', 'unwantedNo'];

for (const n of built) {
  test(`level ${n}: every step is complete and every rule points to a real answer`, () => {
    for (const step of C.levels[n].steps) {
      const where = `level ${n} step ${step.id}`;
      assert.ok(step.id && step.name && step.task, `${where}: needs id, name and task`);

      if (step.kind === 'question') {
        assert.strictEqual(step.options.filter((o) => o.right).length, 1, `${where}: exactly one right answer`);
        for (const o of step.options.filter((x) => !x.right)) assert.ok(o.why && o.why.length > 20, `${where}.${o.id}: a wrong answer needs an explanation`);
        assert.ok(step.rightWhy && step.rightWhy.length > 20, `${where}: explain why the right answer is right`);
        continue;
      }

      if (step.kind === 'capstone') {
        assert.strictEqual(step.hints, undefined, `${where}: the final level has no hints`);
        assert.strictEqual(step.goals.length, 6, `${where}: six goals`);
        assert.deepStrictEqual(step.goals.map((g) => g.id), ['page', 'improve', 'rules', 'deny', 'undo', 'plan']);
        for (const key of CAPSTONE_KEYS) assert.ok(typeof step.messages[key] === 'string' && step.messages[key].length > 3, `${where}: message "${key}" is missing`);
        assert.ok(step.categories.length >= 3 && step.junk.length >= 3 && step.plans.create.items.length && step.plans.change.items.length, `${where}: categories, junk files and plans`);
        assert.ok(step.board.length >= 3, `${where}: the folder starts with old files`);
        assert.ok(step.doneVerdict, `${where}: doneVerdict`);
        continue;
      }
      assert.ok(step.hints && step.hints.length >= 2, `${where}: at least two hints, from gentle to direct`);
      assert.ok(step.variants && step.variants.length >= 1, `${where}: variants`);
      if (step.check) assert.ok(step.variants.length >= 3, `${where}: a check needs 3 or more variants`);

      if (step.kind === 'review') {
        assert.ok(step.events.length >= 1, `${where}: needs requests`);
        for (const event of step.events) {
          if (event.kind === 'ask') {
            assert.ok(['yes', 'no'].includes(event.correct), `${where}: a request needs a right answer`);
            assert.ok(event.wrongReply && event.ask.question, `${where}: a request needs its question and a reply for the wrong answer`);
            assert.ok(event.correct === 'yes' ? event.yesReply : event.noReply, `${where}: a request needs a reply for the right answer`);
          } else {
            assert.strictEqual(event.kind, 'type', `${where}: unknown request kind`);
            for (const rule of event.rules) assert.ok(event.outcomes[rule.outcome], `${where}: rule points to missing outcome "${rule.outcome}"`);
            assert.ok(Object.values(event.outcomes).some((o) => o.completes), `${where}: the typed request must be able to finish`);
          }
        }
        assert.ok(step.doneVerdict, `${where}: doneVerdict`);
        continue;
      }

      if (step.kind === 'rules') {
        assert.ok(step.categories.length >= 3, `${where}: categories`);
        for (const key of ['empty', 'vague', 'good']) assert.ok(step.outcomes[key], `${where}: missing outcome "${key}"`);
        const need = new Set(step.variants.flatMap((v) => v.need || step.need || []));
        for (const id of need) assert.ok(step.categories.some((c) => c.id === id), `${where}: needs unknown topic "${id}"`);
        if (need.size) assert.ok(step.outcomes.missing, `${where}: missing outcome "missing"`);
      } else if (step.kind === 'type') {
        assert.ok(step.rules.length >= 2, `${where}: rules`);
        for (const rule of step.rules) assert.ok(step.outcomes[rule.outcome], `${where}: rule points to missing outcome "${rule.outcome}"`);
        assert.ok(step.rules[step.rules.length - 1].when && Object.keys(step.rules[step.rules.length - 1].when).length === 0, `${where}: the last rule catches everything else`);
      } else {
        assert.strictEqual(step.kind, 'build', `${where}: unknown step kind`);
        const groups = {};
        for (const g of step.groups) groups[g.id] = g.options.map((o) => o.id);
        for (const rule of step.rules) {
          assert.ok(step.outcomes[rule.outcome], `${where}: rule points to missing outcome "${rule.outcome}"`);
          for (const [group, wanted] of Object.entries(rule.when)) {
            assert.ok(groups[group], `${where}: rule uses unknown group "${group}"`);
            if (typeof wanted === 'string' && wanted.startsWith('$')) {
              for (const v of step.variants) assert.ok(groups[group].includes(v[wanted.slice(1)]), `${where}: variant asks for a tile that does not exist`);
            } else if (wanted !== null) {
              assert.ok(groups[group].includes(wanted), `${where}: rule uses unknown tile "${group}.${wanted}"`);
            }
          }
        }
      }
      assert.ok(Object.values(step.outcomes).some((o) => o.completes), `${where}: has an outcome that completes the step`);
    }
  });

  test(`level ${n}: nothing the learner reads still has a {placeholder}`, () => {
    for (const step of C.levels[n].steps) {
      if (step.kind === 'question') continue;
      if (step.kind === 'capstone') {
        const vars = { line: 2, text: 'x', file: 'x', what: 'x', value: 'x', part: 'x' };
        for (const [key, text] of Object.entries(step.messages)) assert.ok(!leftover(E.fill(text, vars)), `level ${n} capstone message ${key}`);
        continue;
      }
      for (const variant of step.variants) {
        const vars = Object.assign({}, variant, RUNTIME);
        const texts = [];
        texts.push(E.fill(step.task, vars), E.fill(step.context, vars));
        if (step.groups) for (const g of E.groupsFor(step, variant)) for (const o of g.options) texts.push(o.text);
        const specs = [];
        if (step.outcomes) specs.push(...Object.values(step.outcomes));
        for (const event of step.events || []) {
          const filled = E.fillDeep(event, vars);
          texts.push(...allStrings(filled).filter((t) => !/^[a-z]+$/.test(t)));
          if (filled.outcomes) specs.push(...Object.values(filled.outcomes));
        }
        for (const spec of specs) {
          texts.push(E.fill(spec.reply, vars), E.fill(spec.verdict, vars));
          if (spec.ask) texts.push(E.fill(spec.ask.question, vars), E.fill(spec.ask.file, vars));
        }
        for (const t of texts) assert.ok(!leftover(t), `level ${n} step ${step.id}: "${t}"`);
      }
    }
    for (const board of C.levels[n].steps.map((s) => s.board).filter(Boolean)) {
      for (const t of allStrings(E.fillDeep(board, { junk: 'x', color: 'x' }))) assert.ok(!leftover(t), `board: ${t}`);
    }
  });

  test(`level ${n}: the recap names a concept, a way to start the real tool and a next piece`, () => {
    const recap = C.levels[n].recap;
    for (const key of n < 6 ? ['concept', 'realStart', 'next'] : ['concept', 'realStart']) assert.ok(recap[key] && recap[key].length > 3, `recap.${key}`);
    assert.ok(recap.items.length >= 1);
    for (const item of recap.items) assert.ok(item.label && item.value, 'each recap item needs a label and a value');
    if (n < 6) assert.strictEqual(recap.next, C.levelList[n].name, `recap of level ${n} must point to the next piece`);
    else assert.strictEqual(recap.next, null, 'the last level has no next piece');
  });

  test(`level ${n}: every wrong move says what to try next (never just "incorrect")`, () => {
    for (const step of C.levels[n].steps) {
      const specs = [];
      if (step.outcomes) specs.push(...Object.entries(step.outcomes).map(([k, v]) => [`${step.id}.${k}`, v]));
      for (const event of step.events || []) {
        if (event.outcomes) specs.push(...Object.entries(event.outcomes).map(([k, v]) => [`${step.id}.event.${k}`, v]));
        if (event.wrongReply) specs.push([`${step.id}.wrongReply`, { type: 'hint', reply: event.wrongReply }]);
      }
      for (const [name, spec] of specs) {
        if (spec.type !== 'hint') continue;
        assert.match(spec.reply, /\b(?:tap|type|write|try|say|read)\b/i, `${name} does not say what to do`);
        assert.ok(!/\bincorrect\b|\bwrong\b/i.test(spec.reply), `${name} just says wrong`);
        assert.ok(spec.reply.length > 20, `${name} needs a real answer`);
      }
    }
  });
}

test('the reading level stays plain: short sentences', () => {
  const long = [];
  for (const t of [...allStrings(C.levels), ...allStrings(C.ui), ...allStrings(C.firstWin)]) {
    for (const sentence of t.split(/(?<=[.!?])\s+/)) {
      if (sentence.split(/\s+/).length > 28) long.push(sentence.slice(0, 60));
    }
  }
  assert.deepStrictEqual(long, [], 'sentences over 28 words');
});

test('every command, key or label the lessons teach appears in facts.js with a documented source', () => {
  const lessons = allStrings(C.levels).join('\n');
  const known = JSON.stringify(facts);
  const mentioned = new Set(lessons.match(/\/[a-z]{3,}\b|Shift\+Tab|Ctrl\+G|\bEsc\b/g) || []);
  assert.ok(mentioned.size >= 5, 'the lessons should mention /init, /rewind, /plan and keys');
  for (const item of mentioned) assert.ok(known.includes(item), `"${item}" is taught but is not in facts.js`);
  for (const label of ['Manual', 'Accept edits', 'Plan', 'Auto']) {
    assert.ok(lessons.includes(label), `mode "${label}" is missing from the lessons`);
    assert.ok(known.includes(label), `mode "${label}" is not in facts.js`);
  }
  for (const group of ['start', 'prompts', 'permissionModes', 'rulebook', 'undo']) {
    assert.match(facts[group].source, /^https:\/\/code\.claude\.com\/docs\/en\//, `${group}: source`);
  }
});

test('level 1 does not teach commands that belong to later levels', () => {
  assert.ok(!/\/rewind|Shift\+Tab|\/init|Esc/.test(JSON.stringify(C.levels[1])));
  assert.match(C.levels[1].recap.realStart, new RegExp(facts.start.terminalCommand));
  assert.match(C.levels[1].recap.realStart, new RegExp(facts.start.desktopTab));
});

test('the mode that asks first is called Manual, as in the official documentation', () => {
  assert.strictEqual(facts.permissionModes.askFirstLabel, 'Manual');
  assert.strictEqual(C.levels[4].steps[0].groups[0].options[0].text, 'Manual');
});

test('desktop undo stays out of the game until the owner confirms it', () => {
  assert.strictEqual(facts.undo.desktopControl, null);
  const lessons = allStrings(C.levels).join('\n');
  assert.ok(!/rewind button|undo button|desktop.{0,30}(undo|rewind)/i.test(lessons), 'no desktop undo control may be described');
  assert.match(lessons, /\/rewind/);
});

test('the two documented limits of undo are taught', () => {
  const recap = JSON.stringify(C.levels[4].recap);
  assert.match(recap, /not files changed only by a command/);
  assert.match(recap, /With text in the box, Esc twice clears the text/);
});

test('level 6: no hints anywhere, and every error says what kind of thing to try, never the answer', () => {
  const step = C.levels[6].steps[0];
  assert.ok(!('hints' in step));
  for (const key of CAPSTONE_HINT_MESSAGES) {
    const text = step.messages[key];
    assert.match(text, /\b(?:say|type|tell|name|switch|try|think|ask|read|make)\b/i, `${key} does not say what to try`);
    assert.ok(!/\bincorrect\b|\bwrong\b/i.test(text), `${key} just says wrong`);
    /* The one sentence that names the kinds of rule the game understands is allowed (owner decision, bug in level 3). */
    const body = text.split('It understands a color, a size, a text and a footer.').join('').split('Try a color, a size, a text, or a footer.').join('');
    for (const giveaway of ['green', 'blue', 'footer', 'CLAUDE.md', 'Plan mode', '/rewind', 'undo that', 'take that back']) {
      assert.ok(!body.toLowerCase().includes(giveaway.toLowerCase()) || key === 'planNoEdit', `${key} gives away "${giveaway}"`);
    }
  }
});

test('level 5 teaches only what the official documentation says about Plan mode', () => {
  const lessons = allStrings(C.levels[5]).join('\n');
  for (const needle of [facts.plan.approveManual, facts.plan.keepPlanning, facts.plan.editInTerminal, '/plan', 'Shift+Tab']) assert.ok(lessons.includes(needle), `level 5 should mention "${needle}"`);
  assert.ok(JSON.stringify(facts.plan).includes('permission-modes'));
  assert.match(C.levels[5].recap.realStart, /wording of these options can differ between versions/);
});

test('the end screen: every command and page is in facts.js, and every link is an official page', () => {
  const F = C.finale;
  const known = facts.finale;
  const urls = new Set();
  const commands = [];
  for (const step of F.checklist.steps) {
    for (const command of step.commands || []) commands.push(command.code);
    for (const link of [step.source, step.extra, ...(step.extras || [])].filter(Boolean)) urls.add(link.url);
    assert.ok(step.source && step.source.url, `step ${step.id} has no official page`);
    assert.ok(step.title && step.body.length, `step ${step.id}: title and text`);
  }
  for (const command of commands) assert.ok(known.commands.includes(command), `"${command}" is not in facts.js`);
  for (const url of urls) {
    assert.match(url, /^https:\/\/code\.claude\.com\/docs\/en\/[a-z-]+$/, url);
    assert.ok(known.pages.includes(url.split('/').pop()), `${url} is not listed in facts.js`);
  }
  assert.strictEqual(F.checklist.checkedOn, facts.checkedOn, 'the checklist date must match facts.js');
});

test('the end screen does not state how to undo in the desktop app, and names no price', () => {
  const text = allStrings(C.finale).join('\n');
  assert.ok(!/desktop.{0,60}(undo|rewind)|(undo|rewind).{0,60}desktop/i.test(text));
  assert.ok(!/[$€£]\s?\d|\bper month\b|\bfree trial\b/i.test(text), 'no prices');
  assert.match(text, /ask the assistant to undo a change/);
  assert.match(text, /\/rewind opens a menu/);
});

test('the end screen says the names of buttons can change, and shows the date it was checked', () => {
  assert.match(C.finale.checklist.lead, /names of buttons can change/);
  assert.match(C.finale.checklist.lead, /\{date\}/);
});
