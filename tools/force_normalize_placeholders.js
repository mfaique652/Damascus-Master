#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir){
  let out = [];
  for(const e of fs.readdirSync(dir, {withFileTypes:true})){ const p = path.join(dir,e.name); if(e.isDirectory()) out = out.concat(walk(p)); else out.push(p); }
  return out;
}

const files = walk(process.cwd()).filter(f=>f.endsWith('.html'));
let changed = 0;
for(const file of files){
  let s = fs.readFileSync(file,'utf8');
  const marker = 'window.__ALBUM_PLACEHOLDERS';
  const idx = s.indexOf(marker);
  if(idx === -1) continue;
  const start = s.indexOf('{', idx);
  if(start === -1) continue;
  // find matching closing brace for the object
  let i = start; let depth = 0; let end = -1;
  while(i < s.length){
    const ch = s[i];
    if(ch === '{') depth++;
    else if(ch === '}'){ depth--; if(depth===0){ end = i; break; } }
    i++;
  }
  if(end === -1) continue;
  const block = s.slice(start, end+1);
  if(!/\{\{\s*[A-Z0-9_]+\s*\}\}/.test(block)) continue; // no placeholders

  // construct normalized block using the common placeholder names and safe JSON.parse wrappers
  const keys = ['title','desc','price','mainImage','imagesHtml','heartId','detailsJson','albumFilename','productId','sale','reviewsApi'];
  const parts = [];
  for(const key of keys){
    if(key === 'imagesHtml'){
      parts.push(`    ${key}: (function(){ try{ return JSON.parse('\"{{${key.toUpperCase()}}}\"'); }catch(e){ try{ return (document.getElementById('albumThumbs')||document.getElementById('albumThumbs')) ? document.getElementById('albumThumbs').innerHTML : ''; }catch(e2){ return ''; } } })(),`);
    } else if(key === 'sale'){
      parts.push(`    ${key}: (function(){ try{ return JSON.parse('\"{{SALE_JSON}}\"'); }catch(e){ return null; } })(),`);
    } else {
      parts.push(`    ${key}: (function(){ try{ return JSON.parse('\"{{${key.toUpperCase()}}}\"'); }catch(e){ return '{{${key.toUpperCase()}}}'; } })(),`);
    }
  }
  const newBlock = '{\n' + parts.join('\n') + '\n  }';
  const backup = file + '.bak.normalize_force';
  if(!fs.existsSync(backup)) fs.copyFileSync(file, backup);
  s = s.slice(0, start) + newBlock + s.slice(end+1);
  fs.writeFileSync(file, s, 'utf8');
  console.log('Force-normalized', file);
  changed++;
}
console.log('force_normalize_placeholders: done, files changed:', changed);
