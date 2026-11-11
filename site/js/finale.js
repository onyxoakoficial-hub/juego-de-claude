/*
  Checkmate - the end screen: the completion card, how to share it, and the first-real-session checklist.
  Loaded only when the learner opens the end screen. Every word comes from content/en-finale.js.

  The card is drawn on this page. Nothing is sent anywhere and nothing is stored: a name typed on the
  card lives only until the page is closed. Text is always written with textContent.
*/
(function (root) {
  'use strict';

  var app = (root.CHECKMATE = root.CHECKMATE || {});

  /* A date like "11 November 2026". */
  function longDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function make(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(doc, item, className) {
    var a = make(doc, 'a', className, item.text);
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  /* The text of the card, for copying and sharing. */
  function cardText(F, name, date) {
    var lines = [F.card.shareText];
    if (name) lines.unshift(name + ' — ' + longDate(date));
    return lines.join('\n');
  }

  function token(style, name, fallback) {
    var value = style.getPropertyValue(name).trim();
    return value || fallback;
  }

  /* Draws the card as a picture. Reads its colours and fonts from the page's tokens. */
  function drawCard(doc, F, name, date) {
    var canvas = doc.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    var ctx = canvas.getContext('2d');
    var style = root.getComputedStyle(doc.documentElement);

    var colors = {
      band: token(style, '--c-band', '#151b16'),
      ink: token(style, '--c-on-band', '#f3f3ea'),
      muted: token(style, '--c-on-band-muted', '#bcbcb2'),
      accent: token(style, '--c-focus-on-band', '#81d39f'),
      line: token(style, '--c-band-line', '#5b625c')
    };

    ctx.fillStyle = colors.band;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    /* The king, from the same drawing used on the page. */
    var sprite = doc.getElementById('piece-king');
    if (sprite) {
      ctx.save();
      ctx.translate(90, 100);
      ctx.scale(6, 6);
      ctx.fillStyle = colors.accent;
      Array.prototype.forEach.call(sprite.children, function (shape) {
        var tag = shape.tagName.toLowerCase();
        if (tag === 'path') {
          ctx.fill(new root.Path2D(shape.getAttribute('d')));
        } else if (tag === 'rect') {
          ctx.fillRect(+shape.getAttribute('x'), +shape.getAttribute('y'), +shape.getAttribute('width'), +shape.getAttribute('height'));
        } else if (tag === 'circle') {
          ctx.beginPath();
          ctx.arc(+shape.getAttribute('cx'), +shape.getAttribute('cy'), +shape.getAttribute('r'), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    var display = '600 96px ' + token(style, '--font-display', 'Georgia, serif');
    var text = '400 34px ' + token(style, '--font-text', 'system-ui, sans-serif');
    var small = '400 26px ' + token(style, '--font-text', 'system-ui, sans-serif');

    function wrap(words, x, y, width, lineHeight) {
      var line = '';
      words.split(' ').forEach(function (word) {
        var test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > width && line) {
          ctx.fillText(line, x, y);
          line = word;
          y += lineHeight;
        } else {
          line = test;
        }
      });
      ctx.fillText(line, x, y);
      return y;
    }

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = colors.ink;
    ctx.font = display;
    ctx.fillText(F.card.heading, 420, 200);
    ctx.font = text;
    ctx.fillStyle = colors.ink;
    var y = wrap(F.card.line, 420, 270, 700, 48);
    if (name) {
      ctx.font = '600 44px ' + token(style, '--font-display', 'Georgia, serif');
      ctx.fillStyle = colors.accent;
      y = wrap(name, 420, y + 80, 700, 52);
    }
    ctx.font = small;
    ctx.fillStyle = colors.muted;
    ctx.fillText(longDate(date), 420, 500);
    wrap(F.card.unofficial, 90, 565, 1020, 34);
    return canvas;
  }

  function render(container, doc) {
    var F = app.content.finale;
    var date = new Date();
    var state = { name: '' };
    container.textContent = '';

    /* ----- The card ----- */
    var card = make(doc, 'section', 'finale__card');
    card.setAttribute('aria-labelledby', 'finale-card-title');

    var shown = make(doc, 'div', 'certificate band');
    var mark = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mark.setAttribute('class', 'certificate__piece');
    mark.setAttribute('fill', 'currentColor');
    mark.setAttribute('aria-hidden', 'true');
    mark.setAttribute('focusable', 'false');
    var use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#piece-king');
    mark.appendChild(use);
    var words = make(doc, 'div', 'certificate__text');
    var title = make(doc, 'h2', 'certificate__title', F.card.heading);
    title.id = 'finale-card-title';
    var line = make(doc, 'p', 'certificate__line', F.card.line);
    var who = make(doc, 'p', 'certificate__name');
    var when = make(doc, 'p', 'certificate__fine', longDate(date));
    var legal = make(doc, 'p', 'certificate__fine', F.card.unofficial);
    [title, line, who, when, legal].forEach(function (node) { words.appendChild(node); });
    shown.appendChild(mark);
    shown.appendChild(words);
    card.appendChild(shown);

    var field = make(doc, 'div', 'finale__field');
    var label = make(doc, 'label', 'label label--muted', F.card.nameLabel);
    label.setAttribute('for', 'finale-name');
    var input = make(doc, 'input', 'field');
    input.id = 'finale-name';
    input.type = 'text';
    input.maxLength = 40;
    input.autocomplete = 'off';
    var help = make(doc, 'p', 'fine', F.card.nameHelp);
    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(help);
    card.appendChild(field);

    var actions = make(doc, 'div', 'finale__actions');
    var download = make(doc, 'button', 'btn btn--primary', F.card.download);
    download.type = 'button';
    var copy = make(doc, 'button', 'btn btn--secondary', F.card.copy);
    copy.type = 'button';
    actions.appendChild(download);
    actions.appendChild(copy);
    var canShare = typeof root.navigator.share === 'function';
    var share = null;
    if (canShare) {
      share = make(doc, 'button', 'btn btn--secondary', F.card.share);
      share.type = 'button';
      actions.appendChild(share);
    }
    card.appendChild(actions);
    var status = make(doc, 'p', 'fine');
    status.setAttribute('role', 'status');
    card.appendChild(status);
    container.appendChild(card);

    input.addEventListener('input', function () {
      state.name = input.value.trim();
      who.textContent = state.name;
      who.hidden = !state.name;
    });
    who.hidden = true;

    download.addEventListener('click', function () {
      status.textContent = '';
      var go = function () {
        try {
          var canvas = drawCard(doc, F, state.name, date);
          canvas.toBlob(function (blob) {
            if (!blob) {
              status.textContent = F.card.downloadFailed;
              return;
            }
            var url = root.URL.createObjectURL(blob);
            var a = doc.createElement('a');
            a.href = url;
            a.download = F.card.fileName;
            doc.body.appendChild(a);
            a.click();
            doc.body.removeChild(a);
            root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 1000);
          }, 'image/png');
        } catch (error) {
          status.textContent = F.card.downloadFailed;
        }
      };
      /* Wait for the fonts, so the picture uses the same type as the page. */
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go);
      else go();
    });

    copy.addEventListener('click', function () {
      var text = cardText(F, state.name, date);
      var done = function () { status.textContent = F.card.copied; };
      var fail = function () { status.textContent = F.card.copyFailed; };
      if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
        root.navigator.clipboard.writeText(text).then(done, fail);
        return;
      }
      try {
        var area = doc.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.className = 'visually-hidden';
        doc.body.appendChild(area);
        area.select();
        var ok = doc.execCommand('copy');
        doc.body.removeChild(area);
        if (ok) done();
        else fail();
      } catch (error) {
        fail();
      }
    });

    if (share) {
      share.addEventListener('click', function () {
        root.navigator.share({ title: F.card.heading, text: cardText(F, state.name, date) }).then(
          function () { status.textContent = F.card.shared; },
          function () { status.textContent = ''; }
        );
      });
    }

    /* ----- The checklist ----- */
    var C = F.checklist;
    var list = make(doc, 'section', 'finale__list');
    list.setAttribute('aria-labelledby', 'finale-list-title');
    var heading = make(doc, 'h2', '', C.title);
    heading.id = 'finale-list-title';
    list.appendChild(heading);
    var checked = new Date(C.checkedOn + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    list.appendChild(make(doc, 'p', 'section__lead', C.lead.split('{date}').join(checked)));

    var steps = make(doc, 'ol', 'steps-list');
    C.steps.forEach(function (stepData) {
      var item = make(doc, 'li', 'steps-list__item');
      var h3 = make(doc, 'h3', '', stepData.title);
      item.appendChild(h3);
      stepData.body.forEach(function (paragraph) {
        item.appendChild(make(doc, 'p', '', paragraph));
      });
      if (stepData.commands) {
        var commands = make(doc, 'dl', 'commands');
        stepData.commands.forEach(function (command) {
          var row = make(doc, 'div', 'commands__row');
          row.appendChild(make(doc, 'dt', 'fine', command.label));
          var dd = make(doc, 'dd');
          dd.appendChild(make(doc, 'code', '', command.code));
          row.appendChild(dd);
          commands.appendChild(row);
        });
        item.appendChild(commands);
      }
      var sources = make(doc, 'p', 'fine steps-list__source');
      sources.appendChild(doc.createTextNode(C.sourceLabel + ': '));
      sources.appendChild(link(doc, stepData.source));
      (stepData.extras || (stepData.extra ? [stepData.extra] : [])).forEach(function (extra) {
        sources.appendChild(doc.createTextNode(' · '));
        sources.appendChild(link(doc, extra));
      });
      item.appendChild(sources);
      steps.appendChild(item);
    });
    list.appendChild(steps);

    var back = make(doc, 'a', 'btn btn--secondary', F.back);
    back.href = '#map';
    list.appendChild(back);
    container.appendChild(list);
  }

  app.finale = { render: render, drawCard: drawCard, cardText: cardText };
})(typeof window !== 'undefined' ? window : globalThis);
