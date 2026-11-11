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

  /* ---------- Matching ---------- */

  /*
    selection: { groupId: optionId | null }
    when:      { groupId: null (nothing chosen) | 'optionId' (that tile) }, a group left out means anything
  */
  function ruleMatches(when, selection) {
    var keys = Object.keys(when || {});
    for (var i = 0; i < keys.length; i += 1) {
      var wanted = when[keys[i]];
      var chosen = selection && selection[keys[i]] !== undefined ? selection[keys[i]] : null;
      if (wanted === null ? chosen !== null : chosen !== wanted) return false;
    }
    return true;
  }

  /* The key of the first rule that matches, or 'empty' when nothing does. */
  function evaluate(step, selection) {
    var rules = step.rules || [];
    for (var i = 0; i < rules.length; i += 1) {
      if (ruleMatches(rules[i].when, selection)) return rules[i].outcome;
    }
    return 'empty';
  }

  /* Put values into a sentence: "{words}" becomes the value of vars.words. */
  function fill(template, vars) {
    var out = String(template === undefined || template === null ? '' : template);
    var keys = Object.keys(vars || {});
    for (var i = 0; i < keys.length; i += 1) {
      out = out.split('{' + keys[i] + '}').join(String(vars[keys[i]]));
    }
    return out;
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

  /* ---------- Step flow ---------- */

  /*
    What happens when the learner announces a move.
    Returns { outcome, type, reply, ask, effect, completes, verdict }
    type is 'hint' (the assistant coaches, nothing to approve) or 'ask' (the assistant asks permission).
  */
  function announce(step, variant, selection) {
    var key = evaluate(step, selection);
    var spec = (step.outcomes && step.outcomes[key]) || {};
    var vars = variant || {};
    return {
      outcome: key,
      type: spec.type || 'hint',
      reply: fill(spec.reply, vars),
      ask: spec.ask
        ? { question: fill(spec.ask.question, vars), file: fill(spec.ask.file, vars) }
        : null,
      effect: spec.effect
        ? { kind: spec.effect.kind, file: fill(spec.effect.file, vars), text: fill(spec.effect.text, vars) }
        : null,
      completes: Boolean(spec.completes),
      verdict: fill(spec.verdict, vars)
    };
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

  /*
    The mastery rule for a check step.
    A check counts only when no hint was used during it. If one was, the check is repeated with the next variant.
  */
  function checkResult(hintsUsedInCheck) {
    return hintsUsedInCheck > 0 ? 'repeat' : 'clean';
  }

  /* The files on the board after a list of moves (each file once, in the order made). */
  function boardFiles(effects) {
    var seen = {};
    var out = [];
    effects.forEach(function (effect) {
      if (effect && effect.file && !seen[effect.file]) {
        seen[effect.file] = true;
        out.push(effect.file);
      }
    });
    return out;
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
    ruleMatches: ruleMatches,
    evaluate: evaluate,
    fill: fill,
    variantFor: variantFor,
    groupsFor: groupsFor,
    sentence: sentence,
    announce: announce,
    answer: answer,
    checkResult: checkResult,
    boardFiles: boardFiles,
    createStore: createStore,
    browserStorage: browserStorage
  };
})(typeof window !== 'undefined' ? window : globalThis);
