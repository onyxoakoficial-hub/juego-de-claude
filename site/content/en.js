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

  /* Answers shared by every build step. */
  var common = {
    empty: { type: 'hint', reply: 'Tap the words above to build your instruction first.' },
    thinkOnly: {
      type: 'hint',
      reply: 'I thought about it. Nothing on the board changed, because you did not ask me to make anything. Tap “Make” to get a result.'
    },
    needAction: { type: 'hint', reply: 'What should I do? Start with an action. Tap “Make”.' },
    needObject: { type: 'hint', reply: 'Make what? Name the thing you want. Tap “a web page”.' },
    vagueHere: {
      type: 'hint',
      reply: '“Something” is not clear enough here. Tap “a web page” so I know what to make.'
    },
    needText: {
      type: 'hint',
      reply: 'You did not say what the page should say. Tap the words, so I do not have to guess.'
    }
  };

  function withCommon(extra) {
    var out = {};
    Object.keys(common).forEach(function (key) { out[key] = common[key]; });
    Object.keys(extra).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }

  var buildGroups = function (words) {
    return [
      {
        id: 'action',
        label: 'What should I do?',
        options: [
          { id: 'make', text: 'Make' },
          { id: 'think', text: 'Think about' }
        ]
      },
      {
        id: 'object',
        label: 'What should I work on?',
        options: [
          { id: 'page', text: 'a web page' },
          { id: 'something', text: 'something' }
        ]
      },
      {
        id: 'text',
        label: 'What should the page say?',
        options: [{ id: 'words', text: 'that says “' + words + '”' }]
      }
    ];
  };


  /* Every page the learner sees in levels 2 to 4 starts from these. */
  var pageSeed = [{ kind: 'page', file: 'index.html', text: 'Welcome to the club' }];

  var seedClub = [
    { kind: 'page', file: 'index.html', text: 'Chess Club' },
    { kind: 'note', file: 'notes.txt', text: 'Club notes: Saturday at six.' }
  ];

  var greenTitle = { kind: 'page', file: 'index.html', set: { color: 'green' } };

  /* Level 2 tiles: the learner points at a part of the page and says how to change it. */
  var changeGroups = [
    { id: 'action', label: 'What should I do?', options: [{ id: 'make', text: 'Make' }, { id: 'think', text: 'Think about' }] },
    {
      id: 'target',
      label: 'What should I change?',
      options: [{ id: 'it', text: 'it' }, { id: 'title', text: 'the title' }, { id: 'background', text: 'the background' }]
    },
    {
      id: 'how',
      label: 'How?',
      options: [{ id: 'better', text: 'better' }, { id: 'green', text: 'green' }, { id: 'blue', text: 'blue' }, { id: 'bigger', text: 'bigger' }]
    }
  ];

  var changeCommon = {
    empty: { type: 'hint', reply: 'Tap the words above to build your instruction first.' },
    thinkOnly: {
      type: 'hint',
      reply: 'I thought about it. Nothing changed, because you did not ask me to change anything. Tap “Make” to get a result.'
    },
    needAction: { type: 'hint', reply: 'What should I do? Start with an action. Tap “Make”.' },
    needTarget: { type: 'hint', reply: 'Change what? Tap the part of the page you mean.' },
    needHow: { type: 'hint', reply: 'Change it how? Tap a color or a size.' },
    noSense: { type: 'hint', reply: 'A background cannot be bigger. Tap a color instead.' },
    itVague: { type: 'hint', reply: '“It” is not clear. Which part of the page? Tap “the title” or “the background”.' },
    betterVague: { type: 'hint', reply: '“Better” is not a color or a size. Tap a color, or tap “bigger”.' },
    notThisOne: {
      type: 'hint',
      reply: 'That is a clear instruction, but it is not the one in the task. Read the task, then tap the words again.'
    }
  };

  var editAsk = function (what) {
    return { question: 'May I change ' + what + '?', file: 'index.html', mark: '~', change: 'edit' };
  };

  /* Level 3 and 4: typed answers. Words the game listens for. */
  var ACT = ['make', 'create', 'build', 'write', 'add', 'generate'];
  var PAGE = ['page', 'website', 'webpage', 'site', 'html'];
  var HEAD = ['heading', 'headings', 'title', 'titles', 'header', 'headers'];
  var UNDO = ['undo', 'revert', 'rewind', '/rewind', 'back', 'reverse', 'restore'];

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

  var rulebookCategories = [
    {
      id: 'background',
      topic: 'the page background',
      when: { all: [['background', 'backgrounds'], ['green', 'blue', 'red', 'white']] },
      after: ['background', 'backgrounds'],
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
      when: { all: [['big', 'bigger', 'large', 'larger', 'huge', 'small', 'smaller']] },
      values: { big: 'large', bigger: 'large', large: 'large', larger: 'large', huge: 'large', small: 'small', smaller: 'small' }
    }
  ];

  var rulebookCommon = {
    empty: { type: 'hint', reply: 'Write at least one rule first. A hint can help.' },
    vague: {
      type: 'hint',
      reply: 'Rule {line} is too vague: “{text}”. A rule must say what to change and how. For example: “Headings are green.”'
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
      nextStep: 'Next step',
      toQuestion: 'Go to the question',
      board: 'The board',
      boardNote: 'is your project folder',
      preview: 'Preview',
      previewNote: 'shows what the assistant made',
      boardEmpty: 'Empty. No files yet.',
      boardFiles: { one: 'One file on the board: {files}.', many: '{count} files on the board: {files}.' },
      previewNone: 'No file open',
      previewEmpty: 'Your page will show up here after your first move.',
      denied: 'Nothing changed. I only move when you say yes. Announce the move again when you are ready.',
      done: 'Done. The file {file} is on the board.',
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
      recapNextLevel: 'Level {n} is not built yet. It comes next in this project.',
      lockedLevel: 'Locked. Pass level {n} first, with no hints in its check.',
      comingSoon: 'Not built yet. It is coming in a later part of this project.',
      levelPassedStatus: 'Passed.',
      levelOpenStatus: 'Ready to play.',
      levelStatusSteps: '{done} of {total} steps done.',
      playLevel: 'Play level {n}',
      replayLevel: 'Play level {n} again',
      mapFileLabel: 'Level {n}, {name}: {status}',
      statusPassed: 'passed',
      statusReady: 'ready',
      statusLocked: 'locked',
      statusSoon: 'not built yet',
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
      { id: 1, piece: 'pawn', name: 'Pawn', move: 'The first move', blurb: 'Tell the assistant what you want and watch a page appear.' },
      { id: 2, piece: 'knight', name: 'Knight', move: 'The unexpected jump', blurb: 'Ask for a change. See why exact words get exact results.' },
      { id: 3, piece: 'bishop', name: 'Bishop', move: 'The long diagonal', blurb: 'Write a short rulebook the assistant reads before every game.' },
      { id: 4, piece: 'rook', name: 'Rook', move: 'The straight line', blurb: 'Say yes, say no, and take back a move.' },
      { id: 5, piece: 'queen', name: 'Queen', move: 'Full power', blurb: 'Ask for a plan first. Change it. Then approve it.' },
      { id: 6, piece: 'king', name: 'King', move: 'Checkmate', blurb: 'Direct a small page from blank to done, with no hints.' }
    ],

    /* ---------- Level 1: the Pawn ---------- */
    levels: {
      1: {
        intro: 'The assistant does what you ask. Your job is to ask clearly, and to say yes or no.',
        steps: [
          {
            id: 'first',
            kind: 'build',
            name: 'Make a page',
            task: 'Ask the assistant to make a web page that says “{words}”. Tap the words, then announce your move.',
            context: 'The instruction you give is called a prompt. The assistant reads it and tells you what it plans to do.',
            variants: [{ words: 'Welcome to the club' }],
            groups: buildGroups('{words}'),
            hints: [
              'Start with an action word. Which one makes something?',
              'Tap “Make”, then “a web page”, then the words about the club.'
            ],
            rules: [
              { when: { action: null, object: null, text: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { object: null }, outcome: 'needObject' },
              { when: { object: 'something' }, outcome: 'vagueHere' },
              { when: { text: null }, outcome: 'needText' },
              { when: {}, outcome: 'good' }
            ],
            outcomes: withCommon({
              good: {
                type: 'ask',
                reply: 'I will make one new file called index.html. It is a web page that says “{words}”.',
                ask: { question: 'May I create index.html?', file: 'index.html' },
                effect: { kind: 'page', file: 'index.html', text: '{words}' },
                completes: true,
                verdict: 'You said what you wanted. The assistant made the file only after you said yes.'
              }
            })
          },
          {
            id: 'vague',
            kind: 'build',
            name: 'See a vague answer',
            task: 'Now see what a vague instruction gets. Ask the assistant to make “something”.',
            context: 'The assistant cannot read your mind. When you leave things out, it has to guess.',
            variants: [{ words: 'Welcome to the club' }],
            groups: buildGroups('{words}'),
            hints: [
              'This time, be vague on purpose. One of the object tiles is vague.',
              'Tap “Make” and “something”. Leave the words tile alone.'
            ],
            rules: [
              { when: { action: null, object: null, text: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { object: null }, outcome: 'needObject' },
              { when: { object: 'page' }, outcome: 'tooClear' },
              { when: { object: 'something' }, outcome: 'vague' }
            ],
            outcomes: withCommon({
              needObject: { type: 'hint', reply: 'Make what? Tap “something” to see what a vague instruction gets.' },
              tooClear: {
                type: 'hint',
                reply: 'That one is exact, and it works. This time tap “something” instead, to see what a vague instruction gets.'
              },
              vague: {
                type: 'ask',
                reply: 'You did not say what to make or what it should say. I will guess: a plain note called note.txt.',
                ask: { question: 'May I create note.txt?', file: 'note.txt' },
                effect: { kind: 'note', file: 'note.txt', text: '(an empty note)' },
                completes: true,
                verdict: 'The assistant guessed, and you got an empty note. A clear instruction means no guessing.'
              }
            })
          },
          {
            id: 'check',
            kind: 'build',
            check: true,
            name: 'Check: ask clearly',
            task: 'Check. Ask for a web page that says “{words}”. Try it without a hint.',
            context: 'Clear instruction: an action, the thing you want, and the details.',
            variants: [{ words: 'Open on Saturday' }, { words: 'Bring a friend' }, { words: 'Chess at six' }],
            groups: buildGroups('{words}'),
            hints: [
              'You need three things: an action, the thing, and the words.',
              'Tap “Make”, “a web page”, and the words tile.'
            ],
            rules: [
              { when: { action: null, object: null, text: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { object: null }, outcome: 'needObject' },
              { when: { object: 'something' }, outcome: 'vagueHere' },
              { when: { text: null }, outcome: 'needText' },
              { when: {}, outcome: 'good' }
            ],
            outcomes: withCommon({
              good: {
                type: 'ask',
                reply: 'I will make one new file called check.html. It is a web page that says “{words}”.',
                ask: { question: 'May I create check.html?', file: 'check.html' },
                effect: { kind: 'page', file: 'check.html', text: '{words}' },
                completes: true,
                verdict: 'That was a clear instruction, so the assistant did not have to guess.'
              }
            })
          },
          {
            id: 'why',
            kind: 'question',
            name: 'Why it worked',
            task: 'What did the assistant just do, and why?',
            context: 'Pick the answer that is true.',
            options: [
              { id: 'a', text: 'It asked me first, then made the file because I said yes.', right: true },
              { id: 'b', text: 'It made the file on its own, because it knew what I wanted.', why: 'Not quite. It asked first. Nothing changes until you say yes.' },
              { id: 'c', text: 'It only showed a picture. No file was made.', why: 'Not quite. The board shows a real file the assistant made.' }
            ],
            rightWhy: 'The assistant never changes anything until you say yes. A clear instruction decides what it makes.'
          }
        ],
        recap: {
          concept: 'A prompt is a clear instruction. The assistant tells you its plan and waits for your yes.',
          items: [
            { label: 'File you made', value: 'index.html', mono: true, note: 'The page you made is a file. Files are the pieces on your board.' }
          ],
          realStart: 'To start the real tool, open the Code tab in the Claude desktop app, or type claude in a terminal.',
          next: 'Knight'
        }
      },

      /* ---------- Level 2: the Knight ---------- */
      2: {
        intro: 'Your first try is rarely perfect. Ask for a change, look at the result, then say exactly what you want.',
        steps: [
          {
            id: 'vague',
            kind: 'build',
            name: 'A vague change',
            task: 'Ask the assistant to make “it” better. Be vague on purpose, and see what comes back.',
            context: 'The page on the right says “Welcome to the club”. Use Before and After to compare it with the result.',
            board: pageSeed,
            variants: [{}],
            groups: changeGroups,
            hints: ['This time, be vague on purpose. Which tiles say very little?', 'Tap “Make”, “it” and “better”.'],
            rules: [
              { when: { action: null, target: null, how: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { target: null }, outcome: 'needTarget' },
              { when: { how: null }, outcome: 'needHow' },
              { when: { target: 'it', how: 'better' }, outcome: 'vague' },
              { when: {}, outcome: 'notVague' }
            ],
            outcomes: Object.assign({}, changeCommon, {
              notVague: { type: 'hint', reply: 'That one is clear, and it works. This time be vague on purpose: tap “it” and “better”.' },
              vague: {
                type: 'ask',
                reply: 'You did not say what to change or how. I will guess what “better” means: I will make the title bigger.',
                ask: editAsk('index.html'),
                effects: [{ kind: 'page', file: 'index.html', set: { size: 'large' } }],
                completes: true,
                verdict: 'The assistant guessed. Use Before and After: is this what you wanted? A clear instruction means no guessing.'
              }
            })
          },
          {
            id: 'exact',
            kind: 'build',
            name: 'An exact change',
            task: 'Now say exactly what you want. Ask the assistant to make the title green.',
            context: 'A clear change names the part of the page and says how to change it.',
            board: pageSeed,
            variants: [{}],
            groups: changeGroups,
            hints: ['Name the part of the page, and say the color.', 'Tap “Make”, “the title” and “green”.'],
            rules: [
              { when: { action: null, target: null, how: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { target: null }, outcome: 'needTarget' },
              { when: { how: null }, outcome: 'needHow' },
              { when: { target: 'background', how: 'bigger' }, outcome: 'noSense' },
              { when: { target: 'it' }, outcome: 'itVague' },
              { when: { how: 'better' }, outcome: 'betterVague' },
              { when: { target: 'title', how: 'green' }, outcome: 'good' },
              { when: {}, outcome: 'notThisOne' }
            ],
            outcomes: Object.assign({}, changeCommon, {
              good: {
                type: 'ask',
                reply: 'I will change the title color to green in index.html.',
                ask: editAsk('index.html'),
                effects: [{ kind: 'page', file: 'index.html', set: { color: 'green' } }],
                completes: true,
                verdict: 'This time the result matches what you asked for. Use Before and After to see the difference.'
              }
            })
          },
          {
            id: 'check',
            kind: 'build',
            check: true,
            name: 'Check: be exact',
            task: 'Check. Make {words}. Try it without a hint.',
            context: 'Name the part of the page and say how to change it.',
            board: pageSeed,
            variants: [
              { part: 'title', how: 'blue', words: 'the title blue', change: 'the title color to blue', set: { color: 'blue' } },
              { part: 'background', how: 'green', words: 'the background green', change: 'the background to green', set: { bg: 'green' } },
              { part: 'title', how: 'bigger', words: 'the title bigger', change: 'the title size to bigger', set: { size: 'large' } }
            ],
            groups: changeGroups,
            hints: ['You need an action, a part of the page, and how to change it.', 'Look at the task. Tap “Make”, then the part, then the color or size.'],
            rules: [
              { when: { action: null, target: null, how: null }, outcome: 'empty' },
              { when: { action: 'think' }, outcome: 'thinkOnly' },
              { when: { action: null }, outcome: 'needAction' },
              { when: { target: null }, outcome: 'needTarget' },
              { when: { how: null }, outcome: 'needHow' },
              { when: { target: 'background', how: 'bigger' }, outcome: 'noSense' },
              { when: { target: 'it' }, outcome: 'itVague' },
              { when: { how: 'better' }, outcome: 'betterVague' },
              { when: { target: '$part', how: '$how' }, outcome: 'good' },
              { when: {}, outcome: 'notThisOne' }
            ],
            outcomes: Object.assign({}, changeCommon, {
              good: {
                type: 'ask',
                reply: 'I will change {change} in index.html.',
                ask: editAsk('index.html'),
                effects: [{ kind: 'page', file: 'index.html', set: 'variant' }],
                completes: true,
                verdict: 'That was exact, so the assistant did not have to guess.'
              }
            })
          },
          {
            id: 'why',
            kind: 'question',
            name: 'Why it worked',
            task: 'Why did “make it better” give a weak result?',
            context: 'Pick the answer that is true.',
            options: [
              { id: 'a', text: 'I did not say what to change or how, so the assistant had to guess.', right: true },
              { id: 'b', text: 'The assistant was not trying hard enough.', why: 'Not quite. The assistant did its best with very little to go on.' },
              { id: 'c', text: 'The page was too small to change.', why: 'Not quite. The same page changed well when the instruction was exact.' }
            ],
            rightWhy: 'A clear change names the part and says how. The less you leave out, the less the assistant has to guess.'
          }
        ],
        recap: {
          concept: 'Say what to change and how. Then compare Before and After, and ask again.',
          items: [
            { label: 'A clear change has', value: 'a part + how', mono: false, note: 'For example: the title + green.' }
          ],
          realStart: 'In the real tool, name the file or describe what you see. A specific prompt saves you a round of corrections.',
          next: 'Bishop'
        }
      },

      /* ---------- Level 3: the Bishop ---------- */
      3: {
        intro: 'A rulebook is a file the assistant reads before it starts. Write clear rules once, and every page follows them.',
        steps: [
          {
            id: 'plain',
            kind: 'type',
            name: 'A page with no rules',
            task: 'Ask the assistant to make a web page. Type it in your own words. There is no rulebook yet.',
            context: 'Watch how the assistant picks a style when nobody tells it what you like.',
            board: [],
            variants: [{}],
            hints: ['Say what you want made. Which two things does a good instruction need?', 'For example: “Make a web page”.'],
            rules: typePageRules,
            outcomes: Object.assign({}, typePageCommon, {
              good: {
                type: 'ask',
                reply: 'I will make one new file called index.html. There is no rulebook yet, so I choose the style myself.',
                ask: { question: 'May I create index.html?', file: 'index.html', mark: '+', change: 'new file' },
                effects: [{ kind: 'page', file: 'index.html', text: 'Chess Club' }],
                completes: true,
                verdict: 'A plain page. Next you will write a rulebook, so the assistant knows what you like.'
              }
            })
          },
          {
            id: 'first-rule',
            kind: 'rules',
            name: 'Write a rule',
            task: 'Write one rule for your pages. Say what to change and how.',
            context: 'Rules go in a file called CLAUDE.md. A good rule is clear enough to check.',
            board: [{ kind: 'page', file: 'index.html', text: 'Chess Club' }],
            rows: 2,
            variants: [{}],
            need: [],
            categories: rulebookCategories,
            hints: ['Think of one thing you want on every page. A color is an easy start.', 'For example: “Headings are green.”'],
            outcomes: Object.assign({}, rulebookCommon, {
              good: {
                type: 'ask',
                reply: 'I will create CLAUDE.md with your rule. I will read it every time I start.',
                ask: { question: 'May I create CLAUDE.md?', file: 'CLAUDE.md', mark: '+', change: 'new file' },
                effects: [{ kind: 'rulebook', file: 'CLAUDE.md' }],
                completes: true,
                verdict: 'The rulebook is a file in your project. The assistant reads it before it starts working.'
              }
            })
          },
          {
            id: 'watch',
            kind: 'type',
            name: 'Watch the rule work',
            task: 'Ask for a web page again, in your own words. Then compare Before and After.',
            context: 'This time the assistant reads CLAUDE.md first.',
            board: [
              { kind: 'page', file: 'index.html', text: 'Chess Club' },
              { kind: 'rulebook', file: 'CLAUDE.md', lines: ['Headings are green.'], rules: [{ cat: 'color', value: 'green' }] }
            ],
            variants: [{}],
            hints: ['Ask for a page like before.', 'For example: “Make a web page”.'],
            rules: typePageRules,
            outcomes: Object.assign({}, typePageCommon, {
              good: {
                type: 'ask',
                reply: 'I read CLAUDE.md first. I will update index.html and follow your rules.',
                ask: { question: 'May I update index.html?', file: 'index.html', mark: '~', change: 'edit' },
                effects: [{ kind: 'page', file: 'index.html', text: 'Chess Club', applyRules: true }],
                completes: true,
                verdict: 'You did not repeat yourself. The rulebook did the work. Use Before and After to see it.'
              }
            })
          },
          {
            id: 'check',
            kind: 'rules',
            check: true,
            name: 'Check: three rules',
            task: 'Check. Write three rules for the club page: {topics}. Put each rule on its own line.',
            context: 'Each rule must say what to change and how.',
            board: [],
            rows: 4,
            variants: [
              { need: ['color', 'footer', 'background'], topics: 'the heading color, a footer line and the page background' },
              { need: ['footer', 'background', 'size'], topics: 'a footer line, the page background and the heading size' },
              { need: ['color', 'size', 'footer'], topics: 'the heading color, the heading size and a footer line' }
            ],
            categories: rulebookCategories,
            hints: ['One rule on each line. Each rule is about one topic from the task.', 'For example: “Headings are green.” “The background is blue.” “Add a footer that says Made by the club.”'],
            outcomes: Object.assign({}, rulebookCommon, {
              good: {
                type: 'ask',
                reply: 'I will create CLAUDE.md with your rules. Then I will make a page that follows them.',
                ask: { question: 'May I create CLAUDE.md and a page?', file: 'CLAUDE.md', mark: '+', change: 'new file' },
                effects: [
                  { kind: 'rulebook', file: 'CLAUDE.md' },
                  { kind: 'page', file: 'rules.html', text: 'Chess Club', applyRules: true }
                ],
                completes: true,
                verdict: 'Three clear rules, and the page follows all of them.'
              }
            })
          },
          {
            id: 'why',
            kind: 'question',
            name: 'Why it worked',
            task: 'What did the rulebook do?',
            context: 'Pick the answer that is true.',
            options: [
              { id: 'a', text: 'The assistant read it before starting, and followed my rules.', right: true },
              { id: 'b', text: 'The assistant forgot it and made the page its own way.', why: 'Not quite. The page followed your rules.' },
              { id: 'c', text: 'It changed the page by itself, without me asking.', why: 'Not quite. The rulebook does not act alone. It tells the assistant how to work when you ask.' }
            ],
            rightWhy: 'CLAUDE.md is read at the start of every session. It guides the assistant, so clear rules work best.'
          }
        ],
        recap: {
          concept: 'A rulebook is a file the assistant reads before it starts. Clear rules work best.',
          items: [
            { label: 'File you made', value: 'CLAUDE.md', mono: true, note: 'It sits in your project folder, next to your other files.' }
          ],
          realStart: 'In the real tool the file is called CLAUDE.md. Write it yourself, or run /init and Claude Code drafts one. Claude treats it as guidance, so short, clear rules work best.',
          next: 'Rook'
        }
      },

      /* ---------- Level 4: the Rook ---------- */
      4: {
        intro: 'You decide every move. Learn to say yes, say no, and take a move back.',
        steps: [
          {
            id: 'mode',
            kind: 'build',
            name: 'Choose Manual mode',
            task: 'Pick the mode where the assistant asks before every change.',
            context: 'In the desktop app, the mode selector is in the row under the prompt box. In a terminal, press Shift+Tab to change mode.',
            board: seedClub,
            sayLabel: 'Mode',
            announceLabel: 'Set this mode',
            variants: [{}],
            groups: [
              {
                id: 'mode',
                label: 'Which mode?',
                options: [
                  { id: 'manual', text: 'Manual' },
                  { id: 'acceptEdits', text: 'Accept edits' },
                  { id: 'plan', text: 'Plan' },
                  { id: 'auto', text: 'Auto' }
                ]
              }
            ],
            hints: ['One mode makes the assistant stop and ask before it changes anything. Its name says you do it by hand.', 'Tap “Manual”.'],
            rules: [
              { when: { mode: null }, outcome: 'empty' },
              { when: { mode: 'manual' }, outcome: 'manual' },
              { when: { mode: 'acceptEdits' }, outcome: 'acceptEdits' },
              { when: { mode: 'plan' }, outcome: 'plan' },
              { when: { mode: 'auto' }, outcome: 'auto' }
            ],
            outcomes: {
              empty: { type: 'hint', reply: 'Tap a mode first. Which one asks before every change?' },
              acceptEdits: {
                type: 'hint',
                reply: 'Accept edits lets me change files without asking. I still ask before other actions. Tap the mode where I ask before every change.'
              },
              plan: {
                type: 'hint',
                reply: 'Plan mode is for making a plan first. You will use it in level 5. For now, tap the mode where I ask before every change.'
              },
              auto: {
                type: 'hint',
                reply: 'In Auto mode, a background checker reviews my actions instead of you. In this game you decide, so tap Manual.'
              },
              manual: {
                type: 'done',
                reply: 'Manual mode is on. From now on I ask before I change anything.',
                completes: true,
                verdict: 'Before your first message in the real tool, look at the mode selector and choose Manual.'
              }
            }
          },
          {
            id: 'yes',
            kind: 'type',
            name: 'Say yes',
            task: 'Ask for the title color to be green. Type it in your own words.',
            context: 'Read what the assistant plans to do. Then you decide.',
            board: seedClub,
            variants: [{}],
            hints: ['Say which part of the page, and which color.', 'For example: “Make the title green”.'],
            rules: [
              { when: { empty: true }, outcome: 'empty' },
              { when: { all: [HEAD], none: [['green']] }, outcome: 'needColor' },
              { when: { all: [['green']], none: [HEAD, ['background']] }, outcome: 'needPart' },
              { when: { all: [HEAD, ['green']] }, outcome: 'good' },
              { when: {}, outcome: 'notUnderstood' }
            ],
            outcomes: {
              empty: { type: 'hint', reply: 'Type your instruction first. A hint can help.' },
              needColor: { type: 'hint', reply: 'Which color? Type the color you want, like “green”.' },
              needPart: { type: 'hint', reply: 'Green for which part of the page? Type “the title”.' },
              notUnderstood: { type: 'hint', reply: 'I did not understand that. Try something like “Make the title green”.' },
              good: {
                type: 'ask',
                reply: 'I will change the title color to green in index.html.',
                ask: { question: 'May I change index.html?', file: 'index.html', mark: '~', change: 'edit' },
                effects: [greenTitle],
                completes: true,
                verdict: 'You read the plan, then said yes. That is how you stay in control.'
              }
            }
          },
          {
            id: 'no',
            kind: 'review',
            name: 'Say no',
            task: 'You asked for a green title. Now the assistant asks for something else. Read it, then answer.',
            context: 'You only say yes to what you asked for.',
            board: seedClub.concat([greenTitle]),
            variants: [{}],
            hints: ['Did you ask for this? Read the file name and the word next to it.', 'You asked only for a green title. Tap No.'],
            events: [
              {
                kind: 'ask',
                ask: { question: 'May I delete notes.txt?', file: 'notes.txt', mark: '-', change: 'delete' },
                correct: 'no',
                wrongReply: 'You asked for a green title, not for notes.txt to be deleted. Read the question again, then tap No.',
                noReply: 'Good. Nothing was deleted. When a request is not what you asked for, say no.'
              }
            ],
            doneVerdict: 'You said no, so nothing changed. You always have the last word.'
          },
          {
            id: 'undo',
            kind: 'type',
            name: 'Take a move back',
            task: 'The title is green, but you changed your mind. Take that move back. Type it in your own words.',
            context: 'In the real tool you can ask the assistant to undo a change.',
            board: [{ kind: 'page', file: 'index.html', text: 'Chess Club' }, greenTitle],
            variants: [{}],
            hints: ['Say you want to go back. Which words mean that?', 'For example: “undo that” or “take that back”.'],
            rules: undoRules,
            outcomes: Object.assign({}, undoCommon, {
              good: {
                type: 'done',
                reply: 'I restored index.html to how it was before the color change.',
                effects: [{ kind: 'undo', file: 'index.html' }],
                completes: true,
                verdict: 'The title is back to how it was. Taking a move back is part of the game.'
              }
            })
          },
          {
            id: 'check',
            kind: 'review',
            check: true,
            name: 'Check: stay in control',
            task: 'Check. You asked: “Change the title color to {color}.” The assistant will ask for two things. Say yes only to what you asked for. Then take the color change back.',
            context: 'Read each request before you answer.',
            board: [{ kind: 'page', file: 'index.html', text: 'Chess Club' }, { kind: 'note', file: '{junk}', text: 'An old file.' }],
            variants: [
              { color: 'blue', junk: 'draft.txt' },
              { color: 'red', junk: 'old.html' },
              { color: 'green', junk: 'plan.txt' }
            ],
            hints: ['Read each request. Did you ask for it?', 'Say yes to the color change, say no to the delete, then type that you want to undo.'],
            events: [
              {
                kind: 'ask',
                ask: { question: 'May I delete {junk}?', file: '{junk}', mark: '-', change: 'delete' },
                correct: 'no',
                wrongReply: 'You did not ask for {junk} to be deleted. Read the request again, then tap No.',
                noReply: 'Good. {junk} stays, because you did not ask for that.'
              },
              {
                kind: 'ask',
                ask: { question: 'May I change the title color to {color}?', file: 'index.html', mark: '~', change: 'edit' },
                correct: 'yes',
                wrongReply: 'You asked for the title to be {color}. Read the request again, then tap Yes.',
                yesReply: 'Done. The title color is {color}.',
                yesEffects: [{ kind: 'page', file: 'index.html', set: { color: '{color}' } }]
              },
              {
                kind: 'type',
                prompt: 'Now take the color change back. Type it in your own words.',
                rules: undoRules,
                outcomes: Object.assign({}, undoCommon, {
                  good: {
                    type: 'done',
                    reply: 'I restored index.html to how it was before the color change.',
                    effects: [{ kind: 'undo', file: 'index.html' }],
                    completes: true
                  }
                })
              }
            ],
            doneVerdict: 'You said yes only to what you asked for, and you took a move back.'
          },
          {
            id: 'why',
            kind: 'question',
            name: 'What undo can do',
            task: 'Which is true about taking a move back?',
            context: 'Pick the answer that is true.',
            options: [
              { id: 'a', text: 'It undoes changes the assistant made to files. A file changed only by a command may need Git instead.', right: true },
              { id: 'b', text: 'It can undo anything, including every command.', why: 'Not quite. Undo covers files the assistant edited, not everything a command does.' },
              { id: 'c', text: 'It replaces Git, so you never need to save your work another way.', why: 'Not quite. Undo is for quick recovery. Git keeps the permanent history.' }
            ],
            rightWhy: 'Undo covers the files the assistant edited. For anything else, and for a permanent history, use Git.'
          }
        ],
        recap: {
          concept: 'You decide each move: say yes, say no, or take it back.',
          items: [
            { label: 'The mode that asks first', value: 'Manual', mono: true, note: 'Check the mode selector before your first message. In Auto, a background checker decides instead of you.' },
            { label: 'Take a move back', value: 'ask the assistant to undo', mono: false, note: 'In a terminal you can also type /rewind, or press Esc twice with the prompt box empty.' },
            { label: 'Two limits', value: 'files, and the empty box', mono: false, note: 'Undo covers files the assistant edited, not files changed only by a command. With text in the box, Esc twice clears the text.' }
          ],
          realStart: 'In the desktop app the mode selector is in the row under the prompt box. In a terminal, press Shift+Tab to change mode.',
          next: 'Queen'
        }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
