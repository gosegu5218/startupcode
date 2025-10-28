require('dotenv').config({path:'./.env.dev'});
const db = require('../database/index.js');

(async () => {
  try {
    await db.query("UPDATE user_table SET session_id = 'TEST_SESSION' WHERE user_id = 1;");
    console.log('UPDATED_SESSION');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
