// Simple checker: extract inline <script> blocks and attempt to compile them with Function()
// Usage: node tools/check_inline_scripts.js path/to/file.html
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'hunting_bowie_knife_gift_for_men.html');
let src = '';
try { src = fs.readFileSync(file, 'utf8'); } catch (e) { console.error('read error', e.message); process.exit(2); }
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m; let i = 0; let hadError = false;
while ((m = re.exec(src)) !== null) {
  i++;
  const code = m[1];
  const preview = code.replace(/\s+/g,' ').slice(0,200);
  try {
    // Try compiling
    new Function(code);
    console.log(`Script #${i}: OK — preview: ${preview}`);
  } catch (err) {
    hadError = true;
    console.error(`Script #${i}: SYNTAX ERROR: ${err.message}`);
    console.error('--- preview ---');
    console.error(preview);
    console.error('--- full snippet start ---');
    console.error(code.slice(0,2000));
    console.error('--- full snippet end ---');
  }
}
if(i===0) console.log('No inline <script> blocks found.');
process.exit(hadError?1:0);
