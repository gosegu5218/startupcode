const express = require('express');
const router = express.Router();

const userRoute = require('./userRoute');
const postRoute = require('./postRoute');
const fileRoute = require('./fileRoute');
const commentRoute = require('./commentRoute');

router.use('/users', userRoute);
router.use('/posts', postRoute);
router.use('/files', fileRoute);
router.use('/comments', commentRoute);

module.exports = router;
