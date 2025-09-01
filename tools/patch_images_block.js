#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir){
  let out = [];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const f = path.join(dir,e.name); if(e.isDirectory()) out = out.concat(walk(f)); else out.push(f); }
  return out;
}

function escapeBackticks(s){ return s.replace(/\\/g,'\\\\').replace(/`/g,'\\`'); }

function fixFile(file){
  if(!file.endsWith('.html')) return false;
  let s = fs.readFileSync(file,'utf8');
  const thumbsRe = /<div[^>]*id=["']albumThumbs["'][^>]*>([\s\S]*?)<\/div>/i;
  const m = s.match(thumbsRe);
  if(!m) return false;
  const thumbsHtml = m[1].trim();
  const htmlEsc = escapeBackticks(thumbsHtml);
  const replacement = `imagesHtml: (function(){ try{ return JSON.parse(\`${htmlEsc}\`); }catch(e){ try{ return \`${htmlEsc}\`; }catch(e2){ return ''; } } })(),`;

  const imagesRe = /imagesHtml\s*:\s*\(function\(\)\s*\{[\s\S]*?\}\)\s*\(\s*\)\s*,/i;
  if(!imagesRe.test(s)) {
    // try simpler pattern
    const imagesRe2 = /imagesHtml\s*:\s*([\s\S]*?),\n/;
    if(!imagesRe2.test(s)) return false;
    s = s.replace(imagesRe2, replacement + '\n');
  } else {
    s = s.replace(imagesRe, replacement);
  }

  fs.copyFileSync(file, file + '.bak.patch_images');
  fs.writeFileSync(file, s, 'utf8');
  console.log('Patched:', file);
  return true;
}

const root = process.cwd();
const files = walk(root);
let count = 0;
for(const f of files){ try{ if(f.includes('node_modules')) continue; if(f.includes('.git')) continue; if(f.includes('backups') || f.includes('html_backup')){ /* include these too to fix older files */ } if(f.endsWith('.html')){ if(fixFile(f)) count++; } } catch(e){ /* ignore */ } }
console.log('patch_images_block: done, patched', count);
