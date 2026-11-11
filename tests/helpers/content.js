'use strict';

/*
  Loads the lesson data the way the browser does: the core file, then every level file listed in
  content/en.js (each level lists the files it needs). Used by the tests.
*/

const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', '..', 'site');

function loadContent() {
  require(path.join(SITE, 'content', 'en.js'));
  require(path.join(SITE, 'js', 'engine.js'));
  const app = globalThis.CHECKMATE;
  const loaded = [];
  for (const meta of app.content.levelList) {
    for (const file of meta.files || []) {
      if (loaded.includes(file)) continue;
      assert(fs.existsSync(path.join(SITE, file)), `${file} is listed for level ${meta.id} but does not exist`);
      require(path.join(SITE, file));
      loaded.push(file);
    }
  }
  return { app, files: loaded, SITE };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

module.exports = { loadContent, SITE };
