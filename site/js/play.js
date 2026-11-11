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
    levelView: doc.querySelector('[data-view="level"]'),
    finaleView: doc.querySelector('[data-view="finale"]')
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

  /* A level is built when the core file lists the files it needs. Its data is loaded when it is opened. */
  function isBuilt(n) {
    var meta = levelMeta(n);
    return Boolean(meta && meta.files && meta.files.length);
  }

  var loaded = {};

  /* Load script files one after the other (same site only), then call done. */
  function loadFiles(files, done, fail) {
    var pending = files.filter(function (file) { return !loaded[file]; });
    if (!pending.length) {
      done();
      return;
    }
    var left = pending.length;
    var failed = false;
    pending.forEach(function (file) {
      var script = doc.createElement('script');
      script.src = file;
      script.async = false;
      script.onload = function () {
        loaded[file] = true;
        left -= 1;
        if (left === 0 && !failed) done();
      };
      script.onerror = function () {
        failed = true;
        fail(file);
      };
      doc.head.appendChild(script);
    });
  }

  /* ---------- Route ---------- */

  var selectedLevel = 1;
  var message = '';

  function route() {
    var hash = root.location.hash.replace('#', '');
    var n = /^[1-6]$/.test(hash) ? Number(hash) : 0;

    if (hash === 'done') {
      if (store.isPassed(C.levelList.length)) {
        openFinale();
        return;
      }
      selectedLevel = C.levelList.length;
      message = U.finaleLocked;
      showMap();
      return;
    }
    if (n && store.isUnlocked(n) && isBuilt(n)) {
      openLevel(n);
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
    show(page.finaleView, false);
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
      var total = meta.steps;
      status = store.stepsDone(meta.id) > 0
        ? E.fill(U.levelStatusSteps, { done: store.stepsDone(meta.id), total: total })
        : U.levelOpenStatus;
    }
    put($('[data-card-status]', page.mapView), status);

    var everything = C.levelList.every(function (item) { return store.isPassed(item.id); });
    var endLink = $('[data-done-link]', page.mapView);
    show(endLink, everything);
    put(endLink, U.mapFinaleLink);

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
  ['stepline', 'track', 'nextline', 'context', 'task', 'build', 'say-label', 'say', 'groups', 'type', 'review-line',
    'type-label', 'input', 'type-help', 'actions', 'announce', 'hint-button', 'hint', 'hint-label', 'hint-text',
    'hint-note', 'reply', 'reply-who', 'reply-text', 'ask', 'ask-title', 'ask-question', 'ask-mark', 'ask-file',
    'ask-kind', 'yes', 'no', 'verdict', 'verdict-text', 'verdict-next', 'question', 'options', 'question-feedback',
    'recap', 'recap-title', 'recap-concept-label', 'recap-concept', 'recap-items', 'recap-real-label', 'recap-real',
    'recap-next-label', 'recap-next', 'recap-map', 'live', 'board-label', 'board-note', 'board', 'board-status',
    'preview-label', 'preview-note', 'preview-bar', 'preview-empty', 'preview-page', 'preview-site',
    'preview-heading', 'preview-footer', 'preview-text', 'compare', 'compare-label', 'compare-before', 'compare-after',
    'plan', 'plan-title', 'plan-list', 'ask-change', 'capstone', 'goals-label', 'goals-list', 'goals-progress', 'mode-label',
    'mode-chips', 'recap-done', 'kinds', 'kinds-label', 'kinds-list', 'stuck', 'stuck-title', 'stuck-text', 'stuck-example',
    'stuck-restart'
  ].forEach(function (name) {
    el[name] = $('[data-' + name + ']', page.levelView);
  });
  el.task.setAttribute('tabindex', '-1');
  el.table = $('[data-table]', page.levelView);

  var session = null;
  var world = { files: [], view: { kind: 'none' }, rules: [] };

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

  /* Open a level: load its data first, then draw it. */
  function openLevel(n) {
    var meta = levelMeta(n);
    if (C.levels[n]) {
      showLevel(n);
      return;
    }
    document.title = U.pageTitle;
    setHead(E.fill(U.levelEyebrow, { n: n, total: C.levelList.length }), meta.name + ': ' + meta.move, U.loading, { text: U.backToMap, href: '#map' });
    show(page.mapView, false);
    show(page.levelView, false);
    loadFiles(
      meta.files,
      function () {
        if (root.location.hash === '#' + n) showLevel(n);
      },
      function () {
        put(page.lead, U.loadFailed);
      }
    );
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
      examples: 0,
      misses: 0,
      effects: [],
      pending: null,
      eventIndex: 0,
      base: 0,
      show: 'after'
    };

    document.title = E.fill(U.levelTitle, { name: meta.name, move: meta.move });
    setHead(
      E.fill(U.levelEyebrow, { n: n, total: C.levelList.length }),
      meta.name + ': ' + meta.move,
      level.intro,
      { text: U.backToMap, href: '#map' }
    );
    show(page.mapView, false);
    show(page.finaleView, false);
    show(page.levelView, true);

    put(el['reply-who'], U.theAssistant);
    put(el['ask-title'], U.theAssistantAsks);
    put(el.yes, U.yes);
    put(el.no, U.no);
    put(el['hint-label'], U.hintLabel);
    put(el['board-label'], U.board);
    put(el['board-note'], U.boardNote);
    put(el['preview-label'], U.preview);
    put(el['preview-note'], U.previewNote);
    put(el['preview-empty'], U.previewEmpty);
    put(el['compare-label'], U.compareLabel);
    put(el['compare-before'], U.compareBefore);
    put(el['compare-after'], U.compareAfter);

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

  function fileLabel(file) {
    if (!session.level.showChanges) return file;
    if (world.created.indexOf(file) !== -1) return file + ' (' + U.boardNew + ')';
    if (world.edited.indexOf(file) !== -1) return file + ' (' + U.boardChanged + ')';
    return file;
  }

  function renderBoard() {
    var files = world.files;
    el.board.textContent = '';
    for (var i = 0; i < 4; i += 1) {
      var sq = make('span', 'sq ' + (i % 2 === 0 ? 'sq--b' : 'sq--a'));
      if (files[i]) {
        sq.appendChild(piece('pawn'));
        if (session.level.showChanges && world.edited.indexOf(files[i]) !== -1) sq.classList.add('sq--edited');
      }
      el.board.appendChild(sq);
    }
    if (!files.length) {
      put(el['board-status'], U.boardEmpty);
    } else {
      put(
        el['board-status'],
        E.fill(files.length === 1 ? U.boardFiles.one : U.boardFiles.many, { files: files.map(fileLabel).join(', '), count: files.length })
      );
    }
  }

  function setAttr(node, name, value, plain) {
    if (value && value !== plain) node.setAttribute(name, value);
    else node.removeAttribute(name);
  }

  function renderPreview() {
    var view = world.view;
    var isPage = view.kind === 'page';
    var canCompare = isPage && Boolean(view.before);
    var shown = isPage ? (session.show === 'before' && view.before ? view.before : view.page) : null;

    var changed = session.level.showChanges && view.file && world.edited.indexOf(view.file) !== -1;
    put(el['preview-bar'], view.file ? (changed ? view.file + ' — ' + U.previewChanged : view.file) : U.previewNone);
    show(el['preview-empty'], view.kind === 'none');
    show(el['preview-site'], isPage);
    show(el['preview-text'], view.kind === 'note' || view.kind === 'rulebook');

    if (isPage) {
      put(el['preview-heading'], shown.text);
      setAttr(el['preview-heading'], 'data-color', shown.color, 'ink');
      setAttr(el['preview-heading'], 'data-size', shown.size, 'normal');
      setAttr(el['preview-page'], 'data-bg', shown.bg, 'paper');
      put(el['preview-footer'], shown.footer || '');
      show(el['preview-footer'], Boolean(shown.footer));
    } else {
      el['preview-page'].removeAttribute('data-bg');
    }
    if (view.kind === 'note') put(el['preview-text'], view.text);
    if (view.kind === 'rulebook') put(el['preview-text'], view.lines.map(function (line) { return '- ' + line; }).join('\n'));

    show(el.compare, canCompare);
    el['compare-before'].setAttribute('aria-pressed', session.show === 'before' ? 'true' : 'false');
    el['compare-after'].setAttribute('aria-pressed', session.show === 'before' ? 'false' : 'true');
  }

  function renderWorld() {
    world = E.replay(session.effects, session.base);
    renderBoard();
    renderPreview();
  }

  function applyEffects(effects) {
    if (!effects || !effects.length) return;
    effects.forEach(function (effect) {
      session.effects.push(effect);
    });
    session.show = 'after';
    renderWorld();
    /* On a phone the preview sits below the card: bring it into view, so the learner sees what changed. */
    reveal(el.table);
  }

  /* ---------- A step ---------- */

  function resetStepParts() {
    [el.hint, el.reply, el.ask, el.verdict, el.question, el.recap, el.build, el.type, el['review-line'], el.plan, el.capstone, el.stuck, el.kinds].forEach(function (node) {
      show(node, false);
    });
    put(el['reply-text'], '');
    put(el['question-feedback'], '');
    session.selection = {};
    session.hints = 0;
    session.examples = 0;
    session.misses = 0;
    session.pending = null;
    session.eventIndex = 0;
    session.cap = null;
    el.input.value = '';
    el.input.disabled = false;
    show(el.announce, true);
    show(el.actions, false);
  }

  function renderStep(animate) {
    var current = step();
    var total = session.level.steps.length;
    resetStepParts();

    if (current.board) {
      session.effects = E.fillDeep(current.board, variant()).slice();
      session.show = 'after';
    }
    session.base = session.effects.length;
    renderWorld();

    put(el.stepline, E.fill(U.stepLine, { n: session.index + 1, total: total }) + ' · ' + current.name);
    var next = session.level.steps[session.index + 1];
    put(el.nextline, next ? E.fill(U.nextLine, { next: next.name }) : '');
    show(el.nextline, Boolean(next));
    renderTrack(session.index, animate);

    put(el.context, current.context || '');
    show(el.context, Boolean(current.context));
    put(el.task, E.fill(current.task, variant()));
    show(el.task, true);

    if (current.kind === 'question') renderQuestion(current);
    else if (current.kind === 'review') renderReviewEvent();
    else if (current.kind === 'build') renderBuild(current);
    else if (current.kind === 'capstone') renderCapstone(current);
    else renderTyped(current);

    announceLive(E.fill(U.stepLine, { n: session.index + 1, total: total }) + '. ' + el.task.textContent);
    el.task.focus({ preventScroll: true });
    reveal(el.task);
  }

  /* ---------- Build step (tiles) ---------- */

  function renderBuild(current) {
    show(el.build, true);
    show(el.actions, true);
    put(el['say-label'], current.sayLabel || U.youSay);
    put(el.announce, current.announceLabel || U.announce);
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
    return el.groups.querySelectorAll('.chip');
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

  /* ---------- Typed step ---------- */

  function showTypeBox(label, help, rows) {
    show(el.type, true);
    put(el['type-label'], label);
    put(el['type-help'], help);
    el.input.rows = rows || 2;
    el.input.disabled = false;
    el.input.value = '';
  }

  function renderTyped(current) {
    var rules = current.kind === 'rules';
    show(el.actions, true);
    put(el.announce, current.announceLabel || U.announce);
    showTypeBox(rules ? U.rulesLabel : U.typeLabel, rules ? U.rulesHelp : U.typeHelp, current.rows || 2);
    renderKinds(current);
    renderHintButton();
  }

  /* What the practice game understands, before the learner writes. Names and accepted words only, no sentences. */
  function renderKinds(current) {
    var kinds = current.showKinds ? app.kit.rulebookKinds : null;
    show(el.kinds, Boolean(kinds));
    if (!kinds) return;
    put(el['kinds-label'], U.kindsLabel);
    el['kinds-list'].textContent = '';
    kinds.forEach(function (kind) {
      var item = make('li', 'kinds__item');
      item.appendChild(make('strong', '', kind.name + ': '));
      item.appendChild(document.createTextNode(kind.says));
      el['kinds-list'].appendChild(item);
    });
  }

  function lockInput(locked) {
    el.input.disabled = locked;
  }

  /* ---------- Hints and answers ---------- */

  function say(text, tone) {
    put(el['reply-text'], text);
    el.reply.setAttribute('data-tone', tone);
    show(el.reply, true);
    el['reply-text'].style.animation = 'none';
    void el['reply-text'].offsetWidth;
    el['reply-text'].style.animation = '';
    announceLive(text);
    reveal(el.reply);
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
    put(el['hint-label'], U.hintLabel);
    put(el['hint-text'], hints[session.hints]);
    put(el['hint-note'], step().check ? U.hintCheckNote : '');
    show(el['hint-note'], Boolean(step().check));
    session.hints += 1;
    show(el.hint, true);
    announceLive(hints[session.hints - 1]);
    renderHintButton();
  }

  /* ---------- Three misses in a row: a way out ---------- */

  function hit() {
    session.misses = 0;
    show(el.stuck, false);
  }

  function miss() {
    session.misses += 1;
    if (session.misses >= 3) showStuck();
  }

  /* A complete answer for what the learner is doing now, with this variant's words, or ''. */
  function exampleText() {
    var current = step();
    if (current.kind === 'capstone') return '';
    var active = activeStep();
    return active && active.example ? E.fill(active.example, variant()) : '';
  }

  function showStuck() {
    var current = step();
    var final = current.kind === 'capstone';
    var example = exampleText();
    var restart = Boolean(current.check);
    show(el['stuck-example'], Boolean(example));
    show(el['stuck-restart'], restart);
    if (!example && !restart) {
      show(el.stuck, false);
      return;
    }
    put(el['stuck-title'], U.stuckTitle);
    put(el['stuck-text'], final ? U.stuckTextFinal : restart ? (example ? U.stuckTextCheck : U.stuckTextRestart) : U.stuckTextStep);
    put(el['stuck-example'], U.stuckExample);
    put(el['stuck-restart'], final ? U.stuckRestartFinal : U.stuckRestart);
    show(el.stuck, true);
    reveal(el.stuck);
  }

  function showExample() {
    var example = exampleText();
    if (!example) return;
    session.examples += 1;
    put(el['hint-label'], U.exampleLabel);
    put(el['hint-text'], example);
    put(el['hint-note'], step().check ? U.exampleCheckNote : '');
    show(el['hint-note'], Boolean(step().check));
    show(el.hint, true);
    announceLive(U.exampleLabel + '. ' + example);
    reveal(el.hint);
  }

  function restartCheck() {
    session.repeats += 1;
    renderStep(false);
  }

  /* The thing the learner is answering right now: the step, or the current request of a review. */
  function activeStep() {
    var current = step();
    if (current.kind !== 'review') return current;
    var event = E.reviewEvent(current, variant(), session.eventIndex);
    return event && event.kind === 'type' ? event : null;
  }

  function announceMove() {
    if (step().kind === 'capstone') {
      capAnnounce();
      return;
    }
    var active = activeStep();
    if (!active) return;
    var input = active.kind === 'build' ? session.selection : el.input.value;
    var res = E.announce(active, variant(), input, { rules: world.rules });

    if (res.plan) showPlan(res.plan);

    if (res.type === 'ask') {
      hit();
      session.pending = res;
      say(res.reply, 'ask');
      showAsk(res.ask);
      lockTiles(true);
      lockInput(true);
      show(el.actions, false);
      return;
    }
    if (res.type === 'done' || res.type === 'plan') {
      hit();
      say(res.reply, 'done');
      completeMove(res);
      return;
    }
    say(res.reply, 'hint');
    miss();
  }

  /* ---------- The plan card ---------- */

  function showPlan(plan) {
    put(el['plan-title'], plan.title);
    el['plan-list'].textContent = '';
    plan.items.forEach(function (item) {
      el['plan-list'].appendChild(make('li', '', item));
    });
    show(el.plan, true);
  }

  function hidePlan() {
    show(el.plan, false);
  }

  function showAsk(ask) {
    put(el.yes, ask.yesLabel || U.yes);
    put(el.no, ask.noLabel || U.no);
    show(el['ask-change'], Boolean(ask.file));
    put(el['ask-question'], ask.question);
    put(el['ask-mark'], ask.mark);
    put(el['ask-file'], ask.file);
    put(el['ask-kind'], ask.change);
    show(el.ask, true);
    el.ask.focus({ preventScroll: true });
    reveal(el.ask);
  }

  function lockTiles(locked) {
    chips().forEach(function (chip) {
      chip.disabled = locked;
    });
  }

  function deny() {
    if (step().kind === 'capstone') {
      capAnswer(false);
      return;
    }
    if (step().kind === 'review') {
      answerReview('no');
      return;
    }
    session.pending = null;
    show(el.ask, false);
    show(el.actions, true);
    lockTiles(false);
    lockInput(false);
    say(U.denied, 'hint');
    el.announce.focus();
  }

  function approve() {
    if (step().kind === 'capstone') {
      capAnswer(true);
      return;
    }
    if (step().kind === 'review') {
      answerReview('yes');
      return;
    }
    var res = session.pending;
    if (!res) return;
    session.pending = null;
    show(el.ask, false);
    say(E.fill(res.ask && res.ask.mark === '~' ? U.doneEdit : U.done, { file: res.ask ? res.ask.file : '' }), 'done');
    completeMove(res);
  }

  /* A move was made: show what it changed, then go on to the next request or finish the step. */
  function completeMove(res) {
    applyEffects(res.effects);
    if (step().kind === 'review') {
      session.eventIndex += 1;
      renderReviewEvent();
      return;
    }
    if (!res.completes) {
      show(el.actions, true);
      lockTiles(false);
      lockInput(false);
      return;
    }
    finishStep(res.verdict);
  }

  function verdictIcon(id) {
    el.verdict.querySelector('use').setAttribute('href', '#' + id);
  }

  function finishStep(verdictText) {
    var current = step();
    var repeat = current.check && E.checkResult(session.hints + session.examples) === 'repeat';
    var next = session.level.steps[session.index + 1];
    var toQuestion = next && next.kind === 'question';
    show(el.actions, false);

    if (repeat) {
      el.verdict.setAttribute('data-tone', 'neutral');
      verdictIcon('icon-repeat');
      put(el['verdict-text'], U.hintUsedRepeat);
      put(el['verdict-next'], U.repeatCheck);
      el['verdict-next'].onclick = function () {
        session.repeats += 1;
        renderStep(false);
      };
    } else {
      store.setStepsDone(session.n, session.index + 1);
      el.verdict.setAttribute('data-tone', 'good');
      verdictIcon('icon-check');
      put(el['verdict-text'], verdictText || current.doneVerdict || '');
      put(el['verdict-next'], toQuestion ? U.toQuestion : U.nextStep);
      el['verdict-next'].onclick = function () {
        session.index += 1;
        renderStep(true);
      };
    }
    show(el.verdict, true);
    announceLive(el['verdict-text'].textContent);
    el.verdict.focus({ preventScroll: true });
    reveal(el.verdict);
    reveal(el.table);
  }

  /* ---------- Review step: several requests in a row ---------- */

  function renderReviewEvent() {
    var current = step();
    var total = current.events.length;
    var event = E.reviewEvent(current, variant(), session.eventIndex);

    if (!event) {
      show(el['review-line'], false);
      show(el.type, false);
      show(el.ask, false);
      finishStep(current.doneVerdict);
      return;
    }

    put(el['review-line'], E.fill(U.reviewLine, { n: session.eventIndex + 1, total: total }));
    show(el['review-line'], true);
    show(el.reply, false);
    show(el.actions, true);
    renderHintButton();

    if (event.plan) showPlan(event.plan);
    else hidePlan();

    if (event.kind === 'ask') {
      show(el.type, false);
      show(el.announce, false);
      showAsk(event.ask);
      return;
    }

    show(el.ask, false);
    show(el.announce, true);
    put(el.announce, U.announce);
    showTypeBox(event.prompt || U.reviewTypeLabel, U.typeHelp, 2);
    announceLive(event.prompt);
  }

  function answerReview(choice) {
    var event = E.reviewEvent(step(), variant(), session.eventIndex);
    var res = E.reviewAnswer(event, choice);
    if (!res.right) {
      say(res.reply, 'hint');
      miss();
      return;
    }
    hit();
    show(el.ask, false);
    say(res.reply, 'done');
    applyEffects(res.effects);
    session.eventIndex += 1;
    renderReviewEvent();
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
    verdictIcon('icon-check');
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
    [el.build, el.type, el.question, el.verdict, el.hint, el.reply, el.context, el.nextline, el.actions, el.ask, el.plan, el.capstone].forEach(function (node) {
      show(node, false);
    });

    put(el.stepline, U.levelPassed);
    put(el.task, '');
    show(el.task, false);
    renderTrack(session.level.steps.length, true);

    put(el['recap-title'], E.fill(U.recapTitle, { n: session.n, name: session.meta.name }));
    put(el['recap-concept-label'], U.recapConcept);
    put(el['recap-concept'], recap.concept);

    el['recap-items'].textContent = '';
    recap.items.forEach(function (item) {
      var box = make('div', 'recap__fact');
      box.appendChild(make('dt', '', item.label));
      var value = make('dd');
      value.appendChild(make('span', item.mono ? 'recap__value--mono' : '', item.value));
      box.appendChild(value);
      if (item.note) box.appendChild(make('dd', 'fine', item.note));
      el['recap-items'].appendChild(box);
    });

    put(el['recap-real-label'], U.recapReal);
    put(el['recap-real'], recap.realStart);
    put(el['recap-next-label'], U.recapNext);

    var nextText = after ? after.name + ': ' + after.move + '. ' + after.blurb : '';
    if (after && !isBuilt(after.id)) nextText += ' ' + E.fill(U.recapNextLevel, { n: after.id });
    put(el['recap-next'], nextText);
    show(el['recap-next'], Boolean(nextText));
    show(el['recap-next-label'], Boolean(nextText));
    put(el['recap-map'], U.recapMapButton);
    var last = session.n === C.levelList.length;
    show(el['recap-map'], !last);
    put(el['recap-done'], U.recapFinale);
    show(el['recap-done'], last);

    show(el.recap, true);
    announceLive(el['recap-title'].textContent);
    el.recap.focus({ preventScroll: true });
    reveal(el.recap);
  }

  /* ---------- Final level: a free session with six goals and no hints ---------- */

  function capGoals() {
    return E.capstoneGoals(session.cap.log, step().goals.map(function (goal) { return goal.id; }));
  }

  function renderGoals() {
    var state = capGoals();
    var goals = step().goals;
    var count = 0;
    el['goals-list'].textContent = '';
    goals.forEach(function (goal) {
      var done = Boolean(state[goal.id]);
      if (done) count += 1;
      var item = make('li', 'goals__item');
      if (done) item.setAttribute('data-done', '');
      var box = make('span', 'goals__box');
      box.setAttribute('aria-hidden', 'true');
      if (done) box.appendChild(icon('icon-check'));
      item.appendChild(box);
      item.appendChild(make('span', 'visually-hidden', done ? U.goalDone : U.goalTodo));
      item.appendChild(make('span', '', goal.text));
      el['goals-list'].appendChild(item);
    });
    put(el['goals-progress'], E.fill(U.goalsProgress, { done: count, total: goals.length }));
    return count === goals.length;
  }

  function lockModes(locked) {
    el['mode-chips'].querySelectorAll('.chip').forEach(function (chip) {
      chip.disabled = locked;
    });
  }

  function setMode(id, speak) {
    session.cap.mode = id;
    var name = '';
    el['mode-chips'].querySelectorAll('.chip').forEach(function (chip) {
      var on = chip.getAttribute('data-mode') === id;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) name = chip.textContent;
    });
    if (speak) announceLive(E.fill(U.modeOn, { mode: name }));
  }

  function renderCapstone(current) {
    session.cap = { mode: 'manual', log: [], pending: null, finished: false };
    show(el.capstone, true);
    put(el['goals-label'], U.goalsLabel);
    put(el['mode-label'], U.modeLabel);
    el['mode-chips'].textContent = '';
    current.modes.forEach(function (mode) {
      var chip = make('button', 'chip', mode.text);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', mode.id === 'manual' ? 'true' : 'false');
      chip.setAttribute('data-mode', mode.id);
      chip.addEventListener('click', function () {
        setMode(mode.id, true);
      });
      el['mode-chips'].appendChild(chip);
    });
    renderGoals();
    show(el.actions, true);
    show(el.announce, true);
    show(el['hint-button'], false);
    put(el.announce, U.announce);
    showTypeBox(U.typeLabel, U.captureHelp, 2);
    renderKinds(current);
  }

  function capAnnounce() {
    var cap = session.cap;
    var state = capGoals();
    var ctx = {
      mode: cap.mode,
      files: world.files,
      hasPage: world.files.indexOf('index.html') !== -1,
      undoable: world.undoable,
      rules: world.rules,
      ruleLines: world.ruleLines,
      denied: Boolean(state.deny)
    };
    var move = E.capstone(step(), el.input.value, ctx);

    if (move.type === 'hint') {
      say(move.reply, 'hint');
      miss();
      return;
    }
    hit();
    if (move.type === 'done') {
      applyEffects(move.effects);
      cap.log.push({ goals: move.goals });
      say(move.reply, 'done');
      capCheckDone();
      return;
    }
    capAsk(move, move.reply);
  }

  function capAsk(move, text) {
    session.cap.pending = move;
    say(text, 'ask');
    if (move.plan) showPlan(move.plan);
    else hidePlan();
    showAsk(move.ask);
    lockInput(true);
    lockModes(true);
    show(el.actions, false);
  }

  function capAnswer(yes) {
    var cap = session.cap;
    var move = cap.pending;
    if (!move) return;
    var branch = yes ? move.yes : move.no;
    cap.pending = null;
    show(el.ask, false);
    hidePlan();

    if (branch.effects && branch.effects.length) applyEffects(branch.effects);
    cap.log.push({ goals: branch.goals || [], improveKey: branch.improveKey || null });
    if (branch.setMode) setMode(branch.setMode, false);

    var complete = renderGoals();
    /* A request that follows (for example the first edit of an approved plan) is still asked, even when every goal is checked. */
    if (branch.then) {
      capAsk(branch.then, branch.reply + ' ' + branch.then.reply);
      return;
    }
    say(branch.reply, yes ? 'done' : 'hint');
    if (complete) {
      capFinish();
      return;
    }
    lockInput(false);
    lockModes(false);
    show(el.actions, true);
    el.input.value = '';
    el.input.focus({ preventScroll: true });
  }

  function capCheckDone() {
    if (renderGoals()) capFinish();
  }

  function capFinish() {
    if (session.cap.finished) return;
    session.cap.finished = true;
    lockInput(true);
    lockModes(true);
    finishStep(step().doneVerdict);
  }

  /* ---------- The end: the card and the checklist for the first real session ---------- */

  function openFinale() {
    document.title = U.pageTitle;
    setHead(U.finaleEyebrow, '…', U.loading, { text: U.backToMap, href: '#map' });
    show(page.mapView, false);
    show(page.levelView, false);
    show(page.finaleView, false);
    loadFiles(
      ['content/en-finale.js', 'js/finale.js'],
      function () {
        if (root.location.hash === '#done') showFinale();
      },
      function () {
        put(page.lead, U.loadFailed);
      }
    );
  }

  function showFinale() {
    var F = C.finale;
    document.title = F.title + ' — Checkmate';
    setHead(U.finaleEyebrow, F.title, F.lead, { text: U.backToMap, href: '#map' });
    show(page.finaleView, true);
    var box = $('[data-finale]', page.finaleView);
    if (!box.hasChildNodes()) app.finale.render(box, doc);
  }

  /* ---------- Wire up ---------- */

  el.announce.addEventListener('click', announceMove);
  el['hint-button'].addEventListener('click', showHint);
  el['stuck-example'].addEventListener('click', showExample);
  el['stuck-restart'].addEventListener('click', restartCheck);
  el.yes.addEventListener('click', approve);
  el.no.addEventListener('click', deny);
  el['compare-before'].addEventListener('click', function () {
    session.show = 'before';
    renderPreview();
  });
  el['compare-after'].addEventListener('click', function () {
    session.show = 'after';
    renderPreview();
  });
  el.input.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || event.shiftKey || el.input.rows > 2) return;
    event.preventDefault();
    announceMove();
  });

  setupReset();
  selectedLevel = firstOpenLevel();

  root.addEventListener('hashchange', function () {
    route();
    page.title.focus({ preventScroll: true });
  });
  route();

  app.play = { route: route };
})(typeof window !== 'undefined' ? window : globalThis);
