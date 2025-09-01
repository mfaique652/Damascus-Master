#!/usr/bin/env node
// tools/rollback_embed.js
// Usage: node tools/rollback_embed.js <pageFilename> [--list] [--restore latest]

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3){ console.log('Usage: node tools/rollback_embed.js <pageFilename> [--list | --restore latest]'); process.exit(2); }
const page = process.argv[2];
const arg = process.argv[3] || '--list';

const matches = fs.readdirSync(process.cwd()).filter(n=>n.startsWith(page + '.bak.force.')).map(n=>({ name:n, time: fs.statSync(n).mtimeMs })).sort((a,b)=>b.time - a.time);
if (arg === '--list'){
  console.log('Found backups:'); matches.forEach(m=> console.log(m.name)); process.exit(0);
}
if (arg === '--restore' && process.argv[4] === 'latest'){
  if (!matches.length) { console.error('No backups found'); process.exit(1); }
  const src = matches[0].name; const dest = page;
  const destBak = dest + '.rollback.bak.' + Date.now();
  fs.copyFileSync(dest, destBak);
  fs.copyFileSync(src, dest);
  console.log('Restored', src, 'to', dest, '; original moved to', destBak);
  process.exit(0);
}
console.log('Unknown option', arg); process.exit(2);
