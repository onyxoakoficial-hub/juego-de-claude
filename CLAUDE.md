# Checkmate — project rules

Checkmate is a browser game that teaches Claude Code to people who have never programmed.
It teaches by analogy with chess. The learner decides; the assistant moves the pieces.
This file is the rulebook for anyone (person or AI) who works on this repository.

## How we work

- The owner gives direction and approves each step. Propose first, then build.
- Work in milestones. Stop at the end of each one and wait for approval. One commit per milestone.
- If something is ambiguous, ask. If you disagree, say why and offer a better option, then follow the decision.
- Never say something works without testing it. Say what you tested and how.
- Keep changes small and reversible. Add no feature the owner has not approved.
- Explain in plain language first, technical detail second.

## Required skills

Three skills set the quality bar. They are not stored in this repository (it is public); load them in the session.

1. `agency-web-design` — read before any visual decision. Run `references/qa-checklist.md` (sections A to G) before each review.
2. `web-legal-compliance` — applies to assets, fonts, trademarks, stored data and every claim.
3. `conversion-marketing` — blueprint C for the landing page, section 8 (activation) inside the game.

If they conflict: legal wins over marketing, and accessibility wins over visual effect.
Every milestone review includes a DESIGN REPORT, a COMPLIANCE REPORT and a MARKETING REPORT.

## Audience

Absolute beginners, teenagers and up, mostly on phones. They do not know the words "terminal", "file",
"prompt", "repository" or "model". Introduce each term through the chess metaphor first, then show the
real thing. Reading level: grade 5 to 8. Tone: calm, direct, respectful. No hype, no filler, no emoji.

## The metaphor (keep it consistent everywhere)

| In the game | In Claude Code |
|---|---|
| The player | The learner: decides, gives orders, grants permission |
| The assistant who moves the pieces | Claude Code |
| The board | The project folder |
| The pieces | Files and code |
| The rulebook | The `CLAUDE.md` file: instructions the assistant reads at the start of every session |
| Announcing a move | Writing a prompt (a clear instruction) |
| "May I move?" | A permission request, in Manual mode |
| Planning several moves ahead | Plan mode |
| Taking back a move | Checkpoints (undo) |
| Checkmate | A finished, working project |

## Levels and the mastery rule

Six levels, one piece each: Pawn, Knight, Bishop, Rook, Queen, King.
Each level is one concept, one hands-on task and one mastery check.

Mastery rule (non-negotiable): a level unlocks only when the previous one is passed without hints.
Using a hint is allowed, but then the check is repeated clean with a new variant. Before advancing, the
learner answers "what did the assistant just do, and why?".

How the rule is built (`site/js/engine.js`, tested in `tests/engine.test.js`):
- Hints in teaching steps cost nothing. A hint during a check means that check does not count: it is
  repeated with the next fixed variant, and it is not saved as done.
- Finishing steps never passes a level. Only a clean check followed by the right answer to the question
  calls `markPassed`. Level N opens only when level N-1 is passed. The address bar cannot skip ahead.
- Variants come in a fixed order and wrap around. There is no randomness anywhere.
- A level is data in its own file, `site/content/en-level-N.js` (steps, rules, outcomes, hints, recap).
  `site/content/en.js` holds the core (the landing demo, the interface strings, the level list and what
  levels share). Each entry of `levelList` names the files that level needs, and `js/play.js` loads them
  only when the learner opens that level. `tests/content.test.js` checks every level automatically, and
  `tests/engine.test.js` plays every level from start to end with the engine alone.
- Step kinds: `build` (word tiles, levels 1 and 2 and the mode picker), `type` (one typed line),
  `rules` (a typed rulebook, one rule per line), `review` (several requests answered yes or no, plus typed
  ones, with an optional plan card), `capstone` (level 6: a free session with six goals, in
  `js/capstone.js`) and `question`. An answer may be a `plan` (a numbered plan card, nothing edited). Typed answers are matched forgivingly: case, punctuation, word order, extra
  words and one-letter typos (including swapped letters) in words of five letters or more.
- Levels 1 and 2 use tiles. From level 3 the learner types; a hint is the way back to tiles and examples.
- Level 6 has no hints at all. Its mistakes say what kind of thing to try, never the answer
  (`tests/content.test.js` fails if a message gives one away).
- The end screen (`#done`, opens only after level 6 is passed) is `content/en-finale.js` + `js/finale.js`:
  a completion card the learner can download as a picture, copy as text or share, and the checklist
  "Your first real session".
- A step may set the board it starts from (`board`), so a level can resume in the middle.
- Honest errors (bug found by a learner in level 3): a line that is not a rule the game can apply is
  either `vague` (names no part of the page, or no exact value) or `unsupported` (a clear rule such as
  "Links are purple" that the practice game cannot apply). The message never calls a clear rule vague. The
  detector is `isConcrete` in `js/engine.js`, fed by `kit.rulebookConcrete` in `content/en.js`.
- Heading size accepts words (big, small, huge...) and numbers (`48px`, `3em`, `36pt`, `150%`, or `48`).
  The practice page shows three sizes: up to 24px is small, from 40px is large, the rest is normal
  (`kit.sizeScale`). The rule line is kept as the learner wrote it.
- The rule-writing steps (level 3, and level 6) list the kinds of rule the game understands before the
  learner writes (`showKinds`), with accepted words and no sentence to copy.
- After 3 misses in a row a way out appears: a complete example (`example` on every typed step and typed
  request; in a check it counts as a hint) and, in a check, "restart with new words" (the next variant,
  no hint counted). Level 6 has no example: it only offers "start this level again".
- `tests/rules-bank.test.js` holds at least 20 wordings per kind of typed answer. When a learner finds a
  wording that fails, add it there first, then fix the engine.

## Game rules

- The session is simulated. No real AI calls, no API keys, no network requests.
- Every answer is scripted and deterministic: the same input always gives the same result. No randomness.
- Matching is forgiving: accept several correct phrasings. A vague instruction gets a fixed vague result,
  and the game explains why.
- The board is a progress map, not a chess engine. No chess rules, no opponent.
- One instruction on screen at a time. Always show where the learner is, what to do now, what comes next.
- Feedback on every action within 150 ms. A wrong answer says what to try next, never just "incorrect".

## Accuracy

- Every Claude Code fact must be traceable to the official documentation at https://code.claude.com/docs.
- If a fact cannot be verified there, leave it out or mark it for the owner's review. Never guess.
- Version-specific details (commands, labels, shortcuts, links, the date of the last check) live only in
  `site/content/facts.js`, each with its source page.
- The mode in which the assistant asks before each change is called **Manual**.
- Undo in the desktop app is not in the official documentation. It stays out of the game until the owner
  confirms it by testing.

## Technical constraints

- Static site in `site/`. Only that folder is published. Semantic HTML, modern CSS, plain JavaScript.
- No frameworks, no build step, no backend, no login, no secrets.
- Plain scripts loaded with `defer`, not ES modules: the site must run by double-clicking `site/index.html`.
- No third-party scripts, trackers, analytics, CDNs or embeds. Fonts and all assets are self-hosted.
- No inline scripts, inline styles or event attributes in HTML.
- Text the learner types is shown with `textContent` only, never inserted as HTML.
- Game and lesson text lives in `site/content/` (`en.js`, `en-level-N.js`, `en-finale.js`). Logic files
  contain no wording. Approved change (owner, M4): the lesson data is split by level to keep each page
  under the JavaScript budget.
- Approved exception (owner, M2): the static copy of the landing page (`index.html`) stays in the HTML,
  not in `en.js`, so it can be read without JavaScript and paints first. To add a language, translate
  `en.js` and the HTML pages.
- Approved exception (owner, M2): the system monospace is the only font besides the two families, and
  only for file names and commands. No font file is loaded for it.
- Progress is saved only in the browser (`localStorage`, wrapped in try/catch) with a visible
  "Reset progress" control. No personal data is collected. Only `js/engine.js` touches storage.
- No visit counting for now (owner decision, M2). In M5, review only free options and verify the real
  price before proposing one.
- Mobile first from 360 px. Full keyboard support. WCAG 2.2 AA. Light and dark themes.
  `prefers-reduced-motion` is respected.
- Budgets: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less, Lighthouse 95 or more in every
  category, and under 100 KB of JavaScript (raw) on every page and route: the scripts the page loads plus
  the heaviest level or the end screen (`tests/site.test.js` checks it). The compressed size is reported
  for information only. Opening several levels in one visit loads more than 100 KB raw in total; that is
  known and accepted. `site/content/facts.js` is data for editing and tests; no page loads it.

## Design

- Concept: "tournament set on felt". Bone ivory, ebony ink, one felt-green accent.
- Every colour, size, space, radius, shadow and duration is a token in `site/css/tokens.css`.
  No other stylesheet uses a raw value.
- Two type families: Fraunces (display) and Atkinson Hyperlegible Next (text), plus the monospace exception above. Three weights.
- The accent is for the primary action. One primary button per view.
- Motion only where it explains something: the piece move, the permission prompt, the level win.
- Chess pieces and icons are original SVG drawn for this project. No emoji as icons.

## Legal

- This is an independent, unofficial project. The product is named "Checkmate" only.
- Write "Claude Code" in plain text to describe what the game teaches. Never use its logo, never imitate
  Anthropic's branding, never put a trademark symbol next to its names.
- The end screen's card and checklist state only facts from the official documentation, each with its
  page (`content/facts.js`, group `finale`), no prices, and nothing about undo in the desktop app.
  The name a learner types on the card is never saved or sent.
- Every page ends with: "Independent, unofficial project. Not affiliated with or endorsed by Anthropic.
  Claude Code is a trademark of Anthropic, PBC."
- No invented reviews, numbers, credentials or urgency. Every claim on a page must be true today.
- The landing page lists and promises only levels that exist (`tests/site.test.js` checks it). Add a
  level to the landing page only when it is built. The level map may show later pieces, marked "not
  available yet".

## Open risks

- Open (owner, M3): "Una persona no entendió al empezar qué es el juego, y interpretó que el asistente
  copia las palabras en pantalla, no que crea un archivo. Revisar tras M3 con más personas". The owner
  chose not to change level 1 or the landing page for now. Level 2 was changed to make clear that the
  assistant changes the file that is already there (it says "existing file", and the board and preview
  mark files as "new" or "changed" in levels 2 to 4).

- Not verified, so handled with care (M4): (1) the exact wording of the plan-approval buttons in the
  desktop app: the documentation lists them for the prompt that appears when a plan is ready, and the
  first option reads differently when Auto mode is unavailable, so the game shows two of them and says the
  wording can differ between versions; (2) how to undo in the desktop app (still not tested by the owner,
  so not taught); (3) LCP of the level page is near the limit in lab tests.

## Evidence from people

- Level 1, owner test (M3): one person who had never programmed finished it alone in about 2 minutes,
  with no hints and no help. At the start they did not understand what the game was. At the end they
  said the assistant "puso en la pantalla lo que yo escribí".
- Still to do: the 5-second test of the landing page, and level 3 with a beginner.

## Owner decisions on code (M3 and M4)

- M4: lesson data is split by level (budget measured raw per route); compressed size is information only.
- M4: the level map keeps showing six pieces, and the level 4 recap keeps naming the Queen.
- M4: the landing page names the six levels now that they exist and work.

- `site/js/first-win.js` (landing demo) stays separate from `site/js/engine.js`. The duplication is accepted.
- The browser test scripts (they need Playwright) stay outside the repository. `node --test` is the
  repository's own test.

## Testing

```bash
node --test
```

Runs the checks in `tests/` (no dependencies): contrast of every colour pair in both themes, tokens-only
stylesheets, the session engine and the mastery rule, the lesson data, nothing loaded from other websites,
storage used only by the progress store, the unofficial notice on every page, the JavaScript budget.

Before each milestone review also test in a real browser, opening `site/index.html` from disk: no console
errors, no network requests, the full flow with touch and with keyboard only, widths from 320 to 1920 px,
both themes, reduced motion, and JavaScript turned off.
