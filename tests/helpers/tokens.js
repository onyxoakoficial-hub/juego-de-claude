'use strict';

/* Reads the colour tokens out of site/css/tokens.css. No dependencies. */

const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '..', '..', 'site', 'css', 'tokens.css');

/* Returns the text between the brace that follows `start` and its matching closing brace. */
function block(css, start) {
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) return css.slice(open + 1, i);
  }
  throw new Error('Unbalanced braces in tokens.css');
}

function declarations(text) {
  const out = {};
  const re = /--(c-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(text))) out[m[1]] = m[2].trim();
  return out;
}

/*
  tokens.css layout:
    :root { sRGB light }   @media dark { :root { sRGB dark } }
    @supports (oklch) { :root { OKLCH light }  @media dark { :root { OKLCH dark } } }
*/
function readColorTokens() {
  const css = fs.readFileSync(TOKENS_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  const supportsAt = css.indexOf('@supports');
  const fallbackPart = css.slice(0, supportsAt);
  const oklchPart = block(css, supportsAt);

  const split = (part) => {
    const darkAt = part.indexOf('@media (prefers-color-scheme: dark)');
    return {
      light: declarations(block(part, part.indexOf(':root'))),
      dark: declarations(block(part, darkAt))
    };
  };

  return { fallback: split(fallbackPart), oklch: split(oklchPart) };
}

module.exports = { readColorTokens, TOKENS_FILE };
