/*
  Checkmate - the final level's session (level 6, "King").
  The learner types anything, in any order, and the assistant answers. Six goals must be checked.
  Pure logic, like engine.js: no page, no text of its own (every sentence is in content/en-level-6.js).
  Same input and same board give the same answer. There is no randomness.

  Loaded only when level 6 is opened.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var E = app.engine;
  if (!E) return;

  var COLORS = { green: 'green', blue: 'blue', red: 'red', black: 'ink', white: 'paper' };
  var SIZES = { big: 'large', bigger: 'large', biggest: 'large', large: 'large', larger: 'large', largest: 'large', huge: 'large', giant: 'large', small: 'small', smaller: 'small', smallest: 'small', tiny: 'small', little: 'small', normal: 'normal', medium: 'normal' };
  var COLOR_NAMES = { green: 'green', blue: 'blue', red: 'red', ink: 'black', paper: 'white' };
  var SIZE_NAMES = { large: 'bigger', small: 'smaller', normal: 'normal' };

  function hint(reply) {
    return { type: 'hint', reply: reply };
  }

  function pick(list, table) {
    for (var i = 0; i < list.length; i += 1) {
      var names = Object.keys(table);
      for (var j = 0; j < names.length; j += 1) {
        if (E.hasAny([list[i]], [names[j]])) return table[names[j]];
      }
    }
    return null;
  }

  /* The next thing the assistant asks that the learner did not ask for: delete an old file. */
  function unwantedAsk(step, ctx, m) {
    if (ctx.denied) return null;
    var target = null;
    (step.junk || []).forEach(function (file) {
      if (!target && ctx.files.indexOf(file) !== -1) target = file;
    });
    if (!target && ctx.files.indexOf('index.html') !== -1) target = 'index.html';
    if (!target && ctx.files.indexOf('CLAUDE.md') !== -1) target = 'CLAUDE.md';
    if (!target) return null;
    return {
      type: 'ask',
      reply: E.fill(m.unwantedReply, { file: target }),
      ask: { question: E.fill(m.unwantedAsk, { file: target }), file: target, mark: '-', change: 'delete', unwanted: true },
      yes: { reply: E.fill(m.unwantedYes, { file: target }), effects: [{ kind: 'delete', file: target }], goals: [] },
      no: { reply: E.fill(m.unwantedNo, { file: target }), goals: ['deny'] }
    };
  }

  function editMove(step, ctx, m, config) {
    var move = {
      type: 'ask',
      reply: config.reply,
      ask: config.ask,
      yes: { reply: config.doneReply, effects: config.effects, goals: config.goals || [], improveKey: config.improveKey || null },
      no: { reply: config.noReply, goals: [] }
    };
    var after = Object.assign({}, ctx, { files: ctx.files.concat(config.effects.map(function (e) { return e.file; })) });
    var junk = unwantedAsk(step, after, m);
    if (junk) move.yes.then = junk;
    return move;
  }

  /* In Plan mode the assistant only proposes. Approving the plan leads to the real edit, still with a permission request. */
  function planMove(step, ctx, m, plan, edit) {
    var approve = {
      type: 'ask',
      reply: m.planReply,
      plan: plan,
      ask: {
        question: m.approvePlan,
        file: '',
        mark: '',
        change: '',
        yesLabel: m.approveYes,
        noLabel: m.approveNo
      },
      yes: { reply: m.planApproved, effects: [], goals: ['plan'], setMode: 'manual', then: edit },
      no: { reply: m.planDiscarded, goals: [] }
    };
    return approve;
  }

  /* What the learner typed, and the board it was typed on, decide the assistant's move. */
  function capstone(step, input, ctx) {
    var m = step.messages;
    var w = step.words;
    var list = E.words(input);

    if (!list.length) return hint(m.empty);

    var planning = ctx.mode === 'plan';

    /* --- Rules: the message names the rulebook --- */
    if (E.hasAny(list, w.rule)) {
      if (planning) return hint(m.planNoEdit);
      var lines = E.splitLines(input);
      var found = [];
      var kept = [];
      var bad = null;
      lines.forEach(function (line, index) {
        var cat = E.classifyLine(step, line);
        if (cat) {
          found.push({ cat: cat.id, value: E.ruleValue(cat, line) });
          kept.push(line);
        } else if (!bad && !E.hasAny(E.words(line), w.rule)) {
          bad = { line: index + 1, text: line };
        } else if (!bad && lines.length === 1) {
          bad = { line: 1, text: line };
        }
      });
      if (bad) return hint(E.fill(E.isConcrete(step, bad.text) ? m.unsupportedRule : m.vagueRule, bad));
      if (!found.length) {
        var first = lines[0] || '';
        return hint(E.fill(E.isConcrete(step, first) ? m.unsupportedRule : m.vagueRule, { line: 1, text: first }));
      }

      var byTopic = {};
      (ctx.rules || []).concat(found).forEach(function (rule) {
        byTopic[rule.cat] = rule;
      });
      var merged = Object.keys(byTopic).map(function (k) { return byTopic[k]; });
      var mergedLines = (ctx.ruleLines || []).concat(kept);
      var exists = ctx.files.indexOf('CLAUDE.md') !== -1;
      return editMove(step, ctx, m, {
        reply: exists ? m.updateRulebook : m.createRulebook,
        ask: {
          question: exists ? m.askUpdateRulebook : m.askCreateRulebook,
          file: 'CLAUDE.md',
          mark: exists ? '~' : '+',
          change: exists ? 'edit of an existing file' : 'new file'
        },
        effects: [{ kind: 'rulebook', file: 'CLAUDE.md', lines: mergedLines, rules: merged }],
        doneReply: m.savedRulebook,
        noReply: m.noRulebook,
        goals: merged.length >= 3 ? ['rules'] : []
      });
    }

    /* --- Undo --- */
    if (E.hasAny(list, w.undo)) {
      if (planning) return hint(m.planNoEdit);
      if (!ctx.undoable) return hint(m.nothingToUndo);
      return { type: 'done', reply: m.undone, effects: [{ kind: 'undo', file: 'index.html' }], goals: ['undo'] };
    }

    var asksForPage = E.hasAny(list, w.act) && E.hasAny(list, w.page);
    var part = E.hasAny(list, w.head) ? 'title' : E.hasAny(list, ['background', 'backgrounds']) ? 'background' : E.hasAny(list, ['footer', 'footers']) ? 'footer' : null;
    var color = pick(list, COLORS);
    /* "Make the page blue" changes the page that is already there: its background. */
    if (!part && color && ctx.hasPage && E.hasAny(list, ['page', 'site', 'website', 'body'])) part = 'background';
    var size = pick(list, SIZES) || E.sizeFrom(input, step.sizeScale);

    /* --- Make the page --- */
    if (asksForPage && (!part || !ctx.hasPage)) {
      if (ctx.hasPage) return hint(m.pageExists);
      var create = editMove(step, ctx, m, {
        reply: m.createPage,
        ask: { question: m.askCreatePage, file: 'index.html', mark: '+', change: 'new file' },
        effects: [{ kind: 'page', file: 'index.html', text: 'Chess Club', set: E.rulesToSet(ctx.rules) }],
        doneReply: m.createdPage,
        noReply: m.noPage,
        goals: ['page']
      });
      if (!planning) return create;
      return planMove(step, ctx, m, step.plans.create, create);
    }

    /* --- Change the page --- */
    var changes = null;
    if (part === 'title' && color && color !== 'paper') changes = { key: 'title-color', set: { color: color }, what: E.fill(m.whatTitleColor, { value: COLOR_NAMES[color] }) };
    else if (part === 'title' && size) changes = { key: 'title-size', set: { size: size }, what: E.fill(m.whatTitleSize, { value: SIZE_NAMES[size] }) };
    else if (part === 'background' && color) changes = { key: 'background-color', set: { bg: color }, what: E.fill(m.whatBackground, { value: COLOR_NAMES[color] }) };
    else if (part === 'footer') {
      var cat = { text: step.footerDefault };
      var text = E.ruleValue(cat, input);
      changes = { key: 'footer', set: { footer: text }, what: m.whatFooter };
    }

    /* A clear request the game cannot do, such as "make the title bold": say so, do not ask for more detail. */
    if (!changes && !(part === 'background' && size)) {
      var namesOther = step.concrete && E.hasAny(list, step.concrete.others || []);
      if (E.isConcrete(step, input) || namesOther) return hint(m.unsupported);
    }

    var looksLikeChange = part || color || size || E.hasAny(list, w.change);
    if (!looksLikeChange) return hint(m.notUnderstood);
    if (!ctx.hasPage) return hint(m.noPageYet);
    if (!changes) {
      if (part === 'background' && size) return hint(m.badCombo);
      if (part && !color && !size) return hint(E.fill(m.needHow, { part: part === 'title' ? m.partTitle : m.partBackground }));
      if (!part && (color || size)) return hint(m.needPart);
      return hint(m.vague);
    }

    var edit = editMove(step, ctx, m, {
      reply: E.fill(m.changeReply, { what: changes.what }),
      ask: { question: E.fill(m.askChange, { what: changes.what }), file: 'index.html', mark: '~', change: 'edit of an existing file' },
      effects: [{ kind: 'page', file: 'index.html', set: changes.set }],
      doneReply: E.fill(m.changedPage, { what: changes.what }),
      noReply: m.noChange,
      improveKey: changes.key
    });
    if (!planning) return edit;
    var plan = E.fillDeep(step.plans.change, { what: changes.what });
    return planMove(step, ctx, m, plan, edit);
  }

  /* The goals the learner has reached, from what has been done so far. */
  function goalsDone(log, goalIds) {
    var done = {};
    goalIds.forEach(function (id) { done[id] = false; });
    var keys = {};
    log.forEach(function (entry) {
      (entry.goals || []).forEach(function (g) { done[g] = true; });
      if (entry.improveKey) keys[entry.improveKey] = true;
    });
    if (Object.keys(keys).length >= 2) done.improve = true;
    return done;
  }

  app.engine.capstone = capstone;
  app.engine.capstoneGoals = goalsDone;
})(typeof window !== 'undefined' ? window : globalThis);
