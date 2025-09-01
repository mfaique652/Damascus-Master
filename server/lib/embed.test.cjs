const path = require('path');
const fs = require('fs');
const embed = require(path.join(process.cwd(), 'server', 'lib', 'embed.cjs'));
(async ()=>{
  try{
    // Get a valid product ID from the database
    const dbPath = path.join(process.cwd(), 'server', 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const productId = db.products?.[0]?.id;
    
    if (!productId) {
      console.log('No products found in database');
      process.exit(0); // Exit gracefully if no products
    }
    
    console.log('Running embed test for product', productId);
    const r = await embed.embedSaleForProduct(productId);
    console.log('RESULT', r);
    if (!r || !r.ok) process.exit(2);
    console.log('EMBED_TEST_OK');
  }catch(e){ console.error('TEST_ERR', e && e.message); process.exit(3); }
})();
