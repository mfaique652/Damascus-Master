#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function fixFile(file) {
  if (!file.endsWith('.html')) return;
  let s = fs.readFileSync(file, 'utf8');
  let orig = s;
  let idx = 0;
  let changed = false;
  while (true) {
    const start = s.indexOf('imagesHtml', idx);
    if (start === -1) break;
    // find the colon after imagesHtml
    const colon = s.indexOf(':', start);
    if (colon === -1) break;
    // search for a reasonable region end (}, or ); or end of object) within next 5000 chars
    const searchSlice = s.slice(colon, Math.min(s.length, colon + 5000));
    const candEnds = ['},', '},\n', '});', '})(),', '};', '\n'];
    let relEnd = -1;
    for (const e of candEnds) {
      const i = searchSlice.indexOf(e);
      if (i !== -1) {
        const abs = colon + i + e.length;
        if (relEnd === -1 || abs < relEnd) relEnd = abs;
      }
    }
    if (relEnd === -1) relEnd = Math.min(s.length, colon + 2000);
    const sliceStart = colon;
    const sliceEnd = relEnd;
    const slice = s.slice(sliceStart, sliceEnd);

    // Convert attribute='value' -> attribute="value" inside this slice
    let fixedSlice = slice.replace(/=\'([^']*)\'/g, '="$1"');

    // Normalize <img ...> tags in the slice to use single-quoted attributes
    fixedSlice = fixedSlice.replace(/<img[\s\S]*?>/g, (tag) => {
      return tag.replace(/(\w+)="([^"]*)"/g, "$1='$2'");
    });

    // For JSON.parse(...): convert wrapper to backticks and escape backticks/backslashes
    fixedSlice = fixedSlice.replace(/JSON\.parse\(("|')([\s\S]*?)\1\)/g, (m, q, inner) => {
      let inner2 = inner.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
      return `JSON.parse(\`${inner2}\`)`;
    });

    // Also escape inner quotes for bare return "..." and return '...'
    // For return ... wrappers: convert to backtick-wrapped string and escape backticks/backslashes
    fixedSlice = fixedSlice.replace(/return\s*(?:\(|)\s*("|')([\s\S]*?)\1\s*(?:\)|)*/g, (m, q, inner) => {
      let inner2 = inner.replace(/(\w+)="([^"]*)"/g, "$1='$2'");
      inner2 = inner2.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
      return `return \`${inner2}\``;
    });
    // catch(...) { return "..."; } or catch(e){ return '...'; }
    fixedSlice = fixedSlice.replace(/catch\([^)]+\)\s*\{([\s\S]*?)\}/g, (m, inner) => {
      return m.replace(/return\s+"([\s\S]*?)"/g, (mm, inner2) => `return "${inner2.replace(/\\/g,'\\\\').replace(/"/g,'\\\"')}"`).replace(/return\s+'([\s\S]*?)'/g, (mm, inner2) => `return '${inner2.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}'`);
    });

    if (fixedSlice !== slice) {
      s = s.slice(0, sliceStart) + fixedSlice + s.slice(sliceEnd);
      changed = true;
    }
    idx = sliceEnd;
  }

  if (changed) {
    // write backup
    fs.copyFileSync(file, file + '.bak.fix_inline_images');
    fs.writeFileSync(file, s, 'utf8');
    console.log('Fixed:', file);
  }
}

const root = process.cwd();
walk(root, (f) => {
  try { fixFile(f); } catch (e) { /* ignore */ }
});

console.log('fix_inline_images: done');
