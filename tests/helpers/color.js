'use strict';

/*
  Colour maths shared by the tests. No dependencies.
  OKLCH -> sRGB conversion and the WCAG 2.x contrast ratio.
*/

function oklchToLinear(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ].map((v) => Math.min(1, Math.max(0, v)));
}

function encode(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function decode(v) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/* "oklch(0.42 0.09 155)" or "oklch(0.2 0.015 150 / 0.12)" -> { r, g, b, a } with 0-255 channels. */
function parseOklch(text) {
  const m = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/.exec(text);
  if (!m) return null;
  const rgb = oklchToLinear(Number(m[1]), Number(m[2]), Number(m[3])).map((v) => Math.round(encode(v) * 255));
  return { r: rgb[0], g: rgb[1], b: rgb[2], a: m[4] === undefined ? 1 : Number(m[4]) };
}

/* "#185b37" or "rgba(17, 24, 18, 0.12)" -> { r, g, b, a }. */
function parseSrgb(text) {
  let m = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})\b/i.exec(text);
  if (m) return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16), a: 1 };
  m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/.exec(text);
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  return null;
}

function toHex(c) {
  return '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/* Paint a see-through colour over a solid one. */
function over(top, bottom) {
  const mix = (t, b) => Math.round(t * top.a + b * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function luminance(c) {
  return 0.2126 * decode(c.r / 255) + 0.7152 * decode(c.g / 255) + 0.0722 * decode(c.b / 255);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

module.exports = { parseOklch, parseSrgb, toHex, over, luminance, contrast };
