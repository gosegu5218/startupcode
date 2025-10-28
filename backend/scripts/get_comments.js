require('dotenv').config({path:'./.env.dev'});
const db = require('../database/index.js');
const postId = process.argv[2] || '9';

(async () => {
  try {
    const rows = await db.query('SELECT * FROM comment_table WHERE post_id = ? ORDER BY created_at DESC LIMIT 10', [postId]);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
