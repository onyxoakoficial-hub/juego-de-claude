/*
  Checkmate - level 5 lesson data (English): the Queen, Plan mode.
  Loaded by js/play.js when the learner opens this level. See content/en.js for how a level is described.

  Facts about Claude Code in this level come from the official documentation (see content/facts.js, group "plan").
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var kit = app.kit;

  var seed = [{ kind: 'page', file: 'index.html', text: 'Chess Club' }];

  /* The words the game listens for in this level. */
  var ACT = kit.ACT.concat(['plan', 'design', 'draft', 'propose']);
  var PAGE = kit.PAGE.concat(['schedule', 'timetable', 'calendar']);
  var REMOVE = ['remove', 'drop', 'delete', 'skip', 'cut', 'without', 'scrap', 'omit', 'no', 'not', 'dont', 'out', 'leave', 'rid'];

  var planRequestRules = [
    { when: { empty: true }, outcome: 'empty' },
    { when: { all: [ACT], none: [PAGE] }, outcome: 'needObject' },
    { when: { all: [PAGE], none: [ACT] }, outcome: 'needAction' },
    { when: { all: [ACT, PAGE] }, outcome: 'good' },
    { when: {}, outcome: 'notUnderstood' }
  ];

  var planRequestCommon = {
    empty: { type: 'hint', reply: 'Type your request first. A hint can help.' },
    needAction: { type: 'hint', reply: 'I could not tell what to do. Type an action first, like “plan” or “make”.' },
    needObject: { type: 'hint', reply: 'A plan for what? Type the thing you want, like “a schedule page”.' },
    notUnderstood: { type: 'hint', reply: 'I did not understand that. Try something like “Plan a schedule page”.' }
  };

  /* Changing the plan: name the step you do not want, and say what to do with it. */
  var editRules = [
    { when: { empty: true }, outcome: 'empty' },
    { when: { all: [REMOVE, '$target'] }, outcome: 'good' },
    { when: { all: ['$target'], none: [REMOVE] }, outcome: 'needAction' },
    { when: { all: [REMOVE, ['1', '2', '3', 'one', 'two', 'three', 'first', 'second', 'third', 'heading']] }, outcome: 'wrongStep' },
    { when: { all: [REMOVE] }, outcome: 'needTarget' },
    { when: {}, outcome: 'notUnderstood' }
  ];

  var editCommon = {
    empty: { type: 'hint', reply: 'Type what you want to change in the plan. A hint can help.' },
    needAction: { type: 'hint', reply: 'What should I do with that step? Type it, for example “remove”.' },
    wrongStep: { type: 'hint', reply: 'That step is part of what you asked for. Try naming the step that is more than you asked for.' },
    needTarget: { type: 'hint', reply: 'I am not sure which step you mean. Type the step you do not want, by its number or by what it is.' },
    notUnderstood: { type: 'hint', reply: 'I did not understand that. Try something like “Remove step 2”.' }
  };

  var approveLabels = { yesLabel: 'Yes, manually approve edits', noLabel: 'No, keep planning' };

  /* The first plan, then the same plan with the step the learner did not want taken out. */
  var schedulePlan = {
    title: 'Plan: a schedule page',
    items: ['Create schedule.html', 'Add a heading that says Club schedule', 'Add a table with the meeting days', 'Add a photo gallery of past games']
  };

  var scheduleRevised = {
    title: 'Updated plan: a schedule page',
    items: ['Create schedule.html', 'Add a heading that says Club schedule', 'Add a table with the meeting days']
  };

  var scheduleTarget = ['4', 'four', 'fourth', 'last', 'gallery', 'photo', 'photos', 'pictures', 'images'];

  app.content.levels[5] = {
    showChanges: true,
    intro: 'Before the assistant builds something big, ask for a plan. Read it, change it, and approve it.',
    steps: [
      {
        id: 'mode',
        kind: 'build',
        name: 'Switch to Plan mode',
        task: 'Pick the mode where the assistant makes a plan first, and changes nothing.',
        context: 'In a terminal, press Shift+Tab to change mode, or start one message with /plan. In the desktop app, use the mode selector in the row under the prompt box.',
        board: seed,
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
        hints: ['One mode name says what you want: you are going to plan.', 'Tap “Plan”.'],
        rules: [
          { when: { mode: null }, outcome: 'empty' },
          { when: { mode: 'plan' }, outcome: 'plan' },
          { when: { mode: 'manual' }, outcome: 'manual' },
          { when: { mode: 'acceptEdits' }, outcome: 'acceptEdits' },
          { when: { mode: 'auto' }, outcome: 'auto' }
        ],
        outcomes: {
          empty: { type: 'hint', reply: 'Tap a mode first. Which one makes a plan?' },
          manual: { type: 'hint', reply: 'Manual mode asks before each change, but it does not make a plan first. Tap the mode that plans.' },
          acceptEdits: { type: 'hint', reply: 'Accept edits lets me change files without asking. That is not a plan. Tap the mode that plans.' },
          auto: { type: 'hint', reply: 'In Auto mode, a background checker reviews my actions instead of you. Tap the mode that plans.' },
          plan: {
            type: 'done',
            reply: 'Plan mode is on. I will read and plan. I will not edit any file until you approve a plan.',
            completes: true,
            verdict: 'In Plan mode the assistant researches and proposes. Nothing changes until you approve.'
          }
        }
      },
      {
        id: 'ask',
        kind: 'type',
        name: 'Ask for a plan',
        task: 'Ask for a schedule page for the club. Type it in your own words.',
        context: 'In Plan mode the assistant does not build. It writes a plan for you to read.',
        board: seed,
        variants: [{}],
        hints: ['Say what you want planned. It needs an action and a thing.', 'For example: “Plan a schedule page”.'],
        example: 'Plan a schedule page.',
        rules: planRequestRules,
        outcomes: Object.assign({}, planRequestCommon, {
          good: {
            type: 'plan',
            reply: 'I read your project and wrote a plan. I did not change any file.',
            plan: schedulePlan,
            completes: true,
            verdict: 'A plan is not a change. Look at the board: it is exactly as it was.'
          }
        })
      },
      {
        id: 'edit',
        kind: 'review',
        name: 'Change the plan',
        task: 'You want a simple page. One step of the plan is too much. Tell the assistant to change the plan.',
        context: 'In the real tool, you choose “No, keep planning” and tell the assistant what to change. In a terminal you can also press Ctrl+G to edit the plan in your text editor.',
        board: seed,
        variants: [{ target: scheduleTarget }],
        hints: ['Look at the plan. Which step is more than you asked for?', 'Say you want to remove that step. For example: “Remove step 4”.'],
        events: [
          {
            kind: 'type',
            plan: schedulePlan,
            prompt: 'Tell the assistant what to change in the plan.',
            example: 'Remove step 4.',
            rules: editRules,
            outcomes: Object.assign({}, editCommon, {
              good: {
                type: 'plan',
                reply: 'Changed. I took out the step you did not want. Nothing has been edited yet.',
                plan: scheduleRevised,
                completes: true
              }
            })
          }
        ],
        doneVerdict: 'You shaped the plan before any file was touched. That is the point of Plan mode.'
      },
      {
        id: 'approve',
        kind: 'review',
        name: 'Approve the plan',
        task: 'The plan is how you want it. Approve it. Then the assistant starts, and it still asks before each edit.',
        context: 'Approving a plan leaves Plan mode. The option you choose says how the edits that follow are reviewed.',
        board: seed,
        variants: [{}],
        hints: ['The plan is what you want. Which option says yes?', 'Tap the Yes button. It says you will approve the edits by hand.'],
        events: [
          {
            kind: 'ask',
            plan: scheduleRevised,
            ask: Object.assign({ question: 'Do you approve this plan?', file: '', mark: '', change: '' }, approveLabels),
            correct: 'yes',
            yesReply: 'Plan approved. I leave Plan mode now. I will ask before each edit.',
            wrongReply: 'This is the plan you shaped, and it is what you want. Tap “Yes, manually approve edits”.'
          },
          {
            kind: 'ask',
            ask: { question: 'May I create schedule.html?', file: 'schedule.html', mark: '+', change: 'new file' },
            correct: 'yes',
            yesReply: 'Done. The file schedule.html is on the board. Approving the plan did not skip your yes.',
            yesEffects: [{ kind: 'page', file: 'schedule.html', text: 'Club schedule' }],
            wrongReply: 'This is the first step of the plan you approved. Tap Yes to create the file.'
          }
        ],
        doneVerdict: 'Plan first, then your yes, then the work. You stayed in control all the way.'
      },
      {
        id: 'check',
        kind: 'review',
        check: true,
        name: 'Check: plan a page',
        task: 'Check. Plan a {job} with the assistant. Ask for it, take out the {extra}, approve the plan, then say yes to the first edit.',
        context: 'The mode is already Plan. Read each plan before you answer.',
        board: seed,
        variants: [
          { job: 'contact page', file: 'contact.html', heading: 'Contact', extra: 'map', target: ['4', 'four', 'fourth', 'last', 'map'], third: 'Add the club email address', fourth: 'Add a map of the whole city' },
          { job: 'rules page', file: 'rules.html', heading: 'Club rules', extra: 'video', target: ['4', 'four', 'fourth', 'last', 'video'], third: 'List the rules in a short list', fourth: 'Add a video of last year' },
          { job: 'news page', file: 'news.html', heading: 'Club news', extra: 'countdown clock', target: ['4', 'four', 'fourth', 'last', 'countdown', 'clock'], third: 'Add three short news items', fourth: 'Add a countdown clock' }
        ],
        hints: ['Four things to do, in order: ask, change the plan, approve, say yes.', 'Type your request. Then name the step you do not want. Then tap the Yes buttons.'],
        events: [
          {
            kind: 'type',
            prompt: 'Ask for a {job}. Type it in your own words.',
            example: 'Plan a {job}.',
            rules: planRequestRules,
            outcomes: Object.assign({}, planRequestCommon, {
              good: {
                type: 'plan',
                reply: 'I read your project and wrote a plan. I did not change any file.',
                plan: { title: 'Plan: a {job}', items: ['Create {file}', 'Add a heading that says {heading}', '{third}', '{fourth}'] },
                completes: true
              }
            })
          },
          {
            kind: 'type',
            plan: { title: 'Plan: a {job}', items: ['Create {file}', 'Add a heading that says {heading}', '{third}', '{fourth}'] },
            prompt: 'Tell the assistant what to change in the plan.',
            example: 'Remove the {extra}.',
            rules: editRules,
            outcomes: Object.assign({}, editCommon, {
              good: {
                type: 'plan',
                reply: 'Changed. I took out the step you did not want. Nothing has been edited yet.',
                plan: { title: 'Updated plan: a {job}', items: ['Create {file}', 'Add a heading that says {heading}', '{third}'] },
                completes: true
              }
            })
          },
          {
            kind: 'ask',
            plan: { title: 'Updated plan: a {job}', items: ['Create {file}', 'Add a heading that says {heading}', '{third}'] },
            ask: Object.assign({ question: 'Do you approve this plan?', file: '', mark: '', change: '' }, approveLabels),
            correct: 'yes',
            yesReply: 'Plan approved. I leave Plan mode now. I will ask before each edit.',
            wrongReply: 'This is the plan you shaped. If it is what you want, tap “Yes, manually approve edits”.'
          },
          {
            kind: 'ask',
            ask: { question: 'May I create {file}?', file: '{file}', mark: '+', change: 'new file' },
            correct: 'yes',
            yesReply: 'Done. The file {file} is on the board.',
            yesEffects: [{ kind: 'page', file: '{file}', text: '{heading}' }],
            wrongReply: 'This is the first step of the plan you approved. Tap Yes to create the file.'
          }
        ],
        doneVerdict: 'You planned, changed the plan, approved it and said yes. That is the whole cycle.'
      },
      {
        id: 'why',
        kind: 'question',
        name: 'Why plan first',
        task: 'Why ask for a plan before the assistant starts?',
        context: 'Pick the answer that is true.',
        options: [
          { id: 'a', text: 'So I can read the plan and change it before anything is edited.', right: true },
          { id: 'b', text: 'So the assistant can skip asking me later.', why: 'Not quite. After you approve a plan, you can still review each edit.' },
          { id: 'c', text: 'Because the assistant cannot make a page without a plan.', why: 'Not quite. You can ask for a page directly. A plan is for when you want to check the approach first.' }
        ],
        rightWhy: 'Plan mode proposes and edits nothing until you approve. You can correct the approach before any file changes.'
      }
    ],
    recap: {
      concept: 'Ask for a plan first. Change it. Approve it. Then the work starts.',
      items: [
        { label: 'The mode', value: 'Plan', mono: true, note: 'Plan mode proposes changes. It edits nothing until you approve the plan.' },
        { label: 'Ways in', value: 'Shift+Tab or /plan', mono: true, note: 'In a terminal, press Shift+Tab, or start one message with /plan. In the desktop app, use the mode selector.' },
        { label: 'Change the plan', value: 'No, keep planning', mono: true, note: 'Tell the assistant what to change. In a terminal, Ctrl+G opens the plan in your text editor.' }
      ],
      realStart: 'Approving a plan switches to the mode you choose, and then the assistant starts editing. The wording of these options can differ between versions.',
      next: 'King'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
