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
      hintCheckNote: 'This is a check. If you use a hint, you will repeat the check without one.',
      nextStep: 'Next step',
      toQuestion: 'Go to the question',
      newFile: 'new file',
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
          file: 'index.html',
          fileNote: 'The page you made is a file. Files are the pieces on your board.',
          realStart: 'To start the real tool, open the Code tab in the Claude desktop app, or type claude in a terminal.',
          next: 'Knight'
        }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
