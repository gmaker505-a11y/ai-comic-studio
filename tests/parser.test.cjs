const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)]
  .map(match => match[1]).filter(script => script.trim());
assert.ok(scripts.length, 'Application script must exist');
const app = scripts.at(-1);
new Function(app);
const parserStart = app.indexOf('function splitScript(src){');
const parserEnd = app.indexOf("$('parse').onclick=", parserStart);
assert.ok(parserStart >= 0 && parserEnd > parserStart, 'Script parser function must be present');
const splitScript = new Function(app.slice(parserStart, parserEnd) + '; return splitScript;')();
const letteringStart = app.indexOf('function makeLettering(panelText){');
const letteringEnd = app.indexOf('function makePrompt(', letteringStart);
assert.ok(letteringStart >= 0 && letteringEnd > letteringStart, 'Lettering helper must be present');
const makeLettering = new Function(app.slice(letteringStart, letteringEnd) + '; return makeLettering;')();
const counts = Array.from({length:22}, (_, i) => i < 4 ? 6 : i === 18 ? 6 : 5);
const fixture = counts.map((count, index) => {
  const panels = Array.from({length:count}, (_, j) =>
    (j + 1) + ' · Medium Visual: Scene ' + (j + 1) + '. Letters: BILLY: "Test dialogue."'
  ).join('\\n');
  return 'PAGE ' + (index + 1) + ': "Test Page ' + (index + 1) + '"\\nLayout: ' + count + ' panels.\\n' + panels;
}).join('\\n\\n');
const pages = splitScript(fixture);
assert.equal(pages.length, 22, 'Must detect all 22 comic pages');
assert.equal(pages.reduce((sum, page) => sum + page.panels.length, 0), 115, 'Must detect all 115 panels');
assert.equal(pages.reduce((sum, page) => sum + page.declaredPanels, 0), 115, 'Declared panel counts must add up');
assert.equal(pages.filter(page => page.declaredPanels !== page.detectedPanels).length, 0, 'No panel count mismatches expected');
const lettering = makeLettering('Visual: Test. Letters: KIERAN: "Stay close." BILLY: "I am."');
assert.equal(lettering.length, 2, 'Should extract multiple speech balloons');
assert.equal(lettering[0].speaker, 'KIERAN');
assert.equal(lettering[0].text, 'Stay close.');
console.log('PASS: JavaScript syntax, 22-page / 115-panel split, declared counts, and speech lettering');
