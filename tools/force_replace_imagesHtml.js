#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

if(process.argv.length < 3){
  console.error('Usage: node tools/force_replace_imagesHtml.js <file.html>');
  process.exit(2);
}
const file = path.resolve(process.cwd(), process.argv[2]);
if(!fs.existsSync(file)){
  console.error('File not found', file);
  process.exit(3);
}
let s = fs.readFileSync(file, 'utf8');
const re = /imagesHtml\s*:\s*\(function\(\)\s*\{[\s\S]*?\}\)\s*\(\s*\)\s*,/g;
const replacement = `imagesHtml: (function(){ try{ return (document.getElementById('albumThumbs')||document.getElementById('albumThumbs')) ? document.getElementById('albumThumbs').innerHTML : ''; }catch(e){ return ''; } })(),`;
if(!re.test(s)){
  console.log('No imagesHtml pattern found in', file);
  process.exit(0);
}
fs.copyFileSync(file, file + '.bak.force_replace_imagesHtml');
s = s.replace(re, replacement);
fs.writeFileSync(file, s, 'utf8');
console.log('Replaced imagesHtml in', file);
