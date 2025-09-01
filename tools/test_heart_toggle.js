const puppeteer = require('puppeteer-core');
(async ()=>{
  const browser = await puppeteer.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3025/hand_forged_damascus_steel_5_pcs_rosewood_handle_chef_knife_set.html', { waitUntil: 'networkidle0' });
  // Wait for heart
  await page.waitForSelector('.wishlist-heart');
  const before = await page.evaluate(()=> localStorage.getItem('wishlist'));
  await page.click('.wishlist-heart');
  await page.waitForTimeout(250);
  const after = await page.evaluate(()=> localStorage.getItem('wishlist'));
  console.log('before', before);
  console.log('after', after);
  await browser.close();
})();
