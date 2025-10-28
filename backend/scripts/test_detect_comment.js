require('dotenv').config({ path: './.env.dev' });
const path = require('path');
const yoloUtil = require('../util/yoloUtil');
const commentModel = require('../model/commentModel');

(async () => {
  const postId = process.argv[2] || '9';
  const userId = process.argv[3] || '1';
  // Example attach path used earlier
  const attachFilePath = process.argv[4] || '/public/image/post/postFile-1761494663889-229844002.png';

  try {
    // resolve path
    const projectRoot = path.resolve(__dirname, '..');
    const relPath = attachFilePath.replace(/^[/\\]+/, '');
    const imagePath = path.join(projectRoot, relPath);
    console.log('[test_detect_comment] imagePath ->', imagePath);

    const resultText = await yoloUtil.detectImage(imagePath).catch(e => {
      console.error('[test_detect_comment] detectImage error', e && e.stack ? e.stack : e.message || e);
      return null;
    });

    console.log('[test_detect_comment] detect resultText ->', resultText);
    if (!resultText) {
      console.log('No detection result, aborting comment insertion');
      process.exit(0);
    }

    const commentContent = `자동분석 결과: ${resultText}`;
    const writeResult = await commentModel.writeComment({ postId, userId, commentContent }).catch(err => {
      console.error('[test_detect_comment] writeComment error', err && err.stack ? err.stack : err.message || err);
      return null;
    });

    console.log('[test_detect_comment] writeResult ->', writeResult);
  } catch (err) {
    console.error('[test_detect_comment] unexpected error', err && err.stack ? err.stack : err.message || err);
  }
})();
