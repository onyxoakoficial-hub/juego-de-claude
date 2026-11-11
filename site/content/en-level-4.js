/*
  Checkmate - level 4 lesson data (English).
  Loaded by js/play.js when the learner opens this level. See content/en.js for how a level is described.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var kit = app.kit;
  var HEAD = kit.HEAD;
  var undoRules = kit.undoRules;
  var undoCommon = kit.undoCommon;
  var seedClub = kit.seedClub;
  var greenTitle = kit.greenTitle;


  app.content.levels[4] = {
    showChanges: true,
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
