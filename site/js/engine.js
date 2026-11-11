/*
  Checkmate - the simulated session engine.
  Pure logic: no page, no text of its own. It reads the level descriptions in content/en.js.
  Same input, same result: nothing here is random.

  Also holds the progress store, the only place that touches localStorage.
  Every storage call is wrapped in try/catch, so a blocked or full browser never stops the game.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  var STORAGE_KEY = 'checkmate-progress';
  var STORAGE_VERSION = 1;

  /* ---------- Small helpers ---------- */

  /* Put values into a sentence: "{words}" becomes the value of vars.words. */
  function fill(template, vars) {
    var out = String(template === undefined || template === null ? '' : template);
    var keys = Object.keys(vars || {});
    for (var i = 0; i < keys.length; i += 1) {
      var value = vars[keys[i]];
      if (typeof value === 'object') continue;
      out = out.split('{' + keys[i] + '}').join(String(value));
    }
    return out;
  }

  function fillDeep(value, vars) {
    if (typeof value === 'string') return fill(value, vars);
    if (Array.isArray(value)) return value.map(function (item) { return fillDeep(item, vars); });
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) { out[key] = fillDeep(value[key], vars); });
      return out;
    }
    return value;
  }

  /* ---------- Tiles ---------- */

  /* A tile can name a value from the variant: "$part" means "whatever this variant asks for". */
  function resolve(wanted, variant) {
    if (typeof wanted === 'string' && wanted.charAt(0) === '$') return variant ? variant[wanted.slice(1)] : undefined;
    return wanted;
  }

  /*
    selection: { groupId: optionId | null }
    when:      { groupId: null (nothing chosen) | 'optionId' | '$variantKey' }, a group left out means anything
  */
  function ruleMatches(when, selection, variant) {
    var keys = Object.keys(when || {});
    for (var i = 0; i < keys.length; i += 1) {
      var wanted = resolve(when[keys[i]], variant);
      var chosen = selection && selection[keys[i]] !== undefined ? selection[keys[i]] : null;
      if (wanted === null ? chosen !== null : chosen !== wanted) return false;
    }
    return true;
  }

  /* The key of the first rule that matches, or 'empty' when nothing does. */
  function evaluate(step, selection, variant) {
    var rules = step.rules || [];
    for (var i = 0; i < rules.length; i += 1) {
      if (ruleMatches(rules[i].when, selection, variant)) return rules[i].outcome;
    }
    return 'empty';
  }

  /* Variants come in a fixed order. Each repeat of a check moves to the next one. */
  function variantFor(step, repeats) {
    var list = step.variants && step.variants.length ? step.variants : [{}];
    return list[(repeats || 0) % list.length];
  }

  /* Tiles for a step with the variant's words filled in. */
  function groupsFor(step, variant) {
    return (step.groups || []).map(function (group) {
      return {
        id: group.id,
        label: group.label,
        options: group.options.map(function (option) {
          return { id: option.id, text: fill(option.text, variant) };
        })
      };
    });
  }

  /* The sentence the learner has built, in tile order. */
  function sentence(step, variant, selection) {
    var parts = [];
    groupsFor(step, variant).forEach(function (group) {
      var chosen = selection && selection[group.id];
      group.options.forEach(function (option) {
        if (option.id === chosen) parts.push(option.text);
      });
    });
    return parts.join(' ');
  }

  /* ---------- Free text ---------- */

  function normalize(text) {
    return String(text === undefined || text === null ? '' : text)
      .toLowerCase()
      .replace(/[‘’“”"']/g, ' ')
      .replace(/[^a-z0-9\/\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function words(text) {
    var clean = normalize(text);
    return clean ? clean.split(' ') : [];
  }

  /* Edit distance where swapping two neighbouring letters counts as one slip (the commonest typo). */
  function editDistance(a, b) {
    var table = [];
    var i;
    var j;
    for (i = 0; i <= a.length; i += 1) {
      table.push([i]);
    }
    for (j = 1; j <= b.length; j += 1) table[0][j] = j;
    for (i = 1; i <= a.length; i += 1) {
      for (j = 1; j <= b.length; j += 1) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          table[i][j] = Math.min(table[i][j], table[i - 2][j - 2] + 1);
        }
      }
    }
    return table[a.length][b.length];
  }

  /* Forgiving: the same word, or a word of 5+ letters with one slip (a typo). */
  function near(word, target) {
    if (word === target) return true;
    if (word.length < 5 || target.length < 5) return false;
    return editDistance(word, target) <= 1;
  }

  function hasAny(list, targets) {
    for (var i = 0; i < list.length; i += 1) {
      for (var j = 0; j < targets.length; j += 1) {
        if (near(list[i], targets[j])) return true;
      }
    }
    return false;
  }

  /*
    when: { empty: true } | { all: [[a, b], [c]], none: [[d]] }
    "all": every list needs at least one of its words. "none": no list may have any of its words.
  */
  function textMatches(when, text) {
    var list = words(text);
    if (when && when.empty) return list.length === 0;
    var all = (when && when.all) || [];
    var none = (when && when.none) || [];
    for (var i = 0; i < all.length; i += 1) if (!hasAny(list, all[i])) return false;
    for (var j = 0; j < none.length; j += 1) if (hasAny(list, none[j])) return false;
    return true;
  }

  function evaluateText(step, text) {
    var rules = step.rules || [];
    for (var i = 0; i < rules.length; i += 1) {
      if (textMatches(rules[i].when, text)) return rules[i].outcome;
    }
    return 'empty';
  }

  /* ---------- The rulebook (CLAUDE.md) ---------- */

  function splitLines(text) {
    return String(text === undefined || text === null ? '' : text)
      .split(/\n|;/)
      .map(function (line) { return line.replace(/^[\s\-\*•\d.)]+/, '').trim(); })
      .filter(Boolean);
  }

  function classifyLine(step, line) {
    var cats = step.categories || [];
    for (var i = 0; i < cats.length; i += 1) {
      if (textMatches(cats[i].when, line)) return cats[i];
    }
    return null;
  }

  function firstValue(list, values) {
    var names = Object.keys(values);
    for (var i = 0; i < list.length; i += 1) {
      for (var j = 0; j < names.length; j += 1) {
        if (near(list[i], names[j])) return values[names[j]];
      }
    }
    return null;
  }

  function ruleValue(cat, line) {
    if (cat.values) {
      var list = words(line);
      /* "green on a blue background": the color that belongs to the keyword is the one after it. */
      if (cat.after) {
        for (var k = 0; k < list.length; k += 1) {
          if (hasAny([list[k]], cat.after)) {
            var later = firstValue(list.slice(k + 1), cat.values);
            if (later !== null) return later;
            var earlier = k > 0 ? firstValue([list[k - 1]], cat.values) : null;
            if (earlier !== null) return earlier;
            break;
          }
        }
      }
      var found = firstValue(list, cat.values);
      if (found !== null) return found;
    }
    if (cat.text) {
      var quoted = /[“"]([^“”"]{2,60})[”"]/.exec(line);
      if (quoted) return quoted[1].trim();
      var said = /\bsays?\s+(.{2,60})$/i.exec(line);
      if (said) return said[1].replace(/[\s.!?]+$/, '').trim();
      return cat.text;
    }
    return '';
  }

  /* Reads a rulebook: which line is too vague, which topic is missing, or the rules it holds. */
  function readRulebook(step, variant, text) {
    var lines = splitLines(text);
    if (!lines.length) return { outcome: 'empty', lines: [], rules: [] };

    var rules = [];
    var covered = {};
    for (var i = 0; i < lines.length; i += 1) {
      var cat = classifyLine(step, lines[i]);
      if (!cat) return { outcome: 'vague', lines: lines, rules: rules, vars: { line: i + 1, text: lines[i] } };
      rules.push({ cat: cat.id, value: ruleValue(cat, lines[i]) });
      covered[cat.id] = true;
    }

    var need = (variant && variant.need) || step.need || [];
    for (var n = 0; n < need.length; n += 1) {
      if (!covered[need[n]]) {
        var missing = (step.categories || []).filter(function (c) { return c.id === need[n]; })[0];
        return { outcome: 'missing', lines: lines, rules: rules, vars: { topic: missing ? missing.topic : need[n] } };
      }
    }
    return { outcome: 'good', lines: lines, rules: rules };
  }

  /* A page with no rules, and what each kind of rule changes in it. */
  var BASE_VIEW = { text: 'Chess Club', color: 'ink', bg: 'paper', size: 'normal', footer: '' };

  function rulesToSet(rules) {
    var set = {};
    (rules || []).forEach(function (rule) {
      if (rule.cat === 'color') set.color = rule.value;
      if (rule.cat === 'background') set.bg = rule.value;
      if (rule.cat === 'size') set.size = rule.value;
      if (rule.cat === 'footer') set.footer = rule.value;
    });
    return set;
  }

  /* ---------- Moves ---------- */

  /* Turns the effect templates of an outcome into real effects. */
  function buildEffects(spec, variant, context) {
    var templates = spec.effects || (spec.effect ? [spec.effect] : []);
    return templates.map(function (template) {
      var effect = { kind: template.kind };
      if (template.file !== undefined) effect.file = fill(template.file, variant);
      if (template.text !== undefined) effect.text = fill(template.text, variant);
      if (template.kind === 'page') {
        var set = template.set === 'variant' ? fillDeep((variant && variant.set) || {}, variant) : fillDeep(template.set || {}, variant);
        if (template.applyRules) set = Object.assign({}, rulesToSet(context.rules), set);
        effect.set = set;
      }
      if (template.kind === 'rulebook') {
        effect.lines = context.lines || [];
        effect.rules = context.rules || [];
      }
      return effect;
    });
  }

  function result(key, spec, variant, context) {
    var vars = Object.assign({}, variant || {}, context.vars || {});
    var effects = buildEffects(spec, variant, context);
    return {
      outcome: key,
      type: spec.type || 'hint',
      reply: fill(spec.reply, vars),
      ask: spec.ask
        ? {
            question: fill(spec.ask.question, vars),
            file: fill(spec.ask.file, vars),
            mark: spec.ask.mark || '+',
            change: spec.ask.change || 'new file'
          }
        : null,
      effect: effects[0] || null,
      effects: effects,
      completes: Boolean(spec.completes),
      verdict: fill(spec.verdict, vars)
    };
  }

  /*
    What happens when the learner announces a move.
    input: the tile selection (build), or the typed text (type, rules).
    context: { rules } the rules already in the rulebook.
    Returns { outcome, type, reply, ask, effect, effects, completes, verdict }.
    type is 'hint' (the assistant coaches), 'ask' (it asks permission) or 'done' (it just does it).
  */
  function announce(step, variant, input, context) {
    var ctx = Object.assign({ rules: [] }, context || {});
    var key;
    if (step.kind === 'type') {
      key = evaluateText(step, input);
    } else if (step.kind === 'rules') {
      var read = readRulebook(step, variant, input);
      key = read.outcome;
      ctx.lines = read.lines;
      ctx.vars = read.vars;
      ctx.rules = read.outcome === 'good' ? read.rules : ctx.rules;
    } else {
      key = evaluate(step, input, variant);
    }
    var spec = (step.outcomes && step.outcomes[key]) || {};
    return result(key, spec, variant, ctx);
  }

  /* Check an answer to a multiple-choice question. */
  function answer(step, optionId) {
    var option = null;
    (step.options || []).forEach(function (candidate) {
      if (candidate.id === optionId) option = candidate;
    });
    if (!option) return { right: false, why: '' };
    return { right: Boolean(option.right), why: option.right ? step.rightWhy || '' : option.why || '' };
  }

  /* A review step is a list of requests. This gives request i with the variant's words filled in. */
  function reviewEvent(step, variant, i) {
    var event = (step.events || [])[i];
    return event ? fillDeep(event, variant) : null;
  }

  /* The learner answers a permission request in a review: yes or no. */
  function reviewAnswer(event, choice) {
    var right = choice === event.correct;
    if (!right) return { right: false, reply: event.wrongReply, effects: [] };
    return {
      right: true,
      reply: choice === 'yes' ? event.yesReply : event.noReply,
      effects: choice === 'yes' ? event.yesEffects || [] : []
    };
  }

  /*
    The mastery rule for a check step.
    A check counts only when no hint was used during it. If one was, the check is repeated with the next variant.
  */
  function checkResult(hintsUsedInCheck) {
    return hintsUsedInCheck > 0 ? 'repeat' : 'clean';
  }

  /* ---------- The board ---------- */

  /*
    Replays what has happened, move by move.
    Returns { files, view, before, after, text, rules }:
      files   the files on the board
      view    what the preview shows: { kind: 'page'|'note'|'rulebook'|'none', file, ... }
      before  the page as it was before the last change to it, or null
  */
  function replay(effects) {
    var files = [];
    var stacks = {};
    var rules = [];
    var current = { kind: 'none' };

    function add(file) {
      if (file && files.indexOf(file) === -1) files.push(file);
    }

    (effects || []).forEach(function (effect) {
      if (!effect) return;
      if (effect.kind === 'page') {
        var stack = stacks[effect.file] || [];
        var previous = stack.length ? stack[stack.length - 1] : null;
        var next = Object.assign({}, previous || BASE_VIEW, effect.set || {});
        if (effect.text !== undefined) next.text = effect.text;
        stack.push(next);
        stacks[effect.file] = stack;
        add(effect.file);
        current = { kind: 'page', file: effect.file, page: next, before: previous };
      } else if (effect.kind === 'note') {
        add(effect.file);
        current = { kind: 'note', file: effect.file, text: effect.text };
      } else if (effect.kind === 'rulebook') {
        add(effect.file);
        rules = effect.rules || [];
        current = { kind: 'rulebook', file: effect.file, lines: effect.lines || [] };
      } else if (effect.kind === 'delete') {
        files = files.filter(function (file) { return file !== effect.file; });
        delete stacks[effect.file];
        current = { kind: 'none' };
      } else if (effect.kind === 'undo') {
        var pile = stacks[effect.file] || [];
        if (pile.length > 1) {
          var undone = pile.pop();
          current = { kind: 'page', file: effect.file, page: pile[pile.length - 1], before: undone };
        }
      }
    });

    return { files: files, view: current, rules: rules };
  }

  /* ---------- Progress ---------- */

  function emptyState() {
    return { v: STORAGE_VERSION, passed: {}, stepsDone: {} };
  }

  function cleanState(raw) {
    var state = emptyState();
    if (!raw || typeof raw !== 'object' || raw.v !== STORAGE_VERSION) return state;
    ['passed', 'stepsDone'].forEach(function (name) {
      var source = raw[name];
      if (!source || typeof source !== 'object') return;
      Object.keys(source).forEach(function (id) {
        if (!/^[1-6]$/.test(id)) return;
        if (name === 'passed' && source[id] === true) state.passed[id] = true;
        if (name === 'stepsDone' && typeof source[id] === 'number' && source[id] >= 0 && source[id] <= 9) state.stepsDone[id] = Math.floor(source[id]);
      });
    });
    return state;
  }

  /*
    storage: an object with getItem, setItem and removeItem (window.localStorage), or null.
    A throwing or missing storage still works: progress then lives in memory only.
  */
  function createStore(storage) {
    var state = emptyState();
    var saving = true;

    function read() {
      try {
        var text = storage.getItem(STORAGE_KEY);
        state = text ? cleanState(JSON.parse(text)) : emptyState();
      } catch (error) {
        state = emptyState();
        saving = false;
      }
    }

    function write() {
      if (!storage) return;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        saving = false;
      }
    }

    if (storage) read();
    else saving = false;

    return {
      canSave: function () { return saving; },
      isPassed: function (id) { return state.passed[id] === true; },
      stepsDone: function (id) { return state.stepsDone[id] || 0; },
      /* The mastery rule: a level opens only when the one before it has been passed. */
      isUnlocked: function (id) { return id === 1 || state.passed[id - 1] === true; },
      setStepsDone: function (id, count) {
        if (count > (state.stepsDone[id] || 0)) {
          state.stepsDone[id] = count;
          write();
        }
      },
      markPassed: function (id) {
        state.passed[id] = true;
        write();
      },
      reset: function () {
        state = emptyState();
        if (storage) {
          try {
            storage.removeItem(STORAGE_KEY);
          } catch (error) {
            saving = false;
          }
        }
      }
    };
  }

  /* The browser's storage, or null when the browser does not allow it. */
  function browserStorage() {
    try {
      var probe = root.localStorage;
      if (!probe) return null;
      return probe;
    } catch (error) {
      return null;
    }
  }

  app.engine = {
    STORAGE_KEY: STORAGE_KEY,
    BASE_VIEW: BASE_VIEW,
    fill: fill,
    fillDeep: fillDeep,
    ruleMatches: ruleMatches,
    evaluate: evaluate,
    variantFor: variantFor,
    groupsFor: groupsFor,
    sentence: sentence,
    normalize: normalize,
    textMatches: textMatches,
    evaluateText: evaluateText,
    readRulebook: readRulebook,
    rulesToSet: rulesToSet,
    announce: announce,
    answer: answer,
    reviewEvent: reviewEvent,
    reviewAnswer: reviewAnswer,
    checkResult: checkResult,
    replay: replay,
    createStore: createStore,
    browserStorage: browserStorage
  };
})(typeof window !== 'undefined' ? window : globalThis);
