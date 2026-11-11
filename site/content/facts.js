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
    checkedOn: '2026-11-10',
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
      planLabel: 'Plan',
      autoLabel: 'Auto',
      desktopSwitch: 'the mode selector in the row under the prompt box',
      terminalSwitchKey: 'Shift+Tab',
      source: DOCS + 'permission-modes'
    },

    /* Standing instructions for a project. */
    rulebook: {
      fileName: 'CLAUDE.md',
      createCommand: '/init',
      source: DOCS + 'memory'
    },

    /* Undo. The desktop app is not listed: its undo control is not in the official documentation. */
    undo: {
      terminalCommand: '/rewind',
      terminalKeys: 'Esc twice, with the prompt box empty',
      anySurface: 'ask the assistant to undo the change',
      source: DOCS + 'checkpointing',
      sourceAnySurface: DOCS + 'how-claude-code-works',
      desktopControl: null,
      desktopStatus: 'NOT VERIFIED - waiting for the owner to test it. Do not show in the game.'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
