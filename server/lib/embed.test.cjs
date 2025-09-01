const path = require('path');
const embed = require(path.join(process.cwd(), 'server', 'lib', 'embed.cjs'));
(async ()=>{
  try{
    console.log('Running embed test for product 5e670695-92f5-4dd7-95f9-2588b9507da5');
    const r = await embed.embedSaleForProduct('5e670695-92f5-4dd7-95f9-2588b9507da5');
    console.log('RESULT', r);
    if (!r || !r.ok) process.exit(2);
    console.log('EMBED_TEST_OK');
  }catch(e){ console.error('TEST_ERR', e && e.message); process.exit(3); }
})();
