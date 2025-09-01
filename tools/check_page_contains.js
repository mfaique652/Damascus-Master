const http = require('http');
const url = process.argv[2];
const pattern = process.argv[3] || '"active":true';
if(!url){ console.error('usage: node check_page_contains.js <url> [pattern]'); process.exit(2); }
http.get(url, res => {
  let buf = '';
  res.on('data', c => buf += c.toString());
  res.on('end', () => {
    console.log(buf.indexOf(pattern)!==-1 ? 'FOUND' : 'NOTFOUND');
  });
}).on('error', e => { console.error('ERR', e.message); process.exit(3); });
