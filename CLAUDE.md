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
- A level is data in `site/content/en.js` (steps, rules, outcomes, hints, recap). Adding level 5 or 6
  means adding data; `tests/content.test.js` checks it automatically, and `tests/engine.test.js` plays
  every level from start to end with the engine alone.
- Step kinds: `build` (word tiles, levels 1 and 2 and the mode picker), `type` (one typed line),
  `rules` (a typed rulebook, one rule per line), `review` (several requests answered yes or no, plus a
  typed one) and `question`. Typed answers are matched forgivingly: case, punctuation, word order, extra
  words and one-letter typos (including swapped letters) in words of five letters or more.
- Levels 1 and 2 use tiles. From level 3 the learner types; a hint is the way back to tiles and examples.
- A step may set the board it starts from (`board`), so a level can resume in the middle.

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
- Game and lesson text lives in `site/content/en.js`. Logic files contain no wording.
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
- Budgets: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less, under 100 KB of JavaScript on every
  page (raw size of the scripts that page loads; `tests/site.test.js` checks it), Lighthouse 95 or more in
  every category. `site/content/facts.js` is data for editing and tests; no page loads it.

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
- Every page ends with: "Independent, unofficial project. Not affiliated with or endorsed by Anthropic.
  Claude Code is a trademark of Anthropic, PBC."
- No invented reviews, numbers, credentials or urgency. Every claim on a page must be true today.

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
