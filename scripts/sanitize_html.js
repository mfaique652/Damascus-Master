// sanitize_html.js
// Scans top-level .html files in the workspace and removes embedded duplicate full-document blocks
const fs = require('fs');
const path = require('path');

// By default sanitize the workspace root (one level up from scripts).
// Accept an optional CLI argument to target a specific directory.
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const pattern = '\\.(html|htm)$';
// Directories to exclude from recursive sanitization to avoid touching system or 3rd-party app files
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'faiqs', 'AppData']);

function removeEmbeddedDoctypes(s) {
  if (!s || typeof s !== 'string') return s;
  const first = s.indexOf('<!DOCTYPE');
  if (first === -1) return s;
  let out = s;
  // Remove any subsequent full-document starts and splice them out (from the second <!DOCTYPE to its matching </html>)
  let next = out.indexOf('<!DOCTYPE', first + 1);
  let removed = 0;
  while (next !== -1) {
    const closing = out.indexOf('</html>', next);
    if (closing === -1) break; // can't find end, bail
    out = out.slice(0, next) + out.slice(closing + 7);
    removed++;
    next = out.indexOf('<!DOCTYPE', first + 1);
  }
  return { text: out, removed };
}

function walkAndSanitize(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(it => {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) {
      // Skip explicit excludes and common large/system folders.
      if (EXCLUDE_DIRS.has(it.name) || it.name.toLowerCase().includes('program files') || it.name.toLowerCase().includes('$recycle.bin')) return;
      // Also skip very large or hidden directories by name heuristics
      if (it.name.startsWith('.') || it.name.toLowerCase().includes('local') || it.name.toLowerCase().includes('resources')) return;
      walkAndSanitize(p);
    } else if (it.isFile() && it.name.match(new RegExp(pattern, 'i'))) {
      try {
        const txt = fs.readFileSync(p, 'utf8');
        const res = removeEmbeddedDoctypes(txt);
        if (res.removed) {
          try {
            // Ensure the file path is inside the intended root (avoid symlink surprises)
            const rel = path.relative(root, p);
            if (rel.startsWith('..')) {
              console.warn('Skipping file outside target root:', p);
              return;
            }
            fs.writeFileSync(p, res.text, 'utf8');
            console.log('Sanitized', p, '-', res.removed, 'block(s) removed');
          } catch (writeErr) {
            console.error('Failed to write sanitized file (skipped):', p, writeErr && writeErr.message ? writeErr.message : writeErr);
          }
        }
      } catch (e) {
        console.error('Failed to sanitize', p, e && e.stack ? e.stack : e);
      }
    }
  });
}

walkAndSanitize(root);
console.log('Sanitization complete.');
