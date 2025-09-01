const bcrypt = require('bcryptjs');
(async () => {
  try {
    const h = await bcrypt.hash('AdminPass123!', 10);
    console.log(h);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
// Cleaned up the script by removing duplicate comments
