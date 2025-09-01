const bcrypt = require('bcryptjs');
const pwd = 'faiq1032';
bcrypt.hash(pwd, 10)
  .then(hash => console.log(hash))
  .catch(err => {
    console.error('ERROR', err);
    process.exit(1);
  });
