/*
  Checkmate - the first move on the landing page.
  The learner builds one instruction from word tiles, the assistant asks permission,
  and a page appears. Every answer is scripted: same input, same result.
  All text comes from content/en.js or from the HTML. This file contains no wording.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  /*
    Decide what the assistant does with the chosen words.
    slots: { action: boolean, object: boolean, text: boolean }
    Returns the key of the reply in content.firstWin.reply.
  */
  function evaluate(slots) {
    var action = Boolean(slots && slots.action);
    var object = Boolean(slots && slots.object);
    var text = Boolean(slots && slots.text);

    if (!action && !object && !text) return 'empty';
    if (!action) return 'needAction';
    if (!object) return 'needObject';
    return text ? 'askWithText' : 'askNoText';
  }

  /* Put a value into a sentence that contains {text}. */
  function fill(template, value) {
    return String(template).split('{text}').join(value);
  }

  function init(doc) {
    var copy = app.content && app.content.firstWin;
    var demo = doc.querySelector('[data-demo]');
    var table = doc.querySelector('[data-table]');
    if (!copy || !demo || !table) return;

    var el = {
      task: demo.querySelector('[data-task]'),
      steps: demo.querySelectorAll('[data-step]'),
      say: demo.querySelector('[data-say]'),
      chips: demo.querySelectorAll('[data-chip]'),
      actions: demo.querySelector('[data-actions]'),
      announce: demo.querySelector('[data-announce]'),
      reply: demo.querySelector('[data-reply]'),
      replyText: demo.querySelector('[data-reply-text]'),
      ask: demo.querySelector('[data-ask]'),
      askQuestion: demo.querySelector('[data-ask-question]'),
      askFile: demo.querySelector('[data-ask-file]'),
      yes: demo.querySelector('[data-yes]'),
      no: demo.querySelector('[data-no]'),
      live: demo.querySelector('[data-live]'),
      piece: table.querySelector('[data-piece]'),
      fileLabel: table.querySelector('[data-file-label]'),
      boardStatus: table.querySelector('[data-board-status]'),
      previewBar: table.querySelector('[data-preview-bar]'),
      previewEmpty: table.querySelector('[data-preview-empty]'),
      previewHeading: table.querySelector('[data-preview-heading]'),
      win: table.querySelector('[data-win]'),
      reset: table.querySelector('[data-reset]')
    };

    var pageText = '';

    function show(node, visible) {
      if (visible) node.removeAttribute('hidden');
      else node.setAttribute('hidden', '');
    }

    function isPressed(chip) {
      return chip.getAttribute('aria-pressed') === 'true';
    }

    /* The words on a tile, without its check mark. */
    function words(chip) {
      return chip.textContent.replace(/\s+/g, ' ').trim();
    }

    function selectedSlots() {
      var slots = { action: false, object: false, text: false };
      el.chips.forEach(function (chip) {
        if (isPressed(chip)) slots[chip.getAttribute('data-slot')] = true;
      });
      return slots;
    }

    /* The tiles are already in sentence order in the page, so any tap order reads correctly. */
    function renderSay() {
      var parts = [];
      el.chips.forEach(function (chip) {
        if (isPressed(chip)) parts.push(words(chip));
      });
      if (parts.length) {
        el.say.textContent = parts.join(' ');
        el.say.removeAttribute('data-empty');
      } else {
        el.say.textContent = copy.sayEmpty;
        el.say.setAttribute('data-empty', '');
      }
    }

    function setStep(name) {
      var reached = false;
      el.steps.forEach(function (step) {
        var current = step.getAttribute('data-step') === name;
        if (current) reached = true;
        if (current) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
        if (!current && !reached) step.setAttribute('data-done', '');
        else step.removeAttribute('data-done');
      });
      el.task.textContent = copy.task[name];
    }

    function say(text, tone) {
      el.replyText.textContent = text;
      el.reply.setAttribute('data-tone', tone);
      show(el.reply, true);
      /* Restart the short entrance so a repeated answer is still seen to arrive. */
      el.replyText.style.animation = 'none';
      void el.replyText.offsetWidth;
      el.replyText.style.animation = '';
      el.live.textContent = text;
    }

    function clearReply() {
      show(el.reply, false);
      el.replyText.textContent = '';
    }

    function lockChips(locked) {
      el.chips.forEach(function (chip) {
        chip.disabled = locked;
      });
    }

    function toggleChip(chip) {
      chip.setAttribute('aria-pressed', isPressed(chip) ? 'false' : 'true');
      renderSay();
      clearReply();
    }

    function announce() {
      var slots = selectedSlots();
      var outcome = evaluate(slots);

      if (outcome === 'askWithText' || outcome === 'askNoText') {
        pageText = copy.defaultText;
        el.chips.forEach(function (chip) {
          if (isPressed(chip) && chip.getAttribute('data-slot') === 'text') {
            pageText = chip.getAttribute('data-value') || copy.defaultText;
          }
        });
        say(fill(copy.reply[outcome], pageText), 'ask');
        el.askQuestion.textContent = copy.askQuestion;
        el.askFile.textContent = copy.fileName;
        lockChips(true);
        show(el.actions, false);
        show(el.ask, true);
        setStep('ask');
        el.ask.focus({ preventScroll: true });
        reveal(el.ask);
        return;
      }

      say(copy.reply[outcome], 'hint');
    }

    function deny() {
      show(el.ask, false);
      show(el.actions, true);
      lockChips(false);
      setStep('build');
      say(copy.reply.denied, 'hint');
      el.announce.focus();
    }

    function reducedMotion() {
      return Boolean(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function scrollMode() {
      return reducedMotion() ? 'auto' : 'smooth';
    }

    /* Scroll only as far as needed to show the whole node. */
    function reveal(node) {
      node.scrollIntoView({ behavior: scrollMode(), block: 'nearest' });
    }

    /* Bring the top of a region to the top of the screen, unless it is already in the upper half. */
    function bringIntoView(node) {
      var box = node.getBoundingClientRect();
      var viewport = root.innerHeight || doc.documentElement.clientHeight;
      if (box.top >= 0 && box.top < viewport * 0.5) return;
      node.scrollIntoView({ behavior: scrollMode(), block: 'start' });
    }

    function approve() {
      show(el.ask, false);
      setStep('done');
      say(copy.reply.done, 'done');

      el.piece.removeAttribute('hidden');
      el.piece.classList.add('piece--arriving');
      el.fileLabel.textContent = copy.fileName;
      el.boardStatus.textContent = copy.board.oneFile;

      el.previewBar.textContent = copy.preview.barFile;
      show(el.previewEmpty, false);
      el.previewHeading.textContent = pageText;
      show(el.previewHeading, true);

      show(el.win, true);
      el.win.focus({ preventScroll: true });
      bringIntoView(table);
    }

    function reset() {
      el.chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', 'false');
      });
      lockChips(false);
      renderSay();
      clearReply();
      show(el.ask, false);
      show(el.actions, true);
      setStep('build');

      el.piece.setAttribute('hidden', '');
      el.piece.classList.remove('piece--arriving');
      el.fileLabel.textContent = '';
      el.boardStatus.textContent = copy.board.empty;
      el.previewBar.textContent = copy.preview.barEmpty;
      el.previewHeading.textContent = '';
      show(el.previewHeading, false);
      show(el.previewEmpty, true);
      show(el.win, false);
      pageText = '';

      el.chips[0].focus({ preventScroll: true });
      bringIntoView(demo);
    }

    el.chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        toggleChip(chip);
      });
    });
    el.announce.addEventListener('click', announce);
    el.yes.addEventListener('click', approve);
    el.no.addEventListener('click', deny);
    el.reset.addEventListener('click', reset);

    renderSay();
  }

  app.firstWin = { evaluate: evaluate, fill: fill, init: init };

  if (root.document) init(root.document);
})(typeof window !== 'undefined' ? window : globalThis);
