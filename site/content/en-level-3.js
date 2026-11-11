/*
  Checkmate - level 3 lesson data (English).
  Loaded by js/play.js when the learner opens this level. See content/en.js for how a level is described.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var kit = app.kit;
  var typePageRules = kit.typePageRules;
  var typePageCommon = kit.typePageCommon;
  var rulebookCategories = kit.rulebookCategories;
  var rulebookCommon = kit.rulebookCommon;
  var concrete = kit.rulebookConcrete;


  app.content.levels[3] = {
    showChanges: true,
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
        example: 'Make a web page.',
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
        concrete: concrete,
        showKinds: true,
        example: 'Headings are green.',
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
        example: 'Make a web page.',
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
          { need: ['color', 'footer', 'background'], topics: 'the heading color, a footer line and the page background', example: 'Headings are green.\nThe background is blue.\nAdd a footer that says Made by the club.' },
          { need: ['footer', 'background', 'size'], topics: 'a footer line, the page background and the heading size', example: 'Add a footer that says Made by the club.\nThe background is blue.\nHeadings are 48px.' },
          { need: ['color', 'size', 'footer'], topics: 'the heading color, the heading size and a footer line', example: 'Headings are green.\nHeadings are big.\nAdd a footer that says Made by the club.' }
        ],
        categories: rulebookCategories,
        concrete: concrete,
        showKinds: true,
        example: '{example}',
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
