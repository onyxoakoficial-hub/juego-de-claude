/*
  Checkmate - level 6 lesson data (English): the King, the final project.
  Loaded by js/play.js (with js/capstone.js) when the learner opens this level.

  There are no hints here. A wrong move says what kind of thing to try, never the answer.
  Every sentence the assistant says in this level is in this file.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var kit = app.kit;

  /* The old files that are in the folder when the project starts. The page is not there yet. */
  var folder = [
    { kind: 'note', file: 'notes.txt', text: 'Old club notes.' },
    { kind: 'note', file: 'draft.txt', text: 'An old draft.' },
    { kind: 'note', file: 'old.html', text: 'An old page.' }
  ];

  app.content.levels[6] = {
    showChanges: true,
    intro: 'This is the whole game in one project. Direct the assistant from an empty folder to a finished page. There are no hints.',
    steps: [
      {
        id: 'build',
        kind: 'capstone',
        check: true,
        name: 'Build the club page',
        task: 'Direct the assistant until every goal on the list is checked.',
        context: 'You decide every move. Type what you want in your own words. Switch the mode when you need to. Read each request before you answer.',
        board: folder,
        footerDefault: 'Made by the chess club',
        junk: ['notes.txt', 'draft.txt', 'old.html'],

        goals: [
          { id: 'page', text: 'Make the page' },
          { id: 'improve', text: 'Improve it twice, with two different exact changes' },
          { id: 'rules', text: 'Save three rules in CLAUDE.md' },
          { id: 'deny', text: 'Say no to something you did not ask for' },
          { id: 'undo', text: 'Take one move back' },
          { id: 'plan', text: 'Approve a plan' }
        ],

        modes: [
          { id: 'manual', text: 'Manual' },
          { id: 'plan', text: 'Plan' }
        ],

        /* What the assistant listens for. */
        words: {
          act: kit.ACT.concat(['create', 'plan', 'draft']),
          page: kit.PAGE,
          head: kit.HEAD,
          undo: kit.UNDO,
          rule: ['rule', 'rules', 'rulebook', 'claude'],
          change: ['make', 'change', 'turn', 'set', 'paint', 'color', 'colour', 'improve', 'better', 'nicer', 'nice', 'fix', 'update']
        },
        categories: kit.rulebookCategories,
        concrete: kit.rulebookConcrete,
        sizeScale: kit.sizeScale,
        showKinds: true,

        plans: {
          create: {
            title: 'Plan: the club page',
            items: ['Create index.html', 'Add a heading that says Chess Club', 'Follow the rules in CLAUDE.md, if there are any']
          },
          change: {
            title: 'Plan: change the page',
            items: ['Open index.html', 'Change {what}', 'Leave everything else as it is']
          }
        },

        /* Everything the assistant says. */
        messages: {
          empty: 'Type your instruction first.',
          planNoEdit: 'Plan mode makes no edits. In this mode I can only plan. Switch the mode if you want me to change a file.',
          vagueRule: 'Rule {line} is too vague: “{text}”. A rule must say what to change and how. If it already says that, this practice game may not know it yet. It understands a color, a size, a text and a footer.',
          unsupportedRule: 'Rule {line}, “{text}”: that is a good rule, but this practice game can’t apply it yet. Try a color, a size, a text, or a footer.',
          unsupported: 'That is a good request, but this practice game can’t do it yet. Try a color, a size, a text, or a footer.',
          createRulebook: 'I will create CLAUDE.md with your rules. I will read it before I make anything.',
          updateRulebook: 'I will add your rules to CLAUDE.md. I will read it before I make anything.',
          askCreateRulebook: 'May I create CLAUDE.md?',
          askUpdateRulebook: 'May I update CLAUDE.md?',
          savedRulebook: 'Done. CLAUDE.md now holds your rules.',
          noRulebook: 'Nothing changed. CLAUDE.md was not saved.',
          nothingToUndo: 'There is nothing to take back yet, because nothing on the page has changed. Try that after you have made a change.',
          undone: 'I restored index.html to how it was before the last change.',
          pageExists: 'The page already exists. Tell me what to change in it.',
          createPage: 'I will make one new file called index.html. It is a web page for the club.',
          askCreatePage: 'May I create index.html?',
          createdPage: 'Done. The file index.html is on the board.',
          noPage: 'Nothing changed. index.html was not created.',
          noPageYet: 'There is no page yet, so there is nothing to change. Ask for the page first.',
          badCombo: 'That does not make sense for a background. Think about what a background can be.',
          needHow: 'Change the {part} how? Say what you want it to become.',
          needPart: 'Change what? Name the part of the page.',
          vague: 'I would have to guess. Say which part of the page, and how to change it.',
          notUnderstood: 'I did not understand that. Say what you want, in your own words.',
          changeReply: 'I will change {what} in the existing file index.html.',
          askChange: 'May I change {what}?',
          changedPage: 'Done. I changed {what} in index.html.',
          noChange: 'Nothing changed. index.html stays as it was.',
          whatTitleColor: 'the title color to {value}',
          whatTitleSize: 'the title size to {value}',
          whatBackground: 'the background to {value}',
          whatFooter: 'the footer',
          partTitle: 'title',
          partBackground: 'background',
          planReply: 'I read your project and wrote a plan. I did not change any file.',
          approvePlan: 'Do you approve this plan?',
          approveYes: 'Yes, manually approve edits',
          approveNo: 'No, keep planning',
          planApproved: 'Plan approved. I leave Plan mode now. I will ask before each edit.',
          planDiscarded: 'Plan discarded. Nothing changed.',
          unwantedReply: 'I also think {file} is no longer needed.',
          unwantedAsk: 'May I delete {file}?',
          unwantedYes: 'Done. {file} is deleted. You said yes, so I did it.',
          unwantedNo: 'Good. {file} stays.'
        },

        doneVerdict: 'Checkmate. You directed the assistant from an empty folder to a finished page.'
      },
      {
        id: 'why',
        kind: 'question',
        name: 'What happened',
        task: 'What did the assistant just do, and why?',
        context: 'Pick the answer that is true.',
        options: [
          { id: 'a', text: 'It did what I asked, and it asked me before every change. Nothing happened until I said yes.', right: true },
          { id: 'b', text: 'It built the page on its own, because it knew what the club needed.', why: 'Not quite. Every change started with your instruction and waited for your yes.' },
          { id: 'c', text: 'It followed its own plan and ignored my rules.', why: 'Not quite. It read the rules you saved in CLAUDE.md, and it made a plan only when you asked for one.' }
        ],
        rightWhy: 'You gave clear instructions, set rules, planned, and answered every request. The assistant did the work, and you made every decision.'
      }
    ],
    recap: {
      concept: 'You directed a whole project: clear instructions, rules, a plan, yes and no, and taking a move back.',
      items: [
        { label: 'What you practiced', value: 'six skills', mono: false, note: 'Ask clearly. Be exact. Write rules. Say yes or no. Take a move back. Plan first.' }
      ],
      realStart: 'The same moves work in the real tool. The next screen shows how to start your first real session.',
      next: null
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
