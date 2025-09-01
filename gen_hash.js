const bcrypt = require('bcryptjs');
const pw = process.argv[2] || 'OldPass123!';
console.log(bcrypt.hashSync(pw, 10));
