const express = require('express');
const commentController = require('../controller/commentController.js');
const isLoggedIn = require('../util/authUtil.js');

const router = express.Router();

router.get('/:post_id/comments', isLoggedIn, commentController.getComments);
router.post('/:post_id/comments', isLoggedIn, commentController.writeComment);
router.patch('/:post_id/comments/:comment_id', isLoggedIn, commentController.updateComment);
router.delete('/:post_id/comments/:comment_id', isLoggedIn, commentController.softDeleteComment);

module.exports = router;
