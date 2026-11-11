/*
  Checkmate - facts about Claude Code that can go out of date.
  Every lesson reads version-specific details from this one file, so an update means editing only here.
  Each fact names the official documentation page it comes from.
  Rule: if a fact cannot be verified in the official documentation, it does not go in the game.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var DOCS = 'https://code.claude.com/docs/en/';

  app.facts = {
    /* Date of the last check against the official documentation (also shown on the landing page). */
    checkedOn: '2026-11-11',
    docsHome: DOCS + 'overview',

    product: {
      name: 'Claude Code',
      maker: 'Anthropic',
      trademarkOwner: 'Anthropic, PBC'
    },

    /* What the real tool needs. Shown in the final checklist, never as a price. */
    access: {
      needsPaidPlanOrConsole: true,
      pricingUrl: 'https://claude.com/pricing',
      source: DOCS + 'quickstart'
    },

    /* How to open the real tool. The terminal command and the desktop tab are both in the quickstarts. */
    start: {
      terminalCommand: 'claude',
      desktopTab: 'Code',
      source: DOCS + 'quickstart',
      sourceDesktop: DOCS + 'desktop-quickstart'
    },

    /* Specific instructions work better than vague ones. */
    prompts: {
      source: DOCS + 'best-practices'
    },

    /* The mode in which the assistant asks before each change. */
    permissionModes: {
      askFirstLabel: 'Manual',
      acceptEditsLabel: 'Accept edits',
      planLabel: 'Plan',
      autoLabel: 'Auto',
      /* In Auto mode a background checker reviews actions instead of the learner. In Accept edits, file edits need no approval. */
      desktopSwitch: 'the mode selector in the row under the prompt box',
      terminalSwitchKey: 'Shift+Tab',
      source: DOCS + 'permission-modes'
    },

    /*
      Plan mode (level 5). Source: permission-modes ("Analyze before you edit with plan mode", "Review and approve a plan"),
      desktop-quickstart (the desktop mode list) and glossary ("Plan mode").
      The three options below are documented for the prompt that appears when a plan is ready. The first option reads
      differently when auto mode is not available, so the game teaches only the two that always apply.
      NOT VERIFIED for the desktop app: the exact wording of the approval buttons there. The game shows them as an
      example and the recap says the wording can differ between versions.
    */
    plan: {
      mode: 'Plan',
      enter: 'Shift+Tab, or start one message with /plan',
      approveManual: 'Yes, manually approve edits',
      keepPlanning: 'No, keep planning',
      editInTerminal: 'Ctrl+G',
      source: DOCS + 'permission-modes'
    },

    /* Standing instructions for a project. */
    rulebook: {
      fileName: 'CLAUDE.md',
      createCommand: '/init',
      source: DOCS + 'memory'
    },

    /*
      The end screen: the checklist "Your first real session". Each step names its official page.
      content/en-finale.js must use only these commands and these pages (tests/content.test.js checks it).
    */
    finale: {
      commands: [
        'curl -fsSL https://claude.ai/install.sh | bash',
        'irm https://claude.ai/install.ps1 | iex',
        'claude --version',
        'cd /path/to/your/project',
        'claude',
        'make me a simple webpage that says hello world'
      ],
      pages: ['quickstart', 'desktop-quickstart', 'terminal-guide', 'permission-modes', 'best-practices', 'memory', 'checkpointing'],
      source: DOCS + 'quickstart'
    },

    /* Undo. The desktop app is not listed: its undo control is not in the official documentation. */
    undo: {
      terminalCommand: '/rewind',
      terminalKeys: 'Esc twice, with the prompt box empty',
      anySurface: 'ask the assistant to undo the change',
      source: DOCS + 'checkpointing',
      sourceAnySurface: DOCS + 'how-claude-code-works',
      /* Undo covers files the assistant edited. A file changed only by a command is not tracked: use Git. With text in the prompt box, Esc twice clears the text instead of opening the menu. */
      limitsSource: DOCS + 'checkpointing',
      desktopControl: null,
      desktopStatus: 'NOT VERIFIED - waiting for the owner to test it. Do not show in the game.'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
