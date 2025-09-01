// Normalize window.__ALBUM_PLACEHOLDERS blocks in an HTML file
// Usage: node tools/normalize_album_placeholder.js path/to/file.html
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'hunting_bowie_knife_gift_for_men.html');
let s = fs.readFileSync(file, 'utf8');
const marker = 'window.__ALBUM_PLACEHOLDERS';
let occurrences = 0;
let out = s;
let pos = 0;
while ((pos = out.indexOf(marker, pos)) !== -1) {
  // find the opening '{' after the marker
  const braceIdx = out.indexOf('{', pos);
  if (braceIdx === -1) break;
  // find matching closing brace for the object (stack)
  let depth = 1; let j = braceIdx + 1;
  while (j < out.length && depth > 0) {
    const ch = out[j];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    j++;
  }
  if (depth !== 0) break;
  const objText = out.slice(braceIdx, j);
  let newObjText = objText;
  // Replace desc: '...' or desc: "..." with template literal
  newObjText = newObjText.replace(/desc:\s*(['"])([\s\S]*?)\1(,?)/mi, function(m, q, g1, trailing){
    const cleaned = String(g1 || '').replace(/`/g,'\\`');
    return 'desc: `'+cleaned.replace(/\r/g,'')+'`' + (trailing||',');
  });
  // Replace imagesHtml JSON.parse('...') patterns to a safe template literal
  newObjText = newObjText.replace(/imagesHtml:\s*\([\s\S]*?\)\(\),/gmi, function(m){
    const imgsMatch = m.match(/return\s*\(?\s*(['"])([\s\S]*?)\1/i);
    if (imgsMatch && imgsMatch[2]){
      const html = imgsMatch[2].replace(/\\n/g,'\n');
      const safe = html.replace(/`/g,'\\`');
      return 'imagesHtml: (function(){ try{ return `'+safe+'`; }catch(e){ return `'+safe+'`; } })(),';
    }
    // If pattern not found, try to convert the inner quoted string directly
    const qMatch = m.match(/JSON.parse\(\s*(['"])([\s\S]*?)\1\s*\)/i);
    if (qMatch && qMatch[2]){
      const html = qMatch[2].replace(/\\n/g,'\n');
      const safe = html.replace(/`/g,'\\`');
      return 'imagesHtml: (function(){ try{ return `'+safe+'`; }catch(e){ return `'+safe+'`; } })(),';
    }
    return m;
  });

  // Also handle plain imagesHtml: '...'(or double-quoted) produced by older templates
  newObjText = newObjText.replace(/imagesHtml:\s*(['"])([\s\S]*?)\1(,?)/gmi, function(m, q, inner, trailing){
    const html = String(inner).replace(/\\n/g,'\n');
    const safe = html.replace(/`/g,'\\`');
    return 'imagesHtml: (function(){ try{ return `'+safe+'`; }catch(e){ return `'+safe+'`; } })()' + (trailing||',');
  });
  // Ensure any remaining single-quoted desc is fixed
  newObjText = newObjText.replace(/desc:\s*(['"])([\s\S]*?)\1/mi, function(m,q,g1){ const cleaned=String(g1).replace(/`/g,'\\`'); return 'desc: `'+cleaned+'`'; });
// Write back
  if (newObjText !== objText) {
    out = out.slice(0, braceIdx) + newObjText + out.slice(j);
    occurrences++;
  }
  pos = braceIdx + 1;
}
if (occurrences === 0) { console.log('no changes required'); process.exit(0); }
fs.writeFileSync(file, out, 'utf8');
console.log('normalized placeholders in', file, ' occurrences:', occurrences);
