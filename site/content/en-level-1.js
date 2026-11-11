/*
  Checkmate - level 1 lesson data (English).
  Loaded by js/play.js when the learner opens this level. See content/en.js for how a level is described.
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
  app.content.levels[1] = {
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
