'use strict';

/*
  A bank of reasonable wordings for every kind of typed answer in the game.
  Born from a real bug: a learner wrote "the heading size are 48px", a clear rule, and the game said
  "Rule 4 is too vague". Each list below must hold at least 20 wordings, and each one must do what a
  person would expect. Add a wording here when someone finds one that fails.
*/

const test = require('node:test');
const assert = require('node:assert');
const { loadContent } = require('./helpers/content');

const { app } = loadContent();
const E = app.engine;
const C = app.content;
const kit = app.kit;

/* A rulebook step with nothing required, so each line is read on its own. */
const readStep = { categories: kit.rulebookCategories, concrete: kit.rulebookConcrete, need: [] };

function read(line) {
  return E.readRulebook(readStep, {}, line);
}

function bank(name, entries, check) {
  test(`${name}: at least 20 wordings, each one understood`, () => {
    assert.ok(entries.length >= 20, `${name} has only ${entries.length} wordings`);
    const failed = [];
    for (const entry of entries) {
      try {
        check(entry);
      } catch (error) {
        failed.push(`${JSON.stringify(entry)}: ${String(error.message).split('\n')[0]}`);
      }
    }
    assert.deepStrictEqual(failed, [], `${failed.length} wording(s) failed`);
  });
}

/* ---------- Rules for the rulebook (level 3, and level 6 through the same reader) ---------- */

bank('rule: heading color', [
  ['Headings are green.', 'green'], ['Headings are green', 'green'], ['The headings are green.', 'green'],
  ['Make the headings green.', 'green'], ['Make all headings green', 'green'], ['Titles should be blue.', 'blue'],
  ['The title is red.', 'red'], ['Heading color: blue', 'blue'], ['Heading colour is red', 'red'],
  ['Use green for headings.', 'green'], ['All headings must be green.', 'green'], ['Paint the headings blue.', 'blue'],
  ['Headers are black.', 'ink'], ['Headings are black.', 'ink'], ['Make the title color green.', 'green'],
  ['Set the heading color to red.', 'red'], ['Every heading is blue', 'blue'], ['The headline is red.', 'red'],
  ['I want green headings.', 'green'], ['Please make titles blue.', 'blue'], ['Headings should always be green.', 'green'],
  ['- Headings are green', 'green'], ['1. Headings are green', 'green'], ['HEADINGS ARE GREEN!!!', 'green'],
  ['Headins are green.', 'green'], ['h1 is red', 'red']
], ([line, value]) => {
  const result = read(line);
  assert.strictEqual(result.outcome, 'good', line);
  assert.deepStrictEqual(result.rules, [{ cat: 'color', value }], line);
});

bank('rule: page background', [
  ['The background is blue.', 'blue'], ['Background: green', 'green'], ['Make the background red.', 'red'],
  ['The page background is white.', 'paper'], ['Background color is blue.', 'blue'], ['Set the background to green.', 'green'],
  ['Use a blue background.', 'blue'], ['The background should be red.', 'red'], ['Make the page blue.', 'blue'],
  ['The page is green.', 'green'], ['The website is red.', 'red'], ['Page color is blue', 'blue'],
  ['Paint the background red.', 'red'], ['Backgrounds are blue.', 'blue'], ['I want a green background.', 'green'],
  ['The site background is white.', 'paper'], ['Make the whole page white.', 'paper'], ['Background is white', 'paper'],
  ['A red background, please.', 'red'], ['Please set the background colour to blue', 'blue'],
  ['Make the background of the page green', 'green'], ['The body is blue', 'blue'], ['background blue', 'blue'],
  ['Green on a blue background', 'blue']
], ([line, value]) => {
  const result = read(line);
  assert.strictEqual(result.outcome, 'good', line);
  assert.deepStrictEqual(result.rules, [{ cat: 'background', value }], line);
});

bank('rule: footer', [
  ['Add a footer that says Made by the club.', 'Made by the club'], ['Footer: Made by the club', 'Made by the chess club'],
  ['Add a footer.', 'Made by the chess club'], ['The footer says "Made by the club".', 'Made by the club'],
  ['Put a signature at the bottom.', 'Made by the chess club'], ['Add a footer with my name.', 'Made by the chess club'],
  ['Every page has a footer.', 'Made by the chess club'], ['Add a footer saying Made by the club', 'Made by the chess club'],
  ['Write a footer that says Chess club since 2020.', 'Chess club since 2020'], ['Include a footer', 'Made by the chess club'],
  ['Put the club name in the footer.', 'Made by the chess club'], ['Footer text: Made by the club', 'Made by the chess club'],
  ['Sign every page', 'Made by the chess club'], ['Add a signature line at the bottom', 'Made by the chess club'],
  ['The bottom of the page says Made by the club.', 'Made by the club'], ['Add a footer that says Hello.', 'Hello'],
  ['footer', 'Made by the chess club'], ['Make a footer that says "Chess for everyone".', 'Chess for everyone'],
  ['Footers should say Made by the club.', 'Made by the club'], ['Create a footer with the club name.', 'Made by the chess club'],
  ['The page should end with a footer.', 'Made by the chess club'], ['Add a small footer that says Made by the club.', 'Made by the club']
], ([line, value]) => {
  const result = read(line);
  assert.strictEqual(result.outcome, 'good', line);
  assert.deepStrictEqual(result.rules, [{ cat: 'footer', value }], line);
});

bank('rule: heading size, in words and in numbers', [
  /* The wording that failed for a real learner is the third one. */
  ['Headings are 48px.', 'large'], ['Make the headings 48px.', 'large'], ['the heading size are 48px', 'large'],
  ['Headings are big.', 'large'], ['Make the headings bigger.', 'large'], ['Titles should be large.', 'large'],
  ['Headings are small.', 'small'], ['Make the title smaller.', 'small'], ['Heading size: 48px', 'large'],
  ['The heading size is 40 px.', 'large'], ['Headings are 20px.', 'small'], ['Headings are 32px.', 'normal'],
  ['Set the heading size to 3em.', 'large'], ['Headings are 1.5rem.', 'small'], ['Headings are 2rem.', 'normal'],
  ['Titles are 36pt.', 'large'], ['Make headings huge.', 'large'], ['Make the title tiny.', 'small'],
  ['The heading size should be 150%.', 'large'], ['Headings: 60px', 'large'], ['Heading font size 18px', 'small'],
  ['Make the heading font size 30 pixels', 'normal'], ['Headings are 48.', 'large'], ['Make the titles really big.', 'large'],
  ['Make headings medium.', 'normal'], ['h1 is 48px', 'large'], ['Use big headings.', 'large'],
  ['Heading size is large', 'large'], ['headline = 56px', 'large'], ['1. Headings are 48px', 'large'],
  ['48px headings', 'large']
], ([line, value]) => {
  const result = read(line);
  assert.strictEqual(result.outcome, 'good', line);
  assert.deepStrictEqual(result.rules, [{ cat: 'size', value }], line);
});

/* ---------- A clear rule the game cannot apply: the message says so, honestly ---------- */

bank('rule: clear but not applicable gets the honest message', [
  'Links are purple.', 'Headings are bold.', 'The text is centered.', 'Use the Arial font.', 'Buttons are yellow.',
  'Paragraphs are 18px.', 'Headings are underlined.', 'Make the headings italic.', 'Make text bold.', 'Headings are purple.',
  'The title is yellow.', 'The background is purple.', 'Page margins are 20px.', 'The logo is on the left.',
  'Links are underlined.', 'The font is Georgia.', 'Add a table with 3 rows.', 'Text is 16px.', 'Buttons are rounded.',
  'The menu is on the right.', 'Headings are centered.', 'Images are 300px wide.', 'Headings are uppercase.', 'Headings are white.',
  'The background is gray.'
], (line) => {
  const result = read(line);
  assert.strictEqual(result.outcome, 'unsupported', line);
  const reply = E.announce(C.levels[3].steps[3], C.levels[3].steps[3].variants[0], line, {}).reply;
  assert.match(reply, /good rule, but this practice game can’t apply it yet\. Try a color, a size, a text, or a footer\./, line);
  assert.ok(!/too vague/.test(reply), 'a clear rule is never called vague');
});

bank('rule: truly vague lines are called vague', [
  'Make it nice.', 'Make it look good.', 'Do it well.', 'Be careful.', 'Use good design.', 'Make everything better.',
  'Write clean code.', 'Make the page pretty.', 'Make the site professional.', 'Make it modern.', 'Improve the page.',
  'Make the headings nice.', 'Keep it simple.', 'Make it easy to read.', 'Follow best practices.', 'Do your best.',
  'Be creative.', 'Make it fun.', 'Make it work.', 'It should be good.', 'Use nice colors.', 'Be consistent.',
  'Make it clean.', 'Surprise me.'
], (line) => {
  assert.strictEqual(read(line).outcome, 'vague', line);
});

test('the learner who found the bug: four rules, the fourth about the heading size', () => {
  const step = C.levels[3].steps[3];
  const mine = 'Headings are green\nThe background is blue\nAdd a footer that says Made by the club.\nthe heading size are 48px';
  step.variants.forEach((variant) => {
    const result = E.announce(step, variant, mine, {});
    assert.notStrictEqual(result.outcome, 'vague');
    assert.notStrictEqual(result.outcome, 'unsupported');
  });
  /* The variant that asks for a size, a footer and a background accepts it. */
  assert.strictEqual(E.announce(step, step.variants[1], mine, {}).outcome, 'good');
});

test('the saved size is applied to the page, as a size the practice page can show', () => {
  const result = read('Headings are 48px.');
  assert.deepStrictEqual(E.rulesToSet(result.rules), { size: 'large' });
  assert.deepStrictEqual(E.rulesToSet(read('Headings are 32px.').rules), { size: 'normal' });
});

/* ---------- Other typed answers in levels 3 to 5 ---------- */

function typed(step, text, variant) {
  return E.announce(step, variant || {}, text, { rules: [] }).outcome;
}

bank('level 3: ask for a page', [
  'Make a web page.', 'Make a page', 'Create a website.', 'Build a webpage.', 'Write an html page.', 'Generate a site.',
  'Please make me a web page.', 'Can you create a page?', 'I want you to build a website', 'Add a page',
  'make a web page for the chess club', 'Build me a simple site', 'Create an HTML file', 'Write a webpage about chess',
  'Generate a web page please', 'Make me a website', 'Create a new page', 'Build a page for the club', 'Write a site',
  'Make a webpage', 'MAKE A WEB PAGE', 'Build a web page with a heading.'
], (text) => assert.strictEqual(typed(C.levels[3].steps[0], text), 'good', text));

bank('level 4: ask for a green title', [
  'Make the title green.', 'Make the heading green.', 'Change the title to green.', 'Title green', 'Turn the heading green',
  'Paint the title green', 'Set the title color to green', 'The title should be green', 'I want a green title.',
  'Make the title colour green', 'Please make the headings green', 'Change the title color to green.', 'Make the header green',
  'Make my title green', 'Make the headline green.', 'Can you make the title green?', 'Make the title color green please',
  'The heading is green', 'Titles: green', 'Change the heading colour to green', 'Make the h1 green', 'Color the title green'
], (text) => assert.strictEqual(typed(C.levels[4].steps[1], text), 'good', text));

test('level 4: a clear instruction with another color is not called a misunderstanding', () => {
  const step = C.levels[4].steps[1];
  for (const text of ['Make the title blue.', 'Make the heading red', 'Change the title to purple']) {
    assert.strictEqual(typed(step, text), 'otherColor', text);
  }
  assert.match(E.announce(step, {}, 'Make the title blue', {}).reply, /step asks for a green title/);
});

bank('level 4: take a move back', [
  'Undo that.', 'Undo', 'Take that back.', 'Take it back', 'Go back.', 'Revert that.', 'Revert the change', 'Rewind',
  '/rewind', 'Restore the page.', 'Reverse that', 'Please undo the last change', 'Undo the color change', 'Put it back',
  'Take that move back', 'I want to go back', 'Cancel that', 'Reset it', 'Roll back the change', 'Undo my last move',
  'Bring it back', 'Take the change back', 'Can you undo it?', 'Go back to before', 'Unmake that'
], (text) => assert.strictEqual(typed(C.levels[4].steps[3], text), 'good', text));

const planAsk = C.levels[5].steps.filter((step) => step.id === 'ask')[0];

bank('level 5: ask for a plan', [
  'Plan a schedule page.', 'Make a plan for a schedule page.', 'Plan the schedule page', 'Draft a schedule page',
  'Design a schedule page', 'Propose a schedule page.', 'Create a plan for a schedule page', 'Plan a page for the club schedule',
  'I want you to plan a schedule', 'Plan a calendar page', 'Plan a timetable', 'Plan a website with the club schedule',
  'Please plan a schedule page.', 'Write a plan for a schedule page', 'Plan a web page', 'Build a plan for a calendar',
  'Plan a schedule', 'Make a schedule page', 'Make a timetable page', 'Plan the club calendar', 'Plan a site for the schedule',
  'Draft a calendar.'
], (text) => assert.strictEqual(typed(planAsk, text), 'good', text));

const planEdit = C.levels[5].steps.filter((step) => step.id === 'edit')[0].events[0];
const editVariant = { target: ['4', 'four', 'fourth', 'last', 'map'] };

bank('level 5: take a step out of the plan', [
  'Remove step 4.', 'Remove the map.', 'Remove the last step.', 'Take out the map.', 'Delete step 4.', 'Drop the map.',
  'Skip the map.', 'Cut the map.', 'Without the map.', 'Get rid of the map.', "I don't want the map.", 'Leave out the map.',
  'Remove the fourth step.', 'Please remove the map', 'Delete the last step', 'Scrap the map', 'Remove four',
  'Remove step four', 'Skip step 4', 'Remove the map step', 'Cut step 4', 'Do not add the map', 'Take step 4 out'
], (text) => assert.strictEqual(typed({ kind: 'type', rules: planEdit.rules }, text, editVariant), 'good', text));

test('level 5: removing a step that belongs to the request says so', () => {
  for (const text of ['Remove step 2', 'Delete the heading', 'Remove the first step', 'Drop step 3']) {
    assert.strictEqual(typed({ kind: 'type', rules: planEdit.rules }, text, editVariant), 'wrongStep', text);
  }
});

/* ---------- Level 6: the free session ---------- */

const cap = C.levels[6].steps[0];
const withPage = { mode: 'manual', files: ['index.html'], hasPage: true, undoable: false, rules: [], ruleLines: [], denied: true };
const empty = { mode: 'manual', files: [], hasPage: false, undoable: false, rules: [], ruleLines: [], denied: true };

function pageSet(move) {
  return move.type === 'ask' ? move.yes.effects[0].set : null;
}

bank('level 6: change the title color', [
  ['Make the title green', 'green'], ['Make the title blue', 'blue'], ['Change the heading color to red', 'red'],
  ['Turn the heading green', 'green'], ['Paint the title blue', 'blue'], ['The title should be red', 'red'],
  ['Make the headings green', 'green'], ['Set the title color to blue', 'blue'], ['Title green please', 'green'],
  ['Change the title to green', 'green'], ['I want the heading blue', 'blue'], ['Make the headline red', 'red'],
  ['Make the header black', 'ink'], ['Change the title colour to red', 'red'], ['Please make the heading green', 'green'],
  ['Make the title color blue', 'blue'], ['Color the title red', 'red'], ['Switch the title to green', 'green'],
  ['Make my title blue', 'blue'], ['Make the page title green', 'green']
], ([text, value]) => {
  assert.deepStrictEqual(pageSet(E.capstone(cap, text, withPage)), { color: value }, text);
});

bank('level 6: change the title size, in words and in numbers', [
  ['Make the title bigger', 'large'], ['Make the title smaller', 'small'], ['Make the heading big', 'large'],
  ['Make the title huge', 'large'], ['Make the title 48px', 'large'], ['Make the heading 20px', 'small'],
  ['Set the title size to 48px', 'large'], ['Make the title size 3em', 'large'], ['Change the heading size to 40px', 'large'],
  ['Make the headings 32px', 'normal'], ['Make the title 150%', 'large'], ['Make the title tiny', 'small'],
  ['Make the title larger', 'large'], ['Heading 60px', 'large'], ['Make the title font size 18 pixels', 'small'],
  ['Make the title really big', 'large'], ['Set the heading to 48', 'large'], ['Change the title to 36pt', 'large'],
  ['Make the title medium', 'normal'], ['The heading size is 48px', 'large']
], ([text, value]) => {
  assert.deepStrictEqual(pageSet(E.capstone(cap, text, withPage)), { size: value }, text);
});

bank('level 6: change the background', [
  ['Make the background blue', 'blue'], ['Change the background to green', 'green'], ['Set the background color to red', 'red'],
  ['Paint the background white', 'paper'], ['The background should be blue', 'blue'], ['Make the page background green', 'green'],
  ['I want a red background', 'red'], ['Background blue please', 'blue'], ['Turn the background white', 'paper'],
  ['Change the background colour to blue', 'blue'], ['Make the page blue', 'blue'], ['Make the site green', 'green'],
  ['Make the whole page red', 'red'], ['Set the page color to white', 'paper'], ['Make the background of the page green', 'green'],
  ['Change the page to blue', 'blue'], ['Switch the background to red', 'red'], ['Make the website white', 'paper'],
  ['Background: green', 'green'], ['Paint the page red', 'red']
], ([text, value]) => {
  assert.deepStrictEqual(pageSet(E.capstone(cap, text, withPage)), { bg: value }, text);
});

bank('level 6: change the footer', [
  'Add a footer that says Made by the club', 'Change the footer to say Hello', 'Make the footer say Goodbye',
  'Set the footer to "Chess for all"', 'Add a footer', 'The footer should say Made by the club', 'Put a footer on the page',
  'Change the footer text to Hello there', 'Update the footer', 'Add a footer saying Hello', 'Write a footer that says Made by the club',
  'Footer: Hello', 'Make the page footer say Hi', 'Add a footer to the page', 'Change the footer', 'Make the footer say Welcome',
  'Set the footer text to Made by the club', 'Add a footer that says Chess since 2020', 'Put "Made by the club" in the footer',
  'Make a footer that says Hello'
], (text) => {
  const set = pageSet(E.capstone(cap, text, withPage));
  assert.ok(set && typeof set.footer === 'string' && set.footer.length > 0, text);
});

bank('level 6: a clear request the game cannot do says so, and never asks for more detail', [
  'Make the title bold', 'Make the title purple', 'Make the title italic', 'Make the background purple', 'Add a button',
  'Add a button that says Buy', 'Make the text centered', 'Make the links purple', 'Change the font to Arial',
  'Make the title underlined', 'Make the heading yellow', 'Make the background yellow', 'Center the title',
  'Make the paragraphs 18px', 'Add a table with 3 rows', 'Make the title uppercase', 'Make the menu blue',
  'Set the margins to 20px', 'Make the logo bigger', 'Make the text bigger', 'Make the links underlined'
], (text) => {
  const move = E.capstone(cap, text, withPage);
  assert.strictEqual(move.type, 'hint', text);
  assert.match(move.reply, /good request, but this practice game can’t do it yet\. Try a color, a size, a text, or a footer\./, text);
});

bank('level 6: make the page', [
  'Make a web page', 'Make a page', 'Create a website', 'Build a webpage', 'Write an html page', 'Generate a site',
  'Please make me a web page', 'Can you create a page?', 'Add a page', 'Make a web page for the chess club',
  'Build me a simple site', 'Create an HTML file', 'Write a webpage about chess', 'Make me a website', 'Create a new page',
  'Build a page for the club', 'Write a site', 'Make a webpage', 'MAKE A WEB PAGE', 'Build a web page with a heading'
], (text) => {
  const move = E.capstone(cap, text, empty);
  assert.strictEqual(move.type, 'ask', text);
  assert.strictEqual(move.ask.file, 'index.html', text);
});

bank('level 6: save rules in CLAUDE.md', [
  ['Save these rules in CLAUDE.md: headings are green; the background is blue; add a footer that says Made by the club', 3],
  ['Rules for CLAUDE.md:\nHeadings are green.\nThe background is blue.\nAdd a footer that says Made by the club.', 3],
  ['Write these rules to CLAUDE.md\n- Headings are 48px\n- The background is red\n- Add a footer', 3],
  ['Add to CLAUDE.md: headings are blue', 1], ['Save a rule: headings are green', 1],
  ['Put this rule in the rulebook: the background is white', 1], ['Rule: headings are big', 1],
  ['Rules: headings are red; the background is green', 2], ['Claude, remember: headings are green', 1],
  ['Save the rulebook:\nheadings are blue\nthe background is red\na footer', 3],
  ['Add these rules:\n1. Headings are green\n2. The background is blue\n3. Add a footer that says Hi', 3],
  ['Rule: the heading size is 48px', 1], ['New rule: titles are small', 1], ['Save a rule that the page is blue', 1],
  ['CLAUDE.md should say headings are red', 1], ['Rulebook: the footer says Made by the club', 1],
  ['Make a rule: titles are green', 1], ['Rule: use a red background', 1], ['Add a rule: sign every page', 1],
  ['Write down these rules: headings 48px; background blue; footer says Hello', 3]
], ([text, count]) => {
  const move = E.capstone(cap, text, withPage);
  assert.strictEqual(move.type, 'ask', text);
  assert.strictEqual(move.ask.file, 'CLAUDE.md', text);
  assert.strictEqual(move.yes.effects[0].rules.length, count, text);
});

test('level 6: a clear rule the game cannot apply is called good, never vague', () => {
  const move = E.capstone(cap, 'Save these rules in CLAUDE.md: headings are green; links are purple', withPage);
  assert.strictEqual(move.type, 'hint');
  assert.match(move.reply, /good rule, but this practice game can’t apply it yet/);
  const vague = E.capstone(cap, 'Save this rule in CLAUDE.md: make it nice', withPage);
  assert.match(vague.reply, /too vague/);
});

/* ---------- The way out after three misses: a complete example for every typed step ---------- */

test('every typed step and typed request in levels 3 to 5 has a complete example that works', () => {
  let count = 0;
  for (const n of [3, 4, 5]) {
    for (const step of C.levels[n].steps) {
      const jobs = [];
      if (step.kind === 'type' || step.kind === 'rules') jobs.push(step);
      for (const event of step.events || []) if (event.kind === 'type') jobs.push(event);
      for (const job of jobs) {
        assert.ok(job.example, `level ${n} ${step.id} has no complete example`);
        const variants = step.variants && step.variants.length ? step.variants : [{}];
        for (const variant of variants) {
          const filled = E.fillDeep(job, variant);
          const result = E.announce(Object.assign({}, filled, { kind: job.kind === 'rules' ? 'rules' : 'type' }), variant, E.fill(job.example, variant), { rules: [] });
          assert.strictEqual(result.outcome, 'good', `level ${n} ${step.id}: the example "${job.example}" does not complete the step`);
          count += 1;
        }
      }
    }
  }
  assert.ok(count >= 10);
});

test('level 6 has no example and no hint, so the way out there is to start again', () => {
  assert.ok(!('example' in cap) && !('hints' in cap));
});

test('the rule-writing steps tell the learner what the game understands, without sentences to copy', () => {
  for (const [n, id] of [[3, 'first-rule'], [3, 'check'], [6, 'build']]) {
    const step = C.levels[n].steps.filter((candidate) => candidate.id === id)[0];
    assert.strictEqual(step.showKinds, true, `level ${n} ${id}`);
  }
  assert.ok(kit.rulebookKinds.length >= 4);
  for (const kind of kit.rulebookKinds) assert.ok(!/headings are|background is/i.test(kind.says), `${kind.name} gives a sentence to copy`);
});
