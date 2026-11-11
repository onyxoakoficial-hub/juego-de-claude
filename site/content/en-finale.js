/*
  Checkmate - the end screen (English): the completion card and the "Your first real session" checklist.
  Loaded by js/play.js when the learner opens the end screen.

  Every statement about Claude Code in the checklist comes from Anthropic's official documentation.
  Each step names the page it comes from. The same pages are listed in content/facts.js (group "finale"),
  and tests/content.test.js checks that the two agree.
  Not verified, so not stated: how to undo a change in the desktop app.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});
  var DOCS = 'https://code.claude.com/docs/en/';

  app.content.finale = {
    title: 'Checkmate. You finished all six levels.',
    lead: 'You can now direct an assistant: ask clearly, be exact, write rules, say yes or no, take a move back, and plan first.',

    card: {
      heading: 'Checkmate',
      line: 'Finished all six levels of Checkmate, a practice game for learning Claude Code.',
      unofficial: 'Independent, unofficial project. Not affiliated with or endorsed by Anthropic.',
      nameLabel: 'Your name on the card (optional)',
      nameHelp: 'The name stays on this page. Nothing is saved or sent.',
      download: 'Download the card',
      copy: 'Copy the text',
      share: 'Share',
      copied: 'Copied.',
      copyFailed: 'Your browser did not allow copying. Select the text and copy it yourself.',
      shared: 'Shared.',
      downloadFailed: 'Your browser could not make the picture. Take a screenshot of the card instead.',
      shareText: 'I finished all six levels of Checkmate, a practice game for learning Claude Code. It is an independent, unofficial project.',
      fileName: 'checkmate-card.png'
    },

    checklist: {
      title: 'Your first real session',
      lead: 'This list is about the real tool. Each step names the official page it comes from. We checked these pages on {date}. The names of buttons can change between versions.',
      checkedOn: '2026-11-11',
      sourceLabel: 'Official page',
      steps: [
        {
          id: 'plan',
          title: 'Get what you need',
          body: [
            'Claude Code needs a paid Claude plan (Pro, Max, Ultra, Team or Enterprise), a Claude Console account, or access through a supported cloud provider.',
            'This game cannot give you that. Anthropic’s own pages list the options.'
          ],
          source: { text: 'Quickstart: Before you begin', url: DOCS + 'quickstart' }
        },
        {
          id: 'desktop',
          title: 'Option A: the desktop app',
          body: [
            'You do not need a terminal. The Claude desktop app has a Code tab that works without one.',
            'Install the app and sign in. Then click the Code tab at the top of the sidebar.'
          ],
          source: { text: 'Get started with the desktop app', url: DOCS + 'desktop-quickstart' }
        },
        {
          id: 'terminal',
          title: 'Option B: a terminal',
          body: [
            'If you prefer a terminal, install Claude Code with one command. Use the one for your system.',
            'Then open a new terminal window and check that it worked.',
            'Never used a terminal? Anthropic has a guide for new users.'
          ],
          commands: [
            { label: 'macOS, Linux, WSL', code: 'curl -fsSL https://claude.ai/install.sh | bash' },
            { label: 'Windows PowerShell', code: 'irm https://claude.ai/install.ps1 | iex' },
            { label: 'Check it worked', code: 'claude --version' }
          ],
          source: { text: 'Quickstart: Step 1', url: DOCS + 'quickstart' },
          extra: { text: 'Terminal guide for new users', url: DOCS + 'terminal-guide' }
        },
        {
          id: 'folder',
          title: 'Open a small folder you know well',
          body: [
            'Start with a small project you know well.',
            'In the desktop app, choose the first Local entry under the prompt box. Then choose “Open folder…” and pick your folder.',
            'In a terminal, go to your folder and type claude. The first time, it asks you to log in.'
          ],
          commands: [
            { label: 'In a terminal', code: 'cd /path/to/your/project' },
            { label: 'Then', code: 'claude' }
          ],
          source: { text: 'Desktop app: start your first session', url: DOCS + 'desktop-quickstart' },
          extra: { text: 'Quickstart: Step 2', url: DOCS + 'quickstart' }
        },
        {
          id: 'mode',
          title: 'Check the mode before your first message',
          body: [
            'Look at the mode selector in the row under the prompt box. Choose Manual, so Claude asks before editing files or running commands.',
            'In a terminal, press Shift+Tab to change mode. Newer versions can start in Auto mode, so check the mode before you begin.'
          ],
          source: { text: 'Choose a permission mode', url: DOCS + 'permission-modes' },
          extra: { text: 'Desktop app: permission modes', url: DOCS + 'desktop-quickstart' }
        },
        {
          id: 'first',
          title: 'Give your first instruction',
          body: [
            'Type something small, in plain words. For example:',
            'If Claude asks for permission before creating or changing files, approve it. In a terminal, press Enter to choose Yes.',
            'When the file exists, double-click the HTML file to open it in your browser.'
          ],
          commands: [{ label: 'Example', code: 'make me a simple webpage that says hello world' }],
          source: { text: 'Terminal guide for new users', url: DOCS + 'terminal-guide' }
        },
        {
          id: 'practice',
          title: 'Use what you practiced',
          body: [
            'Be specific. Name the file, describe what you see, and say what fixed looks like. That saves you a round of corrections.',
            'Rules: put them in a file named CLAUDE.md. Run /init and Claude Code drafts one for you. It treats the file as guidance, so keep rules short and clear.',
            'Plan first: press Shift+Tab or start a message with /plan. In the desktop app, use the mode selector.',
            'Take a move back: ask the assistant to undo a change. In a terminal, /rewind opens a menu, or press Esc twice with the prompt box empty.',
            'Undo is for quick recovery. Git keeps the permanent history.'
          ],
          source: { text: 'Best practices', url: DOCS + 'best-practices' },
          extras: [
            { text: 'How Claude remembers your project', url: DOCS + 'memory' },
            { text: 'Choose a permission mode', url: DOCS + 'permission-modes' },
            { text: 'Checkpointing', url: DOCS + 'checkpointing' }
          ]
        },
        {
          id: 'learn',
          title: 'Keep learning',
          body: [
            'Anthropic offers free self-paced courses on its Claude Academy, including Claude Code 101.',
            'The quickstart page lists where to get help.'
          ],
          source: { text: 'Quickstart: Getting help', url: DOCS + 'quickstart' }
        }
      ]
    },

    back: 'Back to the level map'
  };
})(typeof window !== 'undefined' ? window : globalThis);
