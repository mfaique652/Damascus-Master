#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir){
  let out = [];
  for(const e of fs.readdirSync(dir, {withFileTypes:true})){ 
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out = out.concat(walk(p)); else out.push(p);
  }
  return out;
}

const files = walk(process.cwd()).filter(f=>f.endsWith('.html'));
let changed = 0;
for(const file of files){
  let s = fs.readFileSync(file, 'utf8');
  const marker = 'window.__ALBUM_PLACEHOLDERS';
  const idx = s.indexOf(marker);
  if(idx === -1) continue;
  // find opening brace after marker
  const eq = s.indexOf('=', idx);
  if(eq === -1) continue;
  const braceStart = s.indexOf('{', eq);
  if(braceStart === -1) continue;
  // find matching closing brace
  let i = braceStart; let depth = 0; let endIndex = -1;
  while(i < s.length){
    const ch = s[i];
    if(ch === '{') depth++;
    else if(ch === '}'){
      depth--;
      if(depth === 0){ endIndex = i; break; }
    }
    i++;
  }
  if(endIndex === -1) continue;
  const block = s.slice(braceStart, endIndex+1);
  let newBlock = block;
    // keys to normalize - we'll convert bare {{PLACEHOLDER}} tokens into safe string literals
    const keys = ['title','desc','price','mainImage','imagesHtml','heartId','detailsJson','albumFilename','productId','sale','reviewsApi'];
    for(const key of keys){
      // build a regex that matches: key: {{NAME}}  or key: '{{NAME}}' or key: "{{NAME}}"
      const re = new RegExp(`(${key}\s*:\s*)(?:["']?)\\{\\{([A-Z0-9_]+)\\}\\}(?:["']?)(\\s*[,}])`, 'g');
      newBlock = newBlock.replace(re, (full, prefix, ph, suffix) => {
        const placeholder = `{{${ph}}}`;
        // For imagesHtml prefer keeping the DOM-based initializer as a safe fallback in live pages,
        // but wrapping the placeholder in a string is sufficient to make template files syntactically valid.
        if(key === 'imagesHtml'){
          return `${prefix}(function(){ try{ return JSON.parse('"${placeholder}"'); }catch(e){ try{ return (document.getElementById('albumThumbs')||document.getElementById('albumThumbs')) ? document.getElementById('albumThumbs').innerHTML : ''; }catch(e2){ return ''; } } })()${suffix}`;
        }
        if(key === 'sale'){
          // wrap sale placeholder as a string so parser doesn't see raw braces
          return `${prefix}(function(){ try{ return JSON.parse('"${placeholder}"'); }catch(e){ return null; } })()${suffix}`;
        }
        return `${prefix}(function(){ try{ return JSON.parse('"${placeholder}"'); }catch(e){ return '${placeholder}'; } })()${suffix}`;
      });
    }
  if(newBlock !== block){
    const backup = file + '.bak.normalize_placeholders';
    if(!fs.existsSync(backup)) fs.copyFileSync(file, backup);
    s = s.slice(0, braceStart) + newBlock + s.slice(endIndex+1);
    fs.writeFileSync(file, s, 'utf8');
    console.log('Normalized placeholders in', file);
    changed++;
  }
}
console.log('normalize_template_placeholders: done, files changed:', changed);
