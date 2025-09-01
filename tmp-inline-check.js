const fs = require("fs");
const path = require("path");
const root = "d:/Damascus Master - Copy (2)";
const htmlFiles = [];
(function walk(d){
  for(const n of fs.readdirSync(d)){
    const p = path.join(d,n);
    try{
      const st = fs.statSync(p);
      if(st.isDirectory()) walk(p);
      else if(p.endsWith('.html')) htmlFiles.push(p);
    }catch(e){}
  }
})(root);
function checkFile(f){
  const s = fs.readFileSync(f,'utf8');
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m; let i = 0;
  while((m = re.exec(s))){
    i++;
    const code = m[1];
    try{ new Function(code); }catch(err){
      console.log(JSON.stringify({file: f, script: i, error: err.message}));
    }
  }
}
htmlFiles.forEach(checkFile);
