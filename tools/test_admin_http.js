const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: 3025, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(opts, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks || '{}') }); }
        catch (e) { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(path, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3025, path, method: 'GET', headers: {} };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    const req = http.request(opts, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks || '{}') }); }
        catch (e) { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in as admin...');
    const login = await postJson('/api/auth/login', { email: 'faiqsajjad652@gmail.com', password: 'faiq1032' });
    console.log('Login status:', login.status);
    console.log('Login body:', JSON.stringify(login.body, null, 2));
    const token = login.body && login.body.token;
    if (!token) {
      console.error('No token returned; aborting.');
      process.exit(1);
    }

    console.log('\nFetching admin inquiries...');
    const inq = await getJson('/api/admin/inquiries', token);
    console.log('Inquiries status:', inq.status);
    console.log('Inquiries body:', JSON.stringify(inq.body, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Test error:', e && e.stack || e);
    process.exit(2);
  }
})();
