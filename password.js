const bcrypt = require('bcrypt');

const saltRounds = 10;
const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as a command-line argument');
  process.exit(1);
}

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Hashed password:', hash);
});
