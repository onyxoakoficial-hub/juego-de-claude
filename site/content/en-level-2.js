/*
  Checkmate - level 2 lesson data (English).
  Loaded by js/play.js when the learner opens this level. See content/en.js for how a level is described.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  /* Every page the learner sees in levels 2 to 4 starts from these. */
  var pageSeed = [{ kind: 'page', file: 'index.html', text: 'Welcome to the club' }];

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
    return { question: 'May I change ' + what + '?', file: 'index.html', mark: '~', change: 'edit of an existing file' };
  };

  app.content.levels[2] = {
    showChanges: true,
    intro: 'Your first try is rarely perfect. Ask for a change, look at the result, then say exactly what you want.',
    steps: [
      {
        id: 'vague',
        kind: 'build',
        name: 'A vague change',
        task: 'Ask the assistant to make “it” better. Be vague on purpose, and see what comes back.',
        context: 'The file index.html is already on the board. The assistant will change that file, not make a new one. Use Before and After to compare.',
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
            reply: 'You did not say what to change or how. I will guess what “better” means: I will make the title bigger in the existing file index.html.',
            ask: editAsk('index.html'),
            effects: [{ kind: 'page', file: 'index.html', set: { size: 'large' } }],
            completes: true,
            verdict: 'The assistant changed the file that was already there, and it guessed. Use Before and After: is this what you wanted?'
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
            reply: 'I will change the title color to green in the existing file index.html.',
            ask: editAsk('index.html'),
            effects: [{ kind: 'page', file: 'index.html', set: { color: 'green' } }],
            completes: true,
            verdict: 'The assistant changed the file that was already there. This time the result matches what you asked for. Use Before and After to see it.'
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
            reply: 'I will change {change} in the existing file index.html.',
            ask: editAsk('index.html'),
            effects: [{ kind: 'page', file: 'index.html', set: 'variant' }],
            completes: true,
            verdict: 'That was exact, so the assistant did not have to guess. It changed the file that was already there.'
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
      concept: 'Say what to change and how. The assistant changes the file that is already there. Compare Before and After, then ask again.',
      items: [
        { label: 'The file', value: 'index.html', mono: true, note: 'The assistant changed this same file. It did not make a new one.' },
        { label: 'A clear change has', value: 'a part + how', mono: false, note: 'For example: the title + green.' }
      ],
      realStart: 'In the real tool, name the file or describe what you see. A specific prompt saves you a round of corrections.',
      next: 'Bishop'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
