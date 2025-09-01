const http = require('http');
const payload = {
  name: 'Automated Test',
  email: 'auto-test@example.com',
  country: 'Other',
  phone: '+10000000000',
  inquiryType: 'Other',
  message: 'This is an automated test of the support/contact endpoint to reproduce the user error.',
  newsletter: false
};
const data = JSON.stringify(payload);
const opts = {
  hostname: 'localhost',
  port: 3025,
  path: '/api/support/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(opts, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});
req.on('error', e => console.error('REQERR', e));
req.write(data);
req.end();
