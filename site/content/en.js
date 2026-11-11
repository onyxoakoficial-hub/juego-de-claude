/*
  Checkmate - English content for everything the game writes on screen while it runs.
  To add a language: copy this file, translate the strings, and load the copy instead.
  The game logic never contains text. Static copy of the landing page lives in index.html
  so it can be read without JavaScript (approved exception, see CLAUDE.md).

  How a level is described (the engine in js/engine.js reads this and nothing else):
    step.groups   the word tiles, one choice per group
    step.rules    checked in order; the first rule that matches decides the outcome
                  a rule's "when" lists groups: null = nothing chosen, "id" = that tile, left out = anything
    step.outcomes what the assistant says and does for each outcome
  Same tiles always give the same answer. There is no randomness anywhere.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  /* Pieces shared by several levels: the words the game listens for, rulebook topics, starting boards. */
  /* Level 3 and 4: typed answers. Words the game listens for. */
  var ACT = ['make', 'create', 'build', 'write', 'add', 'generate'];
  var PAGE = ['page', 'website', 'webpage', 'site', 'html'];
  var HEAD = ['heading', 'headings', 'title', 'titles', 'header', 'headers', 'headline', 'headlines', 'h1'];
  var UNDO = ['undo', 'revert', 'rewind', '/rewind', 'back', 'reverse', 'restore', 'cancel', 'reset', 'rollback', 'unmake'];

  var typePageRules = [
    { when: { empty: true }, outcome: 'empty' },
    { when: { all: [ACT], none: [PAGE] }, outcome: 'needObject' },
    { when: { all: [PAGE], none: [ACT] }, outcome: 'needAction' },
    { when: { all: [ACT, PAGE] }, outcome: 'good' },
    { when: {}, outcome: 'notUnderstood' }
  ];

  var typePageCommon = {
    empty: { type: 'hint', reply: 'Type your instruction first. A hint can help.' },
    needAction: { type: 'hint', reply: 'I could not tell what to do. Type an action first, like “make”.' },
    needObject: { type: 'hint', reply: 'Make what? Type the thing you want, like “a web page”.' },
    notUnderstood: { type: 'hint', reply: 'I did not understand that. Try something like “Make a web page”.' }
  };

  /* How big the practice page can show a heading, in pixels: up to "small" is small, from "large" up is large. */
  var sizeScale = { base: 32, small: 24, large: 40 };

  var COLOR_WORDS = ['green', 'blue', 'red', 'black', 'white'];
  var PAGE_WORDS = ['page', 'pages', 'site', 'website', 'body'];
  var OTHER_PARTS = ['text', 'texts', 'font', 'fonts', 'link', 'links', 'button', 'buttons', 'paragraph', 'paragraphs', 'border', 'borders', 'menu', 'image', 'images'];

  var rulebookCategories = [
    {
      id: 'background',
      topic: 'the page background',
      when: {
        or: [
          { all: [['background', 'backgrounds'], COLOR_WORDS.slice(0, 3).concat(['white'])] },
          { all: [PAGE_WORDS, COLOR_WORDS.slice(0, 3).concat(['white'])], none: [HEAD, OTHER_PARTS, ['footer', 'footers']] }
        ]
      },
      after: ['background', 'backgrounds'].concat(PAGE_WORDS),
      values: { green: 'green', blue: 'blue', red: 'red', white: 'paper' }
    },
    {
      id: 'color',
      topic: 'the heading color',
      when: { all: [HEAD, ['green', 'blue', 'red', 'black']], none: [['background']] },
      values: { green: 'green', blue: 'blue', red: 'red', black: 'ink' }
    },
    { id: 'footer', topic: 'a footer line', when: { all: [['footer', 'footers', 'bottom', 'signature', 'sign']] }, text: 'Made by the chess club' },
    {
      id: 'size',
      topic: 'the heading size',
      scale: sizeScale,
      when: {
        or: [
          { all: [['big', 'bigger', 'biggest', 'large', 'larger', 'largest', 'huge', 'giant', 'small', 'smaller', 'smallest', 'tiny', 'little', 'normal', 'medium']] },
          { all: [HEAD], pattern: '\\d' }
        ]
      },
      values: {
        big: 'large', bigger: 'large', biggest: 'large', large: 'large', larger: 'large', largest: 'large', huge: 'large', giant: 'large',
        small: 'small', smaller: 'small', smallest: 'small', tiny: 'small', little: 'small', normal: 'normal', medium: 'normal'
      }
    }
  ];

  /*
    A rule the game cannot apply can still be a clear rule. A line is clear when it names a part of the page
    and says something exact about it (a word like "bold" or "purple", a number, a quote).
    Then the game says it is a good rule that this practice game cannot apply yet. Otherwise it is too vague.
  */
  var rulebookConcrete = {
    parts: HEAD.concat(PAGE_WORDS, OTHER_PARTS, ['logo', 'photo', 'photos', 'margin', 'margins', 'padding', 'width', 'spacing', 'list', 'table', 'section', 'navigation', 'nav', 'background', 'backgrounds']),
    values: COLOR_WORDS.concat(
      ['purple', 'yellow', 'orange', 'pink', 'brown', 'gray', 'grey', 'gold', 'teal', 'navy', 'violet', 'cyan', 'magenta', 'silver', 'lime', 'beige', 'turquoise'],
      ['bold', 'italic', 'underline', 'underlined', 'center', 'centered', 'centre', 'centred', 'left', 'right', 'uppercase', 'lowercase', 'capital', 'serif', 'sans', 'monospace', 'arial', 'georgia', 'helvetica', 'times', 'roboto', 'rounded', 'shadow', 'wide', 'narrow', 'dark', 'transparent', 'hidden', 'sticky']
    ),
    pattern: '\\d|[“”"]|#[0-9a-f]{3,6}\\b',
    /* Things a page can have that this game cannot make. Asking for one is a clear request the game cannot do. */
    others: OTHER_PARTS.concat(['logo', 'photo', 'photos', 'table', 'list', 'section', 'navigation', 'nav'])
  };

  /* What the rule-writing steps tell the learner this game understands (no example sentences). */
  var rulebookKinds = [
    { name: 'Heading color', says: 'green, blue, red or black' },
    { name: 'Page background', says: 'green, blue, red or white' },
    { name: 'Heading size', says: 'big, small, or a number like 48px (the practice page shows three sizes)' },
    { name: 'A footer line', says: 'a short text, such as the words after “says”' }
  ];

  var rulebookCommon = {
    empty: { type: 'hint', reply: 'Write at least one rule first. A hint can help.' },
    vague: {
      type: 'hint',
      reply: 'Rule {line} is too vague: “{text}”. A rule must say what to change and how. If it already says that, this practice game may not know it yet. It understands a color, a size, a text and a footer.'
    },
    unsupported: {
      type: 'hint',
      reply: 'Rule {line}, “{text}”: that is a good rule, but this practice game can’t apply it yet. Try a color, a size, a text, or a footer.'
    },
    missing: { type: 'hint', reply: 'I cannot find a rule about {topic}. Write one more rule about it.' }
  };

  var undoRules = [
    { when: { empty: true }, outcome: 'empty' },
    { when: { all: [UNDO] }, outcome: 'good' },
    { when: {}, outcome: 'notUndo' }
  ];

  var undoCommon = {
    empty: { type: 'hint', reply: 'Type how you would take the move back. A hint can help.' },
    notUndo: { type: 'hint', reply: 'I did not hear an undo. Try “undo that” or “take that back”.' }
  };

  var seedClub = [
    { kind: 'page', file: 'index.html', text: 'Chess Club' },
    { kind: 'note', file: 'notes.txt', text: 'Club notes: Saturday at six.' }
  ];

  var greenTitle = { kind: 'page', file: 'index.html', set: { color: 'green' } };


  app.kit = {
    ACT: ACT,
    PAGE: PAGE,
    HEAD: HEAD,
    UNDO: UNDO,
    typePageRules: typePageRules,
    typePageCommon: typePageCommon,
    rulebookCategories: rulebookCategories,
    rulebookCommon: rulebookCommon,
    rulebookConcrete: rulebookConcrete,
    rulebookKinds: rulebookKinds,
    sizeScale: sizeScale,
    undoRules: undoRules,
    undoCommon: undoCommon,
    seedClub: seedClub,
    greenTitle: greenTitle
  };

  app.content = {
    lang: 'en',

    /* ---------- The first move on the landing page ---------- */
    firstWin: {
      sayEmpty: 'No words yet.',
      task: {
        build: 'Tap the words to build an instruction.',
        ask: 'The assistant is waiting. Answer its question.',
        done: 'Look at the board and the preview.'
      },
      reply: {
        empty: 'Tap the words above to build your instruction first.',
        needAction: 'What should I do? Start with an action. Tap “Make”.',
        needObject: 'Make what? Name the thing you want. Tap “a web page”.',
        askWithText: 'I will make one new file called index.html. It is a web page that says “{text}”.',
        askNoText: 'I will make one new file called index.html. You did not say what the page should say, so I will write “{text}”.',
        denied: 'Nothing changed. I only move when you say yes. Announce the move again when you are ready.',
        done: 'Done. The file index.html is on the board.'
      },
      defaultText: 'Hello, world',
      fileName: 'index.html',
      askQuestion: 'May I create index.html?',
      board: {
        empty: 'Empty. No files yet.',
        oneFile: 'One file on the board: index.html.'
      },
      preview: {
        barEmpty: 'No file open',
        barFile: 'index.html'
      }
    },

    /* ---------- The level page ---------- */
    ui: {
      pageTitle: 'Play — Checkmate',
      levelTitle: '{name}: {move} — Checkmate',
      mapEyebrow: 'Level map',
      mapTitle: 'Choose your piece',
      mapLead: 'Each piece is one lesson. Pass a level to unlock the next one.',
      mapKey: 'A piece moves up the board as you finish steps. A check mark means the level is passed.',
      backToMap: 'Level map',
      levelEyebrow: 'Level {n} of {total}',
      stepLine: 'Step {n} of {total}',
      nextLine: 'Next: {next}',
      youSay: 'You say',
      noWords: 'No words yet.',
      theAssistant: 'The assistant',
      theAssistantAsks: 'The assistant asks',
      announce: 'Announce move',
      yes: 'Yes, go ahead',
      no: 'No',
      hintButton: 'Show a hint',
      hintButtonMore: 'Show another hint',
      hintNoMore: 'No more hints for this step.',
      hintLabel: 'Hint',
      typeLabel: 'Your instruction',
      rulesLabel: 'Your rules',
      typeHelp: 'Press Enter to announce your move, or use the button.',
      rulesHelp: 'Write one rule on each line.',
      reviewLine: 'Request {n} of {total}',
      reviewTypeLabel: 'What you say',
      compareLabel: 'Compare the page',
      compareBefore: 'Before',
      compareAfter: 'After',
      hintCheckNote: 'This is a check. If you use a hint, you will repeat the check without one.',
      kindsLabel: 'What this practice game understands',
      stuckTitle: 'Stuck after three tries?',
      stuckTextStep: 'A complete example is free in a practice step. You can still type your own answer after.',
      stuckTextCheck: 'Two ways out. A complete example counts as a hint, so the check repeats with new words. Starting again with new words costs nothing.',
      stuckTextRestart: 'You can start this check again with new words. It costs nothing.',
      stuckTextFinal: 'This level has no hints. You can start it again from the empty folder.',
      stuckExample: 'Show a complete example',
      stuckRestart: 'Restart the check with new words',
      stuckRestartFinal: 'Start this level again',
      exampleLabel: 'A complete example',
      exampleCheckNote: 'This is a check. A complete example counts as a hint, so you will repeat the check with new words.',
      nextStep: 'Next step',
      toQuestion: 'Go to the question',
      board: 'The board',
      boardNote: 'is your project folder',
      preview: 'Preview',
      previewNote: 'shows what the assistant made',
      boardEmpty: 'Empty. No files yet.',
      boardNew: 'new',
      boardChanged: 'changed',
      previewChanged: 'changed by the assistant',
      boardFiles: { one: 'One file on the board: {files}.', many: '{count} files on the board: {files}.' },
      previewNone: 'No file open',
      previewEmpty: 'Your page will show up here after your first move.',
      denied: 'Nothing changed. I only move when you say yes. Announce the move again when you are ready.',
      done: 'Done. The file {file} is on the board.',
      doneEdit: 'Done. I changed the file {file}.',
      hintUsedRepeat: 'You used a hint, so this check does not count. Do it again with new words and no hints.',
      repeatCheck: 'Repeat the check',
      questionLabel: 'Last question',
      questionRight: 'Right.',
      seeRecap: 'See what you learned',
      levelPassed: 'Level passed',
      recapTitle: 'Level {n} done: the {name}',
      recapConcept: 'The idea',
      recapReal: 'In the real tool',
      recapNext: 'Next piece',
      recapMapButton: 'Back to the level map',
      recapNextLevel: 'Level {n} is not available yet.',
      lockedLevel: 'Locked. Pass level {n} first, with no hints in its check.',
      comingSoon: 'Not available yet.',
      modeLabel: 'Mode',
      modeOn: '{mode} mode is on.',
      goalsLabel: 'Goals',
      goalsProgress: '{done} of {total} goals done',
      goalDone: 'Done:',
      goalTodo: 'To do:',
      captureHelp: 'Press Enter to announce your move. Use Shift+Enter for a new line.',
      recapFinale: 'See your card and checklist',
      mapFinaleLink: 'Your card and checklist',
      finaleEyebrow: 'The end',
      finaleLocked: 'The card and the checklist open when you pass level 6.',
      loading: 'Loading the level…',
      loadFailed: 'This level could not be loaded. Check your connection and try again.',
      levelPassedStatus: 'Passed.',
      levelOpenStatus: 'Ready to play.',
      levelStatusSteps: '{done} of {total} steps done.',
      playLevel: 'Play level {n}',
      replayLevel: 'Play level {n} again',
      mapFileLabel: 'Level {n}, {name}: {status}',
      statusPassed: 'passed',
      statusReady: 'ready',
      statusLocked: 'locked',
      statusSoon: 'not available yet',
      resetButton: 'Reset progress',
      resetAsk: 'This erases the steps you have finished on this device. It cannot be undone.',
      resetConfirm: 'Yes, erase my progress',
      resetKeep: 'Keep my progress',
      resetDone: 'Progress erased.',
      storageOff: 'Your browser does not let this page save progress. You can still play, but your steps will not be remembered.',
      privacy: 'Your progress is saved only on this device. Nothing is sent anywhere.'
    },

    /* ---------- The six pieces (the level map) ---------- */
    levelList: [
      { id: 1, piece: 'pawn', name: 'Pawn', move: 'The first move', blurb: 'Tell the assistant what you want and watch a page appear.', steps: 4, files: ['content/en-level-1.js'] },
      { id: 2, piece: 'knight', name: 'Knight', move: 'The unexpected jump', blurb: 'Ask for a change. See why exact words get exact results.', steps: 4, files: ['content/en-level-2.js'] },
      { id: 3, piece: 'bishop', name: 'Bishop', move: 'The long diagonal', blurb: 'Write a short rulebook the assistant reads before every game.', steps: 5, files: ['content/en-level-3.js'] },
      { id: 4, piece: 'rook', name: 'Rook', move: 'The straight line', blurb: 'Say yes, say no, and take back a move.', steps: 6, files: ['content/en-level-4.js'] },
      { id: 5, piece: 'queen', name: 'Queen', move: 'Full power', blurb: 'Ask for a plan first. Change it. Then approve it.', steps: 6, files: ['content/en-level-5.js'] },
      { id: 6, piece: 'king', name: 'King', move: 'Checkmate', blurb: 'Direct a small page from blank to done, with no hints.', steps: 2, files: ['content/en-level-6.js', 'js/capstone.js'] }
    ],

    /* Each level is its own file, loaded when the learner opens it (see js/play.js). */
    levels: {}
  };
})(typeof window !== 'undefined' ? window : globalThis);
