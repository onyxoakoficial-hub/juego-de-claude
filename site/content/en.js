/*
  Checkmate - English content for everything the game writes on screen while it runs.
  To add a language: copy this file, translate the strings, and load the copy instead.
  The game logic never contains text. Static page copy lives in the HTML files.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  app.content = {
    lang: 'en',

    /* The first move on the landing page. */
    firstWin: {
      /* Read aloud while no word is selected. */
      sayEmpty: 'No words yet.',

      task: {
        build: 'Tap the words to build an instruction.',
        ask: 'The assistant is waiting. Answer its question.',
        done: 'Look at the board and the preview.'
      },

      /* {text} is replaced by the words the page will say. */
      reply: {
        empty: 'Tap the words above to build your instruction first.',
        needAction: 'What should I do? Start with an action. Tap “Make”.',
        needObject: 'Make what? Name the thing you want. Tap “a web page”.',
        askWithText: 'I will make one new file called index.html. It is a web page that says “{text}”.',
        askNoText: 'I will make one new file called index.html. You did not say what the page should say, so I will write “{text}”.',
        denied: 'Nothing changed. I only move when you say yes. Announce the move again when you are ready.',
        done: 'Done. The file index.html is on the board.'
      },

      /* Used when the instruction does not say what the page should say. */
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
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
