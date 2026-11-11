/*
  Checkmate - the level page: the level map and one level at a time.
  This file only draws the page and moves between states. The rules live in js/engine.js,
  and every word the learner reads lives in content/en.js. Nothing here contains wording.
  Text is always written with textContent, never as HTML.
*/
(function (root) {
  'use strict';

  var app = root.CHECKMATE;
  var doc = root.document;
  if (!doc || !app || !app.engine || !app.content) return;

  var E = app.engine;
  var C = app.content;
  var U = C.ui;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var store = E.createStore(E.browserStorage());

  var page = {
    back: doc.querySelector('[data-back]'),
    backText: doc.querySelector('[data-back-text]'),
    eyebrow: doc.querySelector('[data-eyebrow]'),
    title: doc.querySelector('[data-title]'),
    lead: doc.querySelector('[data-lead]'),
    mapView: doc.querySelector('[data-view="map"]'),
    levelView: doc.querySelector('[data-view="level"]')
  };

  function $(selector, scope) {
    return (scope || doc).querySelector(selector);
  }

  function show(node, visible) {
    if (visible) node.removeAttribute('hidden');
    else node.setAttribute('hidden', '');
  }

  function put(node, text) {
    node.textContent = text;
  }

  function make(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(id, className) {
    var svg = doc.createElementNS(SVG_NS, 'svg');
    var use = doc.createElementNS(SVG_NS, 'use');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (className) svg.setAttribute('class', className);
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function piece(name, className) {
    var svg = icon('piece-' + name, className || 'piece');
    svg.setAttribute('fill', 'currentColor');
    return svg;
  }

  function reducedMotion() {
    return Boolean(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function reveal(node) {
    node.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  function levelMeta(n) {
    return C.levelList[n - 1];
  }

  function isBuilt(n) {
    return Boolean(C.levels[n]);
  }

  /* ---------- Route ---------- */

  var selectedLevel = 1;
  var message = '';

  function route() {
    var hash = root.location.hash.replace('#', '');
    var n = /^[1-6]$/.test(hash) ? Number(hash) : 0;

    if (n && store.isUnlocked(n) && isBuilt(n)) {
      showLevel(n);
      return;
    }
    if (n) {
      selectedLevel = n;
      message = store.isUnlocked(n) ? U.comingSoon : E.fill(U.lockedLevel, { n: n - 1 });
    }
    showMap();
  }

  function setHead(eyebrow, title, lead, back) {
    put(page.eyebrow, eyebrow);
    put(page.title, title);
    put(page.lead, lead);
    show(page.lead, Boolean(lead));
    put(page.backText, back.text);
    page.back.setAttribute('href', back.href);
  }

  /* ---------- Level map ---------- */

  function firstOpenLevel() {
    for (var n = 1; n <= C.levelList.length; n += 1) {
      if (store.isUnlocked(n) && isBuilt(n) && !store.isPassed(n)) return n;
    }
    return 1;
  }

  function levelState(n) {
    if (store.isPassed(n)) return 'passed';
    if (!store.isUnlocked(n)) return 'locked';
    return isBuilt(n) ? 'ready' : 'soon';
  }

  function statusWord(state) {
    return { passed: U.statusPassed, ready: U.statusReady, locked: U.statusLocked, soon: U.statusSoon }[state];
  }

  /* How high the piece stands on its file: 0 at the bottom, 3 at the top. */
  function rankOf(n) {
    if (store.isPassed(n)) return 3;
    return Math.min(store.stepsDone(n), 2);
  }

  function showMap() {
    document.title = U.pageTitle;
    setHead(U.mapEyebrow, U.mapTitle, U.mapLead, { text: 'Home', href: 'index.html' });
    show(page.levelView, false);
    show(page.mapView, true);

    var map = $('[data-map]', page.mapView);
    map.textContent = '';
    map.setAttribute('role', 'group');
    map.setAttribute('aria-label', U.mapTitle);

    C.levelList.forEach(function (meta) {
      var state = levelState(meta.id);
      var file = make('button', 'map__file');
      file.type = 'button';
      file.setAttribute('data-state', state);
      file.setAttribute('aria-pressed', meta.id === selectedLevel ? 'true' : 'false');
      file.setAttribute('aria-label', E.fill(U.mapFileLabel, { n: meta.id, name: meta.name, status: statusWord(state) }));

      for (var row = 0; row < 4; row += 1) {
        var square = make('span', 'sq');
        square.setAttribute('aria-hidden', 'true');
        if (row === 3 - rankOf(meta.id)) square.appendChild(piece(meta.piece));
        file.appendChild(square);
      }

      if (state !== 'ready') {
        var badge = icon(state === 'passed' ? 'icon-check' : 'icon-lock', 'map__badge');
        file.appendChild(badge);
      }

      file.addEventListener('click', function () {
        selectedLevel = meta.id;
        message = '';
        showMap();
        var again = $('[data-map] .map__file[aria-pressed="true"]', page.mapView);
        if (again) again.focus({ preventScroll: true });
      });
      map.appendChild(file);
    });

    put($('[data-map-key]', page.mapView), U.mapKey);
    renderLevelCard();

    put($('[data-privacy]', page.mapView), U.privacy);
    var warning = $('[data-storage-warning]', page.mapView);
    put(warning, U.storageOff);
    show(warning, !store.canSave());
    put($('[data-reset-open]', page.mapView), U.resetButton);
    put($('[data-reset-question]', page.mapView), U.resetAsk);
    put($('[data-reset-yes]', page.mapView), U.resetConfirm);
    put($('[data-reset-no]', page.mapView), U.resetKeep);
    show($('[data-reset-ask]', page.mapView), false);
  }

  function renderLevelCard() {
    var meta = levelMeta(selectedLevel);
    var state = levelState(selectedLevel);
    put($('[data-card-title]', page.mapView), 'Level ' + meta.id + ': ' + meta.name + ' — ' + meta.move);
    put($('[data-card-blurb]', page.mapView), meta.blurb);

    var status;
    if (message) status = message;
    else if (state === 'passed') status = U.levelPassedStatus;
    else if (state === 'locked') status = E.fill(U.lockedLevel, { n: meta.id - 1 });
    else if (state === 'soon') status = U.comingSoon;
    else {
      var total = C.levels[meta.id].steps.length;
      status = store.stepsDone(meta.id) > 0
        ? E.fill(U.levelStatusSteps, { done: store.stepsDone(meta.id), total: total })
        : U.levelOpenStatus;
    }
    put($('[data-card-status]', page.mapView), status);

    var play = $('[data-card-play]', page.mapView);
    var playable = state === 'ready' || state === 'passed';
    show(play, playable);
    if (playable) {
      play.setAttribute('href', '#' + meta.id);
      put(play, E.fill(state === 'passed' ? U.replayLevel : U.playLevel, { n: meta.id }));
    }
  }

  function setupReset() {
    var open = $('[data-reset-open]', page.mapView);
    var ask = $('[data-reset-ask]', page.mapView);
    var done = $('[data-reset-done]', page.mapView);

    open.addEventListener('click', function () {
      show(ask, true);
      put(done, '');
      $('[data-reset-no]', page.mapView).focus();
    });
    $('[data-reset-no]', page.mapView).addEventListener('click', function () {
      show(ask, false);
      open.focus();
    });
    $('[data-reset-yes]', page.mapView).addEventListener('click', function () {
      store.reset();
      selectedLevel = 1;
      message = '';
      showMap();
      put(done, U.resetDone);
      $('[data-reset-open]', page.mapView).focus();
    });
  }

  /* ---------- One level ---------- */

  var el = {};
  ['stepline', 'track', 'nextline', 'context', 'task', 'build', 'say-label', 'say', 'groups', 'actions', 'announce',
    'hint-button', 'hint', 'hint-label', 'hint-text', 'hint-note', 'reply', 'reply-who', 'reply-text', 'ask', 'ask-title',
    'ask-question', 'ask-file', 'ask-kind', 'yes', 'no', 'verdict', 'verdict-text', 'verdict-next', 'question', 'options',
    'question-feedback', 'recap', 'recap-title', 'recap-concept-label', 'recap-concept', 'recap-file-label', 'recap-file',
    'recap-file-note', 'recap-real-label', 'recap-real', 'recap-next-label', 'recap-next', 'recap-map', 'live', 'board-label',
    'board-note', 'board', 'board-status', 'preview-label', 'preview-note', 'preview-bar', 'preview-empty', 'preview-heading',
    'preview-text'
  ].forEach(function (name) {
    el[name] = $('[data-' + name + ']', page.levelView);
  });
  el.task.setAttribute('tabindex', '-1');
  el.table = $('[data-table]', page.levelView);

  var session = null;

  function step() {
    return session.level.steps[session.index];
  }

  function variant() {
    var current = step();
    return E.variantFor(current, current.check ? session.repeats : 0);
  }

  function announceLive(text) {
    put(el.live, text);
  }

  function showLevel(n) {
    var level = C.levels[n];
    var meta = levelMeta(n);
    message = '';
    session = {
      n: n,
      level: level,
      meta: meta,
      index: Math.min(store.stepsDone(n), level.steps.length - 1),
      repeats: 0,
      selection: {},
      hints: 0,
      effects: [],
      pending: null
    };

    document.title = E.fill(U.levelTitle, { name: meta.name, move: meta.move });
    setHead(
      E.fill(U.levelEyebrow, { n: n, total: C.levelList.length }),
      meta.name + ': ' + meta.move,
      level.intro,
      { text: U.backToMap, href: '#map' }
    );
    show(page.mapView, false);
    show(page.levelView, true);

    put(el['say-label'], U.youSay);
    put(el['reply-who'], U.theAssistant);
    put(el['ask-title'], U.theAssistantAsks);
    put(el['ask-kind'], U.newFile);
    put(el.yes, U.yes);
    put(el.no, U.no);
    put(el.announce, U.announce);
    put(el['hint-label'], U.hintLabel);
    put(el['board-label'], U.board);
    put(el['board-note'], U.boardNote);
    put(el['preview-label'], U.preview);
    put(el['preview-note'], U.previewNote);
    put(el['preview-empty'], U.previewEmpty);

    renderBoard();
    renderPreview(null);
    renderStep(false);
  }

  /* ---------- Track, board and preview ---------- */

  function renderTrack(position, animate) {
    el.track.textContent = '';
    var squares = session.level.steps.length + 1;
    for (var i = 0; i < squares; i += 1) {
      var sq = make('span', 'track__sq');
      if (i === position) {
        var pawn = piece(session.meta.piece);
        if (animate) pawn.classList.add('piece--moved');
        sq.appendChild(pawn);
      }
      el.track.appendChild(sq);
    }
  }

  function renderBoard() {
    var files = E.boardFiles(session.effects);
    el.board.textContent = '';
    for (var i = 0; i < 4; i += 1) {
      var sq = make('span', 'sq ' + (i % 2 === 0 ? 'sq--b' : 'sq--a'));
      if (files[i]) sq.appendChild(piece('pawn'));
      el.board.appendChild(sq);
    }
    if (!files.length) {
      put(el['board-status'], U.boardEmpty);
    } else {
      put(
        el['board-status'],
        E.fill(files.length === 1 ? U.boardFiles.one : U.boardFiles.many, { files: files.join(', '), count: files.length })
      );
    }
  }

  function renderPreview(effect) {
    var hasEffect = Boolean(effect);
    put(el['preview-bar'], hasEffect ? effect.file : U.previewNone);
    show(el['preview-empty'], !hasEffect);
    show(el['preview-heading'], hasEffect && effect.kind === 'page');
    show(el['preview-text'], hasEffect && effect.kind === 'note');
    put(el['preview-heading'], hasEffect && effect.kind === 'page' ? effect.text : '');
    put(el['preview-text'], hasEffect && effect.kind === 'note' ? effect.text : '');
  }

  /* ---------- A step ---------- */

  function resetStepParts() {
    show(el.hint, false);
    show(el.reply, false);
    show(el.ask, false);
    show(el.verdict, false);
    show(el.question, false);
    show(el.recap, false);
    show(el.build, false);
    put(el['reply-text'], '');
    put(el['question-feedback'], '');
    session.selection = {};
    session.hints = 0;
    session.pending = null;
  }

  function renderStep(animate) {
    var current = step();
    var total = session.level.steps.length;
    resetStepParts();

    put(el.stepline, E.fill(U.stepLine, { n: session.index + 1, total: total }) + ' · ' + current.name);
    var next = session.level.steps[session.index + 1];
    put(el.nextline, next ? E.fill(U.nextLine, { next: next.name }) : '');
    show(el.nextline, Boolean(next));
    renderTrack(session.index, animate);

    put(el.context, current.context || '');
    show(el.context, Boolean(current.context));
    put(el.task, E.fill(current.task, variant()));

    if (current.kind === 'question') renderQuestion(current);
    else renderBuild(current);

    announceLive(E.fill(U.stepLine, { n: session.index + 1, total: total }) + '. ' + el.task.textContent);
    el.task.focus({ preventScroll: true });
    reveal(el.task);
  }

  /* ---------- Build step ---------- */

  function renderBuild(current) {
    show(el.build, true);
    show(el.actions, true);
    el.groups.textContent = '';

    E.groupsFor(current, variant()).forEach(function (group) {
      var box = make('div', 'group');
      box.setAttribute('role', 'group');
      var labelId = 'lv-group-' + group.id;
      box.setAttribute('aria-labelledby', labelId);
      var label = make('p', 'label label--muted', group.label);
      label.id = labelId;
      var row = make('div', 'chips');

      group.options.forEach(function (option) {
        var chip = make('button', 'chip', option.text);
        chip.type = 'button';
        chip.setAttribute('aria-pressed', 'false');
        chip.setAttribute('data-group', group.id);
        chip.setAttribute('data-option', option.id);
        chip.appendChild(icon('icon-check', 'chip__check'));
        chip.addEventListener('click', function () {
          chooseTile(group.id, option.id);
        });
        row.appendChild(chip);
      });

      box.appendChild(label);
      box.appendChild(row);
      el.groups.appendChild(box);
    });

    renderSay();
    renderHintButton();
  }

  function chips() {
    return el.groups.querySelectorAll('[data-chip], .chip');
  }

  function chooseTile(groupId, optionId) {
    session.selection[groupId] = session.selection[groupId] === optionId ? null : optionId;
    chips().forEach(function (chip) {
      if (chip.getAttribute('data-group') !== groupId) return;
      chip.setAttribute('aria-pressed', session.selection[groupId] === chip.getAttribute('data-option') ? 'true' : 'false');
    });
    renderSay();
    show(el.reply, false);
  }

  function renderSay() {
    var words = E.sentence(step(), variant(), session.selection);
    put(el.say, words || U.noWords);
    if (words) el.say.removeAttribute('data-empty');
    else el.say.setAttribute('data-empty', '');
  }

  function lockTiles(locked) {
    chips().forEach(function (chip) {
      chip.disabled = locked;
    });
  }

  function say(text, tone) {
    put(el['reply-text'], text);
    el.reply.setAttribute('data-tone', tone);
    show(el.reply, true);
    el['reply-text'].style.animation = 'none';
    void el['reply-text'].offsetWidth;
    el['reply-text'].style.animation = '';
    announceLive(text);
  }

  function renderHintButton() {
    var hints = step().hints || [];
    var left = session.hints < hints.length;
    el['hint-button'].disabled = !left;
    put(el['hint-button'], left ? (session.hints ? U.hintButtonMore : U.hintButton) : U.hintNoMore);
    show(el['hint-button'], hints.length > 0);
  }

  function showHint() {
    var hints = step().hints || [];
    if (session.hints >= hints.length) return;
    put(el['hint-text'], hints[session.hints]);
    put(el['hint-note'], step().check ? U.hintCheckNote : '');
    show(el['hint-note'], Boolean(step().check));
    session.hints += 1;
    show(el.hint, true);
    announceLive(hints[session.hints - 1]);
    renderHintButton();
  }

  function announceMove() {
    var result = E.announce(step(), variant(), session.selection);
    if (result.type !== 'ask') {
      say(result.reply, 'hint');
      return;
    }
    session.pending = result;
    say(result.reply, 'ask');
    put(el['ask-question'], result.ask.question);
    put(el['ask-file'], result.ask.file);
    lockTiles(true);
    show(el.actions, false);
    show(el.ask, true);
    el.ask.focus({ preventScroll: true });
    reveal(el.ask);
  }

  function deny() {
    session.pending = null;
    show(el.ask, false);
    show(el.actions, true);
    lockTiles(false);
    say(U.denied, 'hint');
    el.announce.focus();
  }

  function approve() {
    var result = session.pending;
    if (!result) return;
    session.pending = null;
    show(el.ask, false);

    if (result.effect) {
      session.effects.push(result.effect);
      renderBoard();
      renderPreview(result.effect);
    }
    say(E.fill(U.done, { file: result.effect ? result.effect.file : '' }), 'done');

    if (!result.completes) {
      show(el.actions, true);
      lockTiles(false);
      return;
    }

    var current = step();
    var repeat = current.check && E.checkResult(session.hints) === 'repeat';
    var isLastBuild = session.level.steps[session.index + 1] && session.level.steps[session.index + 1].kind === 'question';

    if (repeat) {
      el.verdict.setAttribute('data-tone', 'neutral');
      put(el['verdict-text'], U.hintUsedRepeat);
      put(el['verdict-next'], U.repeatCheck);
      el['verdict-next'].onclick = function () {
        session.repeats += 1;
        renderStep(false);
      };
    } else {
      store.setStepsDone(session.n, session.index + 1);
      el.verdict.setAttribute('data-tone', 'good');
      put(el['verdict-text'], result.verdict);
      put(el['verdict-next'], isLastBuild ? U.toQuestion : U.nextStep);
      el['verdict-next'].onclick = function () {
        session.index += 1;
        renderStep(true);
      };
    }
    show(el.verdict, true);
    announceLive(el['verdict-text'].textContent);
    el.verdict.focus({ preventScroll: true });
    reveal(el.verdict);
    /* On a phone the preview sits below the card: bring it into view too, so the learner sees what appeared. */
    reveal(el.table);
  }

  /* ---------- Question step ---------- */

  function renderQuestion(current) {
    show(el.question, true);
    el.options.textContent = '';
    current.options.forEach(function (option) {
      var button = make('button', 'option');
      button.type = 'button';
      button.setAttribute('data-option', option.id);
      var mark = make('span', 'option__mark');
      mark.appendChild(icon('icon-check'));
      button.appendChild(mark);
      button.appendChild(make('span', '', option.text));
      button.addEventListener('click', function () {
        pickAnswer(current, option.id, button);
      });
      el.options.appendChild(button);
    });
  }

  function pickAnswer(current, optionId, button) {
    var result = E.answer(current, optionId);

    if (!result.right) {
      button.setAttribute('data-state', 'wrong');
      button.querySelector('use').setAttribute('href', '#icon-cross');
      button.disabled = true;
      put(el['question-feedback'], result.why);
      announceLive(result.why);
      return;
    }

    button.setAttribute('data-state', 'right');
    el.options.querySelectorAll('.option').forEach(function (option) {
      option.disabled = true;
    });
    store.setStepsDone(session.n, session.index);
    store.markPassed(session.n);

    var text = U.questionRight + ' ' + result.why;
    el.verdict.setAttribute('data-tone', 'good');
    put(el['question-feedback'], '');
    put(el['verdict-text'], text);
    put(el['verdict-next'], U.seeRecap);
    el['verdict-next'].onclick = function () {
      renderRecap();
    };
    show(el.verdict, true);
    announceLive(text);
    el.verdict.focus({ preventScroll: true });
    reveal(el.verdict);
  }

  /* ---------- Recap ---------- */

  function renderRecap() {
    var recap = session.level.recap;
    var after = levelMeta(session.n + 1);
    show(el.build, false);
    show(el.question, false);
    show(el.verdict, false);
    show(el.hint, false);
    show(el.reply, false);
    show(el.context, false);
    show(el.nextline, false);

    put(el.stepline, U.levelPassed);
    put(el.task, '');
    show(el.task, false);
    renderTrack(session.level.steps.length, true);

    put(el['recap-title'], E.fill(U.recapTitle, { n: session.n, name: session.meta.name }));
    put(el['recap-concept-label'], U.recapConcept);
    put(el['recap-concept'], recap.concept);
    put(el['recap-file-label'], 'File you made');
    put(el['recap-file'], recap.file);
    put(el['recap-file-note'], recap.fileNote);
    put(el['recap-real-label'], U.recapReal);
    put(el['recap-real'], recap.realStart);
    put(el['recap-next-label'], U.recapNext);

    var nextText = after ? after.name + ': ' + after.move + '. ' + after.blurb : '';
    if (after && !isBuilt(after.id)) nextText += ' ' + E.fill(U.recapNextLevel, { n: after.id });
    put(el['recap-next'], nextText);
    put(el['recap-map'], U.recapMapButton);

    show(el.recap, true);
    announceLive(el['recap-title'].textContent);
    el.recap.focus({ preventScroll: true });
    reveal(el.recap);
  }

  /* ---------- Wire up ---------- */

  el.announce.addEventListener('click', announceMove);
  el['hint-button'].addEventListener('click', showHint);
  el.yes.addEventListener('click', approve);
  el.no.addEventListener('click', deny);

  setupReset();
  selectedLevel = firstOpenLevel();

  root.addEventListener('hashchange', function () {
    route();
    page.title.focus({ preventScroll: true });
  });
  route();

  app.play = { route: route };
})(typeof window !== 'undefined' ? window : globalThis);
