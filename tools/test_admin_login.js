(async () => {
  try {
    const fetchFn = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default;
    const base = 'http://localhost:3025';

    console.log('TEST: logging in...');
    const loginResp = await fetchFn(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faiqsajjad652@gmail.com', password: 'faiq1032' })
    });
    const loginJson = await loginResp.json().catch(() => ({ error: 'invalid-json' }));
    console.log('LOGIN_STATUS', loginResp.status);
    console.log('LOGIN_BODY', JSON.stringify(loginJson, null, 2));

    if (!loginJson.token) {
      console.error('No token returned; aborting.');
      process.exit(1);
    }

    console.log('\nTEST: fetching admin inquiries...');
    const inqResp = await fetchFn(base + '/api/admin/inquiries', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + loginJson.token }
    });
    const inqJson = await inqResp.json().catch(() => ({ error: 'invalid-json' }));
    console.log('INQ_STATUS', inqResp.status);
    console.log('INQ_BODY', JSON.stringify(inqJson, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('TEST_ERROR', err && err.stack || err);
    process.exit(2);
  }
})();
